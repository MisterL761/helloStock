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
file_put_contents("$logDir/defective.log", date('Y-m-d H:i:s') . " - Méthode: " . $_SERVER['REQUEST_METHOD'] . "\n", FILE_APPEND);

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
            // Récupérer tous les produits défectueux avec formatage de date uniforme
            $stmt = $pdo->query("SELECT id, product, supplier, client, photo_path, additional_photos, DATE_FORMAT(date, '%d/%m/%Y') as date, DATE_FORMAT(defective_date, '%d/%m/%Y') as defective_date FROM defective ORDER BY defective_date DESC");
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Traiter les photos multiples
            foreach ($result as &$item) {
                $photos_paths = [];

                // Ajouter la photo principale si elle existe
                if ($item['photo_path']) {
                    $photos_paths[] = $item['photo_path'];
                }

                // Ajouter les photos supplémentaires si elles existent
                if ($item['additional_photos']) {
                    $additionalPhotos = json_decode($item['additional_photos'], true);
                    if (is_array($additionalPhotos)) {
                        $photos_paths = array_merge($photos_paths, $additionalPhotos);
                    }
                }

                $item['photos_paths'] = $photos_paths;
                unset($item['additional_photos']); // Nettoyer la réponse
            }

            // Nettoyer la sortie avant d'envoyer le JSON
            ob_end_clean();
            echo json_encode($result);
            break;

        case 'POST':
            // Vérifier si c'est un ajout direct de produit défectueux ou un transfert depuis received
            if (isset($_POST['action']) && $_POST['action'] === 'add_defective') {
                // Ajout direct d'un produit défectueux
                $product = $_POST['product'] ?? null;
                $supplier = $_POST['supplier'] ?? null;
                $client = $_POST['client'] ?? null;
                $date = $_POST['date'] ?? date('Y-m-d');

                file_put_contents("$logDir/defective_post.log", date('Y-m-d H:i:s') . " - Ajout direct - Données POST: " . print_r($_POST, true) . "\n", FILE_APPEND);
                file_put_contents("$logDir/defective_post.log", date('Y-m-d H:i:s') . " - Ajout direct - Fichiers: " . print_r($_FILES, true) . "\n", FILE_APPEND);

                if (!$product || !$supplier || !$client) {
                    throw new Exception("Données manquantes (produit, fournisseur, client requis)");
                }

                // Gérer l'upload de photos
                $photoPath = null;
                $additionalPhotos = [];
                $allPhotoPaths = [];

                // Photo principale
                if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
                    $uploadDir = __DIR__ . '/uploads/';
                    if (!file_exists($uploadDir)) {
                        mkdir($uploadDir, 0755, true);
                    }

                    $fileExtension = pathinfo($_FILES['photo']['name'], PATHINFO_EXTENSION);
                    $fileName = uniqid() . '.' . $fileExtension;
                    $fullPath = $uploadDir . $fileName;

                    if (move_uploaded_file($_FILES['photo']['tmp_name'], $fullPath)) {
                        $photoPath = 'uploads/' . $fileName;
                        $allPhotoPaths[] = $photoPath;
                        file_put_contents("$logDir/defective_post.log", date('Y-m-d H:i:s') . " - Photo principale uploadée: $photoPath\n", FILE_APPEND);
                    } else {
                        file_put_contents("$logDir/defective_post.log", date('Y-m-d H:i:s') . " - Erreur upload photo principale\n", FILE_APPEND);
                    }
                }

                // Photos supplémentaires
                if (isset($_FILES['additional_photos']) && is_array($_FILES['additional_photos']['name'])) {
                    $uploadDir = __DIR__ . '/uploads/';
                    if (!file_exists($uploadDir)) {
                        mkdir($uploadDir, 0755, true);
                    }

                    $fileCount = count($_FILES['additional_photos']['name']);
                    for ($i = 0; $i < $fileCount; $i++) {
                        if ($_FILES['additional_photos']['error'][$i] === UPLOAD_ERR_OK) {
                            $fileExtension = pathinfo($_FILES['additional_photos']['name'][$i], PATHINFO_EXTENSION);
                            $fileName = uniqid() . '.' . $fileExtension;
                            $fullPath = $uploadDir . $fileName;

                            if (move_uploaded_file($_FILES['additional_photos']['tmp_name'][$i], $fullPath)) {
                                $additionalPhotoPath = 'uploads/' . $fileName;
                                $additionalPhotos[] = $additionalPhotoPath;
                                $allPhotoPaths[] = $additionalPhotoPath;
                                file_put_contents("$logDir/defective_post.log", date('Y-m-d H:i:s') . " - Photo supplémentaire uploadée: $additionalPhotoPath\n", FILE_APPEND);
                            }
                        }
                    }
                }

                // Insérer directement dans la table defective
                $stmt = $pdo->prepare("INSERT INTO defective (product, supplier, client, photo_path, additional_photos, date, defective_date) VALUES (?, ?, ?, ?, ?, ?, NOW())");
                $result = $stmt->execute([
                    $product,
                    $supplier,
                    $client,
                    $photoPath,
                    json_encode($additionalPhotos),
                    $date
                ]);

                if ($result) {
                    $insertId = $pdo->lastInsertId();
                    file_put_contents("$logDir/defective_post.log", date('Y-m-d H:i:s') . " - Produit défectueux ajouté directement, ID: $insertId\n", FILE_APPEND);

                    ob_end_clean();
                    echo json_encode([
                        'success' => true,
                        'id' => $insertId,
                        'photo_path' => $photoPath,
                        'photos_paths' => $allPhotoPaths
                    ]);
                } else {
                    throw new Exception("Échec de l'insertion: " . implode(", ", $stmt->errorInfo()));
                }
            } else {
                // Transfert depuis received (comportement existant)
                // Récupérer et décoder les données JSON
                $input = file_get_contents('php://input');
                $data = json_decode($input, true);
                file_put_contents("$logDir/defective_post.log", date('Y-m-d H:i:s') . " - Transfert - Données: " . print_r($data, true) . "\n", FILE_APPEND);

                if (!isset($data['id'])) {
                    throw new Exception("ID du produit manquant");
                }

                $productId = intval($data['id']);

                // Récupérer les informations du produit depuis la table received
                $stmt = $pdo->prepare("SELECT product, supplier, client, photo_path, additional_photos, date FROM received WHERE id = ?");
                $stmt->execute([$productId]);
                $product = $stmt->fetch();

                if (!$product) {
                    throw new Exception("Produit non trouvé");
                }

                // Transférer le produit vers la table defective
                $stmt = $pdo->prepare("INSERT INTO defective (product, supplier, client, photo_path, additional_photos, date, defective_date) VALUES (?, ?, ?, ?, ?, ?, NOW())");
                $result = $stmt->execute([
                    $product['product'],
                    $product['supplier'],
                    $product['client'],
                    $product['photo_path'],
                    $product['additional_photos'],
                    $product['date']
                ]);

                if ($result) {
                    // Supprimer le produit de la table received
                    $stmt = $pdo->prepare("DELETE FROM received WHERE id = ?");
                    $deleteResult = $stmt->execute([$productId]);

                    if ($deleteResult) {
                        file_put_contents("$logDir/defective_post.log", date('Y-m-d H:i:s') . " - Produit marqué comme défectueux et transféré, ID: $productId\n", FILE_APPEND);

                        ob_end_clean();
                        echo json_encode(['success' => true]);
                    } else {
                        throw new Exception("Échec de la suppression du produit de la table received: " . implode(", ", $stmt->errorInfo()));
                    }
                } else {
                    throw new Exception("Échec de l'insertion dans defective: " . implode(", ", $stmt->errorInfo()));
                }
            }
            break;

        case 'DELETE':
            // Récupérer l'ID du produit
            $id = isset($_GET['id']) ? intval($_GET['id']) : null;
            file_put_contents("$logDir/defective_delete.log", date('Y-m-d H:i:s') . " - Suppression demandée pour ID: $id\n", FILE_APPEND);

            if (!$id) {
                throw new Exception("ID manquant");
            }

            // Récupérer les chemins des photos avant suppression
            $stmt = $pdo->prepare("SELECT photo_path, additional_photos FROM defective WHERE id = ?");
            $stmt->execute([$id]);
            $product = $stmt->fetch();

            // Supprimer le produit
            $stmt = $pdo->prepare("DELETE FROM defective WHERE id = ?");
            $result = $stmt->execute([$id]);

            if ($result) {
                // Supprimer la photo principale si elle existe
                if ($product && $product['photo_path'] && file_exists(__DIR__ . '/' . $product['photo_path'])) {
                    unlink(__DIR__ . '/' . $product['photo_path']);
                    file_put_contents("$logDir/defective_delete.log", date('Y-m-d H:i:s') . " - Photo principale supprimée: " . $product['photo_path'] . "\n", FILE_APPEND);
                }

                // Supprimer les photos supplémentaires si elles existent
                if ($product && $product['additional_photos']) {
                    $additionalPhotos = json_decode($product['additional_photos'], true);
                    if (is_array($additionalPhotos)) {
                        foreach ($additionalPhotos as $photoPath) {
                            if (file_exists(__DIR__ . '/' . $photoPath)) {
                                unlink(__DIR__ . '/' . $photoPath);
                                file_put_contents("$logDir/defective_delete.log", date('Y-m-d H:i:s') . " - Photo supplémentaire supprimée: $photoPath\n", FILE_APPEND);
                            }
                        }
                    }
                }

                file_put_contents("$logDir/defective_delete.log", date('Y-m-d H:i:s') . " - Produit défectueux supprimé, ID: $id\n", FILE_APPEND);

                ob_end_clean();
                echo json_encode(['success' => true]);
            } else {
                throw new Exception("Échec de la suppression: " . implode(", ", $stmt->errorInfo()));
            }
            break;

        default:
            // Méthode non supportée
            http_response_code(405);

            ob_end_clean();
            echo json_encode(['error' => true, 'message' => 'Méthode non autorisée']);
            break;
    }

} catch (Exception $e) {
    // Journaliser l'erreur
    file_put_contents("$logDir/defective_error.log", date('Y-m-d H:i:s') . " - Erreur: " . $e->getMessage() . "\n", FILE_APPEND);

    // Définir le code d'état HTTP
    http_response_code(500);

    ob_end_clean();
    echo json_encode(['error' => true, 'message' => $e->getMessage()]);
}
?>