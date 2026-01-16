<?php
// Démarrer la session
session_start();

// En-têtes CORS stricts
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Gérer la requête OPTIONS (pre-flight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// Désactiver l'affichage des erreurs pour ne pas polluer le JSON
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Capturer toute sortie accidentelle (warnings, echo, espaces...)
ob_start();

// Configuration pour les journaux
$logDir = __DIR__ . '/logs';
if (!file_exists($logDir)) {
    mkdir($logDir, 0755, true);
}

// Fonction helper pour envoyer une réponse JSON propre
function sendJson($data, $code = 200) {
    ob_end_clean();
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    exit;
}

try {
    // Vérifier l'authentification
    if (!isset($_SESSION['user'])) {
        sendJson(['error' => true, 'message' => 'Non authentifié'], 401);
    }

    require 'db.php';

    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            $stmt = $pdo->query("SELECT id, product, supplier, client, photo_path, additional_photos, DATE_FORMAT(date, '%d/%m/%Y') as date, 'Reçu' as status FROM received ORDER BY date DESC");
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($result as &$item) {
                $photos_paths = [];
                if (!empty($item['photo_path'])) {
                    $photos_paths[] = $item['photo_path'];
                }
                if (!empty($item['additional_photos'])) {
                    $additionalPhotos = json_decode($item['additional_photos'], true);
                    if (is_array($additionalPhotos)) {
                        $photos_paths = array_merge($photos_paths, $additionalPhotos);
                    }
                }
                $item['photos_paths'] = $photos_paths;
                unset($item['additional_photos']);
            }
            sendJson($result);
            break;

        case 'POST':
            // Données avec valeurs par défaut
            $product = !empty($_POST['product']) ? $_POST['product'] : 'Commande';
            $supplier = !empty($_POST['supplier']) ? $_POST['supplier'] : 'Dépôt';
            $client = $_POST['client'] ?? null;
            $date = $_POST['date'] ?? date('Y-m-d');
            $action = $_POST['action'] ?? 'create';

            if (!$client) {
                throw new Exception("Le nom du client est requis.");
            }

            // Gestion Uploads
            $uploadDir = __DIR__ . '/uploads/';
            if (!file_exists($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }

            $photoPath = null;
            $additionalPhotos = [];
            $allPhotoPaths = [];

            // Photo principale
            if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
                $ext = pathinfo($_FILES['photo']['name'], PATHINFO_EXTENSION);
                $name = uniqid() . '.' . $ext;
                if (move_uploaded_file($_FILES['photo']['tmp_name'], $uploadDir . $name)) {
                    $photoPath = 'uploads/' . $name;
                    $allPhotoPaths[] = $photoPath;
                }
            }

            // Photos supplémentaires
            if (isset($_FILES['additional_photos']) && is_array($_FILES['additional_photos']['name'])) {
                $count = count($_FILES['additional_photos']['name']);
                for ($i = 0; $i < $count; $i++) {
                    if ($_FILES['additional_photos']['error'][$i] === UPLOAD_ERR_OK) {
                        $ext = pathinfo($_FILES['additional_photos']['name'][$i], PATHINFO_EXTENSION);
                        $name = uniqid() . '.' . $ext;
                        if (move_uploaded_file($_FILES['additional_photos']['tmp_name'][$i], $uploadDir . $name)) {
                            $p = 'uploads/' . $name;
                            $additionalPhotos[] = $p;
                            $allPhotoPaths[] = $p;
                        }
                    }
                }
            }

            // UPDATE (avec photos)
            if ($action === 'update_with_photos' && isset($_POST['id'])) {
                $id = intval($_POST['id']);

                // Récup photos existantes
                $stmt = $pdo->prepare("SELECT photo_path, additional_photos FROM received WHERE id = ?");
                $stmt->execute([$id]);
                $existing = $stmt->fetch();
                $existAdd = ($existing && $existing['additional_photos']) ? json_decode($existing['additional_photos'], true) : [];

                $merged = array_merge(is_array($existAdd) ? $existAdd : [], $additionalPhotos);

                // On ne met à jour que les champs fournis, ou on garde les existants
                // Ici on suppose que le formulaire envoie tout ce qui est nécessaire
                $stmt = $pdo->prepare("UPDATE received SET product = ?, supplier = ?, client = ?, date = ?, photo_path = COALESCE(?, photo_path), additional_photos = ? WHERE id = ?");
                $res = $stmt->execute([$product, $supplier, $client, $date, $photoPath, json_encode($merged), $id]);

                if ($res) {
                    // Retourner les chemins complets
                    $stmt = $pdo->prepare("SELECT photo_path, additional_photos FROM received WHERE id = ?");
                    $stmt->execute([$id]);
                    $upd = $stmt->fetch();
                    $finalPaths = [];
                    if($upd['photo_path']) $finalPaths[] = $upd['photo_path'];
                    if($upd['additional_photos']) {
                        $dec = json_decode($upd['additional_photos'], true);
                        if(is_array($dec)) $finalPaths = array_merge($finalPaths, $dec);
                    }
                    sendJson(['success' => true, 'id' => $id, 'photos_paths' => $finalPaths]);
                } else {
                    throw new Exception("Erreur SQL lors de la mise à jour");
                }
            }

            // INSERT (Création)
            $stmt = $pdo->prepare("INSERT INTO received (product, supplier, client, photo_path, additional_photos, date) VALUES (?, ?, ?, ?, ?, ?)");
            $res = $stmt->execute([$product, $supplier, $client, $photoPath, json_encode($additionalPhotos), $date]);

            if ($res) {
                $id = $pdo->lastInsertId();
                sendJson([
                    'success' => true,
                    'id' => $id,
                    'photo_path' => $photoPath,
                    'photos_paths' => $allPhotoPaths
                ]);
            } else {
                throw new Exception("Erreur SQL lors de l'insertion");
            }
            break;

        case 'PUT':
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);
            if (!isset($data['id']) || !isset($data['client'])) throw new Exception("ID et Client requis");

            // Si product/supplier ne sont pas envoyés (cas du nouveau EditProductModal), on met des valeurs par défaut 'Commande'/'Dépôt'
            // Cela écrase les anciennes valeurs si elles étaient différentes, mais c'est cohérent avec votre demande de simplification.
            // Si vous vouliez conserver les valeurs, le frontend doit les renvoyer (ce que fait mon EditProductModal.jsx corrigé).
            $stmt = $pdo->prepare("UPDATE received SET product = ?, supplier = ?, client = ?, date = ? WHERE id = ?");
            $res = $stmt->execute([
                $data['product'] ?? 'Commande',
                $data['supplier'] ?? 'Dépôt',
                $data['client'],
                $data['date'] ?? date('Y-m-d'),
                $data['id']
            ]);

            if ($res) sendJson(['success' => true]);
            else throw new Exception("Erreur SQL mise à jour");
            break;

        case 'DELETE':
            $id = $_GET['id'] ?? ($_POST['id'] ?? (json_decode(file_get_contents('php://input'), true)['id'] ?? null));
            if (!$id) throw new Exception("ID manquant");

            $stmt = $pdo->prepare("SELECT photo_path, additional_photos FROM received WHERE id = ?");
            $stmt->execute([$id]);
            $prod = $stmt->fetch();

            $stmt = $pdo->prepare("DELETE FROM received WHERE id = ?");
            if ($stmt->execute([$id])) {
                if ($prod) {
                    if (!empty($prod['photo_path']) && file_exists(__DIR__ . '/' . $prod['photo_path'])) @unlink(__DIR__ . '/' . $prod['photo_path']);
                    if (!empty($prod['additional_photos'])) {
                        $arr = json_decode($prod['additional_photos'], true);
                        if (is_array($arr)) {
                            foreach ($arr as $p) if (file_exists(__DIR__ . '/' . $p)) @unlink(__DIR__ . '/' . $p);
                        }
                    }
                }
                sendJson(['success' => true]);
            } else {
                throw new Exception("Erreur SQL suppression");
            }
            break;

        default:
            sendJson(['error' => true, 'message' => 'Méthode non autorisée'], 405);
    }

} catch (Exception $e) {
    file_put_contents("$logDir/received_error.log", date('Y-m-d H:i:s') . " - " . $e->getMessage() . "\n", FILE_APPEND);
    sendJson(['error' => true, 'message' => $e->getMessage()], 500);
}
?>