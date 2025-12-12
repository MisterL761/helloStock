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
file_put_contents("$logDir/received.log", date('Y-m-d H:i:s') . " - Méthode: " . $_SERVER['REQUEST_METHOD'] . "\n", FILE_APPEND);

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
            // Récupérer tous les produits reçus avec formatage de date uniforme et photos multiples
            $stmt = $pdo->query("SELECT id, product, supplier, client, photo_path, additional_photos, DATE_FORMAT(date, '%d/%m/%Y') as date, 'Reçu' as status FROM received ORDER BY date DESC");
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
            $product = $_POST['product'] ?? null;
            $supplier = $_POST['supplier'] ?? null;
            $client = $_POST['client'] ?? null;
            $date = $_POST['date'] ?? date('Y-m-d');
            $action = $_POST['action'] ?? 'create';

            file_put_contents("$logDir/received_post.log", date('Y-m-d H:i:s') . " - Données POST: " . print_r($_POST, true) . "\n", FILE_APPEND);
            file_put_contents("$logDir/received_post.log", date('Y-m-d H:i:s') . " - Fichiers: " . print_r($_FILES, true) . "\n", FILE_APPEND);

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
                    file_put_contents("$logDir/received_post.log", date('Y-m-d H:i:s') . " - Photo principale uploadée: $photoPath\n", FILE_APPEND);
                } else {
                    file_put_contents("$logDir/received_post.log", date('Y-m-d H:i:s') . " - Erreur upload photo principale\n", FILE_APPEND);
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
                            file_put_contents("$logDir/received_post.log", date('Y-m-d H:i:s') . " - Photo supplémentaire uploadée: $additionalPhotoPath\n", FILE_APPEND);
                        }
                    }
                }
            }

            // Pour l'édition avec photos
            if ($action === 'update_with_photos' && isset($_POST['id'])) {
                $id = intval($_POST['id']);

                // Récupérer les photos existantes
                $stmt = $pdo->prepare("SELECT photo_path, additional_photos FROM received WHERE id = ?");
                $stmt->execute([$id]);
                $existing = $stmt->fetch();

                $existingAdditionalPhotos = [];
                if ($existing && $existing['additional_photos']) {
                    $existingAdditionalPhotos = json_decode($existing['additional_photos'], true) ?: [];
                }

                // Fusionner avec les nouvelles photos
                $mergedAdditionalPhotos = array_merge($existingAdditionalPhotos, $additionalPhotos);

                // Mettre à jour le produit avec les nouvelles photos
                $stmt = $pdo->prepare("UPDATE received SET product = ?, supplier = ?, client = ?, date = ?, photo_path = COALESCE(?, photo_path), additional_photos = ? WHERE id = ?");
                $result = $stmt->execute([
                    $product,
                    $supplier,
                    $client,
                    $date,
                    $photoPath,
                    json_encode($mergedAdditionalPhotos),
                    $id
                ]);

                if ($result) {
                    // Récupérer les données mises à jour pour la réponse
                    $stmt = $pdo->prepare("SELECT photo_path, additional_photos FROM received WHERE id = ?");
                    $stmt->execute([$id]);
                    $updated = $stmt->fetch();

                    $finalPhotoPaths = [];
                    if ($updated['photo_path']) {
                        $finalPhotoPaths[] = $updated['photo_path'];
                    }
                    if ($updated['additional_photos']) {
                        $additionalArray = json_decode($updated['additional_photos'], true);
                        if (is_array($additionalArray)) {
                            $finalPhotoPaths = array_merge($finalPhotoPaths, $additionalArray);
                        }
                    }

                    file_put_contents("$logDir/received_post.log", date('Y-m-d H:i:s') . " - Produit mis à jour avec photos, ID: $id\n", FILE_APPEND);

                    ob_end_clean();
                    echo json_encode(['success' => true, 'id' => $id, 'photos_paths' => $finalPhotoPaths]);
                } else {
                    throw new Exception("Échec de la mise à jour: " . implode(", ", $stmt->errorInfo()));
                }
                break;
            }

            // Création normale
            // Vérifier si un produit similaire existe déjà
            $checkStmt = $pdo->prepare("SELECT id FROM received WHERE product = ? AND supplier = ? AND client = ? AND DATE(date) = DATE(?)");
            $checkStmt->execute([$product, $supplier, $client, $date]);

            if ($checkStmt->rowCount() > 0) {
                // Produit similaire existe déjà
                $existingId = $checkStmt->fetchColumn();
                file_put_contents("$logDir/received_post.log", date('Y-m-d H:i:s') . " - Produit similaire existant, ID: $existingId\n", FILE_APPEND);

                ob_end_clean();
                echo json_encode(['success' => true, 'id' => $existingId, 'message' => 'Produit similaire déjà existant']);
                exit;
            }

            // Insérer le produit avec photos multiples
            $stmt = $pdo->prepare("INSERT INTO received (product, supplier, client, photo_path, additional_photos, date) VALUES (?, ?, ?, ?, ?, ?)");
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
                file_put_contents("$logDir/received_post.log", date('Y-m-d H:i:s') . " - Produit ajouté avec photos, ID: $insertId\n", FILE_APPEND);

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
            break;

        case 'PUT':
            // Récupérer et décoder les données JSON
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);
            file_put_contents("$logDir/received_put.log", date('Y-m-d H:i:s') . " - Données: " . print_r($data, true) . "\n", FILE_APPEND);

            if (!isset($data['id']) || !isset($data['product']) || !isset($data['supplier']) || !isset($data['client'])) {
                throw new Exception("Données manquantes");
            }

            // Préparer la date
            $date = isset($data['date']) ? $data['date'] : date('Y-m-d');

            // Mettre à jour le produit (sans modifier les photos)
            $stmt = $pdo->prepare("UPDATE received SET product = ?, supplier = ?, client = ?, date = ? WHERE id = ?");
            $result = $stmt->execute([
                $data['product'],
                $data['supplier'],
                $data['client'],
                $date,
                $data['id']
            ]);

            if ($result) {
                file_put_contents("$logDir/received_put.log", date('Y-m-d H:i:s') . " - Produit mis à jour, ID: " . $data['id'] . "\n", FILE_APPEND);

                ob_end_clean();
                echo json_encode(['success' => true]);
            } else {
                throw new Exception("Échec de la mise à jour: " . implode(", ", $stmt->errorInfo()));
            }
            break;

        case 'DELETE':
            // Récupérer l'ID du produit
            $id = isset($_GET['id']) ? intval($_GET['id']) : null;
            file_put_contents("$logDir/received_delete.log", date('Y-m-d H:i:s') . " - Suppression demandée pour ID: $id\n", FILE_APPEND);

            if (!$id) {
                throw new Exception("ID manquant");
            }

            // Récupérer les chemins des photos avant suppression
            $stmt = $pdo->prepare("SELECT photo_path, additional_photos FROM received WHERE id = ?");
            $stmt->execute([$id]);
            $product = $stmt->fetch();

            // Supprimer le produit
            $stmt = $pdo->prepare("DELETE FROM received WHERE id = ?");
            $result = $stmt->execute([$id]);

            if ($result) {
                // Supprimer la photo principale si elle existe
                if ($product && $product['photo_path'] && file_exists(__DIR__ . '/' . $product['photo_path'])) {
                    unlink(__DIR__ . '/' . $product['photo_path']);
                    file_put_contents("$logDir/received_delete.log", date('Y-m-d H:i:s') . " - Photo principale supprimée: " . $product['photo_path'] . "\n", FILE_APPEND);
                }

                // Supprimer les photos supplémentaires si elles existent
                if ($product && $product['additional_photos']) {
                    $additionalPhotos = json_decode($product['additional_photos'], true);
                    if (is_array($additionalPhotos)) {
                        foreach ($additionalPhotos as $photoPath) {
                            if (file_exists(__DIR__ . '/' . $photoPath)) {
                                unlink(__DIR__ . '/' . $photoPath);
                                file_put_contents("$logDir/received_delete.log", date('Y-m-d H:i:s') . " - Photo supplémentaire supprimée: $photoPath\n", FILE_APPEND);
                            }
                        }
                    }
                }

                file_put_contents("$logDir/received_delete.log", date('Y-m-d H:i:s') . " - Produit supprimé, ID: $id\n", FILE_APPEND);

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
    file_put_contents("$logDir/received_error.log", date('Y-m-d H:i:s') . " - Erreur: " . $e->getMessage() . "\n", FILE_APPEND);

    // Définir le code d'état HTTP
    http_response_code(500);

    ob_end_clean();
    echo json_encode(['error' => true, 'message' => $e->getMessage()]);
}
?>