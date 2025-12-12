<?php

// Démarrer la session
session_start();

// Vérifier si l'utilisateur est authentifié
if (!isset($_SESSION['user'])) {
    header('Content-Type: application/json');
    http_response_code(401);
    echo json_encode(['error' => true, 'message' => 'Non authentifié']);
    exit;
}

// Désactiver l'affichage des erreurs dans la sortie
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Configuration pour les journaux
$logDir = __DIR__ . '/logs';
if (!file_exists($logDir)) {
    mkdir($logDir, 0755, true);
}

// Journaliser les requêtes
file_put_contents("$logDir/inventory.log", date('Y-m-d H:i:s') . " - Méthode: " . $_SERVER['REQUEST_METHOD'] . "\n", FILE_APPEND);

// En-têtes CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Gérer la requête OPTIONS (pre-flight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// Capturer toute sortie accidentelle
ob_start();

try {
    // Inclure le fichier de connexion à la base de données
    require 'db.php';

    // Définir l'en-tête de type de contenu
    header('Content-Type: application/json; charset=utf-8');

    // Traiter selon la méthode HTTP
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            // Récupérer tous les articles de l'inventaire avec information de commande ET prix
            $stmt = $pdo->query("SELECT i.id, i.material, i.supplier, i.category, i.stock, i.threshold, i.price,
                                CASE 
                                    WHEN i.stock = 0 THEN 'Rupture'
                                    WHEN i.stock < i.threshold THEN 'Faible Stock'
                                    ELSE 'Disponible'
                                END AS status,
                                COALESCE(o.is_ordered, 0) as is_ordered,
                                o.ordered_quantity,
                                o.ordered_date
                                FROM inventory i 
                                LEFT JOIN orders o ON i.id = o.inventory_id AND o.is_ordered = 1
                                ORDER BY i.material ASC");
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Nettoyer la sortie avant d'envoyer le JSON
            ob_end_clean();
            echo json_encode($result);
            break;

        case 'POST':
            // Récupérer et décoder les données JSON
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);
            file_put_contents("$logDir/inventory_post.log", date('Y-m-d H:i:s') . " - Données: " . print_r($data, true) . "\n", FILE_APPEND);

            if (!isset($data['material']) || !isset($data['supplier']) || !isset($data['category']) || !isset($data['stock']) || !isset($data['threshold'])) {
                throw new Exception("Données manquantes");
            }

            // Insérer l'article AVEC prix
            $stmt = $pdo->prepare("INSERT INTO inventory (material, supplier, category, stock, threshold, price) VALUES (?, ?, ?, ?, ?, ?)");
            $result = $stmt->execute([
                $data['material'],
                $data['supplier'],
                $data['category'],
                $data['stock'],
                $data['threshold'],
                $data['price'] ?? null
            ]);

            if ($result) {
                $insertId = $pdo->lastInsertId();
                file_put_contents("$logDir/inventory_post.log", date('Y-m-d H:i:s') . " - Article ajouté, ID: $insertId\n", FILE_APPEND);

                // Nettoyer la sortie avant d'envoyer le JSON
                ob_end_clean();
                echo json_encode(['success' => true, 'id' => $insertId]);
            } else {
                throw new Exception("Échec de l'insertion: " . implode(", ", $stmt->errorInfo()));
            }
            break;

        case 'PUT':
            // Récupérer et décoder les données JSON
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);
            file_put_contents("$logDir/inventory_put.log", date('Y-m-d H:i:s') . " - Données: " . print_r($data, true) . "\n", FILE_APPEND);

            if (!isset($data['id'])) {
                throw new Exception("ID de l'article manquant");
            }

            // Préparer la requête de mise à jour en fonction des données fournies
            $fields = [];
            $params = [];

            if (isset($data['material'])) {
                $fields[] = "material = ?";
                $params[] = $data['material'];
            }

            if (isset($data['supplier'])) {
                $fields[] = "supplier = ?";
                $params[] = $data['supplier'];
            }

            if (isset($data['category'])) {
                $fields[] = "category = ?";
                $params[] = $data['category'];
            }

            if (isset($data['stock'])) {
                $fields[] = "stock = ?";
                $params[] = $data['stock'];
            }

            if (isset($data['threshold'])) {
                $fields[] = "threshold = ?";
                $params[] = $data['threshold'];
            }

            // AJOUT : Gestion du prix
            if (isset($data['price'])) {
                $fields[] = "price = ?";
                $params[] = $data['price'];
            }

            if (empty($fields)) {
                throw new Exception("Aucune donnée à mettre à jour");
            }

            // Ajouter l'ID à la fin des paramètres
            $params[] = $data['id'];

            // Construire et exécuter la requête
            $sql = "UPDATE inventory SET " . implode(", ", $fields) . " WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $result = $stmt->execute($params);

            if ($result) {
                file_put_contents("$logDir/inventory_put.log", date('Y-m-d H:i:s') . " - Article mis à jour, ID: " . $data['id'] . "\n", FILE_APPEND);

                // Si le stock a été mis à jour et qu'il est maintenant suffisant,
                // supprimer automatiquement la commande associée
                if (isset($data['stock']) && isset($data['threshold'])) {
                    if ($data['stock'] >= $data['threshold']) {
                        $deleteOrderStmt = $pdo->prepare("DELETE FROM orders WHERE inventory_id = ?");
                        $deleteOrderStmt->execute([$data['id']]);
                        file_put_contents("$logDir/inventory_put.log", date('Y-m-d H:i:s') . " - Commande supprimée pour article ID: " . $data['id'] . " (stock suffisant)\n", FILE_APPEND);
                    }
                }

                // Nettoyer la sortie avant d'envoyer le JSON
                ob_end_clean();
                echo json_encode(['success' => true]);
            } else {
                throw new Exception("Échec de la mise à jour: " . implode(", ", $stmt->errorInfo()));
            }
            break;

        case 'DELETE':
            // Récupérer l'ID de l'article
            $id = isset($_GET['id']) ? intval($_GET['id']) : null;
            file_put_contents("$logDir/inventory_delete.log", date('Y-m-d H:i:s') . " - Suppression demandée pour ID: $id\n", FILE_APPEND);

            if (!$id) {
                throw new Exception("ID manquant");
            }

            // Supprimer d'abord toutes les commandes liées à cet article
            $deleteOrdersStmt = $pdo->prepare("DELETE FROM orders WHERE inventory_id = ?");
            $deleteOrdersStmt->execute([$id]);

            // Supprimer l'article
            $stmt = $pdo->prepare("DELETE FROM inventory WHERE id = ?");
            $result = $stmt->execute([$id]);

            if ($result) {
                file_put_contents("$logDir/inventory_delete.log", date('Y-m-d H:i:s') . " - Article supprimé, ID: $id\n", FILE_APPEND);

                // Nettoyer la sortie avant d'envoyer le JSON
                ob_end_clean();
                echo json_encode(['success' => true]);
            } else {
                throw new Exception("Échec de la suppression: " . implode(", ", $stmt->errorInfo()));
            }
            break;

        default:
            // Méthode non supportée
            http_response_code(405);

            // Nettoyer la sortie avant d'envoyer le JSON
            ob_end_clean();
            echo json_encode(['error' => true, 'message' => 'Méthode non autorisée']);
            break;
    }

} catch (Exception $e) {
    // Journaliser l'erreur
    file_put_contents("$logDir/inventory_error.log", date('Y-m-d H:i:s') . " - Erreur: " . $e->getMessage() . "\n", FILE_APPEND);

    // Définir le code d'état HTTP
    http_response_code(500);

    // Nettoyer la sortie avant d'envoyer le JSON
    ob_end_clean();
    echo json_encode(['error' => true, 'message' => $e->getMessage()]);
}
?>