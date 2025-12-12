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
file_put_contents("$logDir/tools.log", date('Y-m-d H:i:s') . " - Méthode: " . $_SERVER['REQUEST_METHOD'] . "\n", FILE_APPEND);

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
            // Récupérer tous les outils
            $stmt = $pdo->query("SELECT id, name, supplier, quantity FROM tools ORDER BY name ASC");
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Nettoyer la sortie avant d'envoyer le JSON
            ob_end_clean();
            echo json_encode($result);
            break;

        case 'POST':
            // Récupérer et décoder les données JSON
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);
            file_put_contents("$logDir/tools_post.log", date('Y-m-d H:i:s') . " - Données: " . print_r($data, true) . "\n", FILE_APPEND);

            if (!isset($data['name']) || !isset($data['supplier']) || !isset($data['quantity'])) {
                throw new Exception("Données manquantes");
            }

            // Vérifier si un outil similaire existe déjà
            $checkStmt = $pdo->prepare("SELECT id FROM tools WHERE name = ? AND supplier = ?");
            $checkStmt->execute([
                $data['name'],
                $data['supplier']
            ]);

            if ($checkStmt->rowCount() > 0) {
                // Outil similaire existe déjà
                $existingId = $checkStmt->fetchColumn();
                file_put_contents("$logDir/tools_post.log", date('Y-m-d H:i:s') . " - Outil similaire existant, ID: $existingId\n", FILE_APPEND);

                // Nettoyer la sortie avant d'envoyer le JSON
                ob_end_clean();
                echo json_encode(['success' => true, 'id' => $existingId, 'message' => 'Outil similaire déjà existant']);
                exit;
            }

            // Insérer l'outil
            $stmt = $pdo->prepare("INSERT INTO tools (name, supplier, quantity) VALUES (?, ?, ?)");
            $result = $stmt->execute([
                $data['name'],
                $data['supplier'],
                intval($data['quantity'])
            ]);

            if ($result) {
                $insertId = $pdo->lastInsertId();
                file_put_contents("$logDir/tools_post.log", date('Y-m-d H:i:s') . " - Outil ajouté, ID: $insertId\n", FILE_APPEND);

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
            file_put_contents("$logDir/tools_put.log", date('Y-m-d H:i:s') . " - Données: " . print_r($data, true) . "\n", FILE_APPEND);

            if (!isset($data['id']) || !isset($data['name']) || !isset($data['supplier']) || !isset($data['quantity'])) {
                throw new Exception("Données manquantes");
            }

            // Mettre à jour l'outil
            $stmt = $pdo->prepare("UPDATE tools SET name = ?, supplier = ?, quantity = ? WHERE id = ?");
            $result = $stmt->execute([
                $data['name'],
                $data['supplier'],
                intval($data['quantity']),
                $data['id']
            ]);

            if ($result) {
                file_put_contents("$logDir/tools_put.log", date('Y-m-d H:i:s') . " - Outil mis à jour, ID: " . $data['id'] . "\n", FILE_APPEND);

                // Nettoyer la sortie avant d'envoyer le JSON
                ob_end_clean();
                echo json_encode(['success' => true]);
            } else {
                throw new Exception("Échec de la mise à jour: " . implode(", ", $stmt->errorInfo()));
            }
            break;

        case 'DELETE':
            // Récupérer l'ID de l'outil
            $id = isset($_GET['id']) ? intval($_GET['id']) : null;
            file_put_contents("$logDir/tools_delete.log", date('Y-m-d H:i:s') . " - Suppression demandée pour ID: $id\n", FILE_APPEND);

            if (!$id) {
                throw new Exception("ID manquant");
            }

            // Supprimer l'outil
            $stmt = $pdo->prepare("DELETE FROM tools WHERE id = ?");
            $result = $stmt->execute([$id]);

            if ($result) {
                file_put_contents("$logDir/tools_delete.log", date('Y-m-d H:i:s') . " - Outil supprimé, ID: $id\n", FILE_APPEND);

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
    file_put_contents("$logDir/tools_error.log", date('Y-m-d H:i:s') . " - Erreur: " . $e->getMessage() . "\n", FILE_APPEND);

    // Définir le code d'état HTTP
    http_response_code(500);

    // Nettoyer la sortie avant d'envoyer le JSON
    ob_end_clean();
    echo json_encode(['error' => true, 'message' => $e->getMessage()]);
}
?>