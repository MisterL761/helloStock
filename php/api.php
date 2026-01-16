<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
header('Content-Type: application/json; charset=utf-8');

// =======================================================
// api.php - VERSION CORRIGÉE ET STABILISÉE
// =======================================================

ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php-error.log');
error_reporting(E_ALL);

// --- En-têtes HTTP ---
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// --- Prévol (CORS) ---
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// --- Inclusion configuration / connexion BDD ---
require_once __DIR__ . '/db.php';

// --- Gestion des exceptions globales ---
set_exception_handler(function($e) {
    http_response_code(500);
    sendResponse(false, 'Erreur serveur', ['error' => $e->getMessage()]);
});

// --- Lecture de la requête ---
$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);

// Si le corps existe mais n’est pas du JSON valide
if ($rawInput && json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    sendResponse(false, 'Format JSON invalide', ['input' => $rawInput]);
}

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// =======================================================
// Fonction de réponse JSON centralisée
// =======================================================
if (!function_exists('sendResponse')) {
    function sendResponse($success, $message, $data = null) {
        echo json_encode([
            'success' => $success,
            'message' => $message,
            'data'    => $data
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

// =======================================================
// ROUTAGE PRINCIPAL
// =======================================================
switch ($action) {
    case 'products_received':
        handleProductsReceived($db, $method, $input);
        break;
    case 'products_installed':
        handleProductsInstalled($db, $method, $input);
        break;
    case 'inventory':
        handleInventory($db, $method, $input);
        break;
    case 'test':
        handleTest($db);
        break;
    default:
        http_response_code(400);
        sendResponse(false, 'Action non spécifiée');
}

// =======================================================
// PRODUITS REÇUS
// =======================================================
function handleProductsReceived($db, $method, $input) {
    switch ($method) {
        case 'GET':    getProductsReceived($db); break;
        case 'POST':   addProductReceived($db, $input); break;
        case 'PUT':    updateProductReceived($db, $input); break;
        case 'DELETE': deleteProductReceived($db, $input); break;
        default:
            http_response_code(405);
            sendResponse(false, 'Méthode non autorisée');
    }
}

function getProductsReceived($db) {
    try {
        $stmt = $db->prepare("SELECT * FROM products_received ORDER BY date DESC");
        $stmt->execute();
        sendResponse(true, 'OK', $stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (PDOException $e) {
        http_response_code(500);
        sendResponse(false, 'Erreur BDD', ['error' => $e->getMessage()]);
    }
}

function addProductReceived($db, $data) {
    if (!isset($data['product'], $data['supplier'], $data['quantity'], $data['date'])) {
        http_response_code(400);
        sendResponse(false, 'Données manquantes');
    }

    try {
        $stmt = $db->query("SELECT id FROM products_received ORDER BY id DESC LIMIT 1");
        $last = $stmt->fetch(PDO::FETCH_ASSOC);

        $newId = ($last && preg_match('/^#PR-(\d{4})$/', $last['id'], $m))
            ? '#PR-' . str_pad($m[1] + 1, 4, '0', STR_PAD_LEFT)
            : '#PR-1001';

        $stmt = $db->prepare("
            INSERT INTO products_received (id, product, supplier, quantity, date, status)
            VALUES (:id, :product, :supplier, :quantity, :date, 'Reçu')
        ");
        $stmt->execute([
            ':id'        => $newId,
            ':product'   => sanitizeInput($data['product']),
            ':supplier'  => sanitizeInput($data['supplier']),
            ':quantity'  => $data['quantity'],
            ':date'      => $data['date']
        ]);

        sendResponse(true, 'Produit ajouté', ['id' => $newId]);
    } catch (PDOException $e) {
        http_response_code(500);
        sendResponse(false, 'Erreur', ['error' => $e->getMessage()]);
    }
}

function updateProductReceived($db, $data) {
    if (empty($data['id'])) {
        http_response_code(400);
        sendResponse(false, 'ID manquant');
    }

    try {
        $fields = [];
        $params = [':id' => $data['id']];

        foreach (['product', 'supplier', 'quantity', 'date', 'status'] as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = :$field";
                $params[":$field"] = in_array($field, ['quantity']) ? $data[$field] : sanitizeInput($data[$field]);
            }
        }

        if (empty($fields)) {
            http_response_code(400);
            sendResponse(false, 'Aucune donnée à mettre à jour');
        }

        $stmt = $db->prepare("UPDATE products_received SET " . implode(', ', $fields) . " WHERE id = :id");
        $stmt->execute($params);
        sendResponse(true, 'Produit mis à jour');
    } catch (PDOException $e) {
        http_response_code(500);
        sendResponse(false, 'Erreur', ['error' => $e->getMessage()]);
    }
}

function deleteProductReceived($db, $data) {
    if (empty($data['id'])) {
        http_response_code(400);
        sendResponse(false, 'ID manquant');
    }

    try {
        $stmt = $db->prepare("DELETE FROM products_received WHERE id = :id");
        $stmt->execute([':id' => $data['id']]);
        sendResponse(true, 'Produit supprimé');
    } catch (PDOException $e) {
        http_response_code(500);
        sendResponse(false, 'Erreur', ['error' => $e->getMessage()]);
    }
}

// =======================================================
// PRODUITS POSÉS
// =======================================================
function handleProductsInstalled($db, $method, $input) {
    switch ($method) {
        case 'GET':  getProductsInstalled($db); break;
        case 'POST': markAsInstalled($db, $input); break;
        default:
            http_response_code(405);
            sendResponse(false, 'Méthode non autorisée');
    }
}

function getProductsInstalled($db) {
    try {
        $stmt = $db->query("SELECT * FROM products_installed ORDER BY installed_date DESC");
        sendResponse(true, 'OK', $stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (PDOException $e) {
        http_response_code(500);
        sendResponse(false, 'Erreur', ['error' => $e->getMessage()]);
    }
}

function markAsInstalled($db, $data) {
    if (empty($data['product_id']) || empty($data['installed_date'])) {
        http_response_code(400);
        sendResponse(false, 'Données manquantes');
    }

    try {
        $stmt = $db->prepare("SELECT * FROM products_received WHERE id = :id");
        $stmt->execute([':id' => $data['product_id']]);
        $product = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$product) {
            http_response_code(404);
            sendResponse(false, 'Produit non trouvé');
        }

        $stmt = $db->query("SELECT id FROM products_installed ORDER BY id DESC LIMIT 1");
        $last = $stmt->fetch(PDO::FETCH_ASSOC);

        $newId = ($last && preg_match('/^#PI-(\d{4})$/', $last['id'], $m))
            ? '#PI-' . str_pad($m[1] + 1, 4, '0', STR_PAD_LEFT)
            : '#PI-1001';

        $stmt = $db->prepare("
            INSERT INTO products_installed (id, product, supplier, quantity, date, installed_date)
            VALUES (:id, :product, :supplier, :quantity, :date, :installed_date)
        ");
        $stmt->execute([
            ':id'             => $newId,
            ':product'        => $product['product'],
            ':supplier'       => $product['supplier'],
            ':quantity'       => $product['quantity'],
            ':date'           => $product['date'],
            ':installed_date' => $data['installed_date']
        ]);

        $stmt = $db->prepare("UPDATE products_received SET status = 'Posé' WHERE id = :id");
        $stmt->execute([':id' => $data['product_id']]);

        sendResponse(true, 'Produit posé', ['id' => $newId]);
    } catch (PDOException $e) {
        http_response_code(500);
        sendResponse(false, 'Erreur', ['error' => $e->getMessage()]);
    }
}

// =======================================================
// INVENTAIRE
// =======================================================
function handleInventory($db, $method, $input) {
    switch ($method) {
        case 'GET':    getInventoryItems($db); break;
        case 'POST':   addInventoryItem($db, $input); break;
        case 'PUT':    updateInventoryItem($db, $input); break;
        case 'DELETE': deleteInventoryItem($db, $input); break;
        default:
            http_response_code(405);
            sendResponse(false, 'Méthode non autorisée');
    }
}

function getInventoryItems($db) {
    try {
        $stmt = $db->query("SELECT * FROM inventory_items ORDER BY material ASC");
        sendResponse(true, 'OK', $stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (PDOException $e) {
        http_response_code(500);
        sendResponse(false, 'Erreur', ['error' => $e->getMessage()]);
    }
}

function addInventoryItem($db, $data) {
    if (!isset($data['material'], $data['supplier'], $data['category'], $data['stock'], $data['threshold'])) {
        http_response_code(400);
        sendResponse(false, 'Données manquantes');
    }

    try {
        $stmt = $db->query("SELECT id FROM inventory_items ORDER BY id DESC LIMIT 1");
        $last = $stmt->fetch(PDO::FETCH_ASSOC);

        $newId = ($last && preg_match('/^#INV-(\d{4})$/', $last['id'], $m))
            ? '#INV-' . str_pad($m[1] + 1, 4, '0', STR_PAD_LEFT)
            : '#INV-1001';

        $status = $data['stock'] == 0 ? 'Rupture' :
            ($data['stock'] < $data['threshold'] ? 'Faible Stock' : 'Disponible');

        $stmt = $db->prepare("
            INSERT INTO inventory_items (id, material, supplier, category, stock, threshold, status)
            VALUES (:id, :material, :supplier, :category, :stock, :threshold, :status)
        ");
        $stmt->execute([
            ':id'        => $newId,
            ':material'  => sanitizeInput($data['material']),
            ':supplier'  => sanitizeInput($data['supplier']),
            ':category'  => sanitizeInput($data['category']),
            ':stock'     => $data['stock'],
            ':threshold' => $data['threshold'],
            ':status'    => $status
        ]);

        sendResponse(true, 'Article ajouté', ['id' => $newId, 'status' => $status]);
    } catch (PDOException $e) {
        http_response_code(500);
        sendResponse(false, 'Erreur', ['error' => $e->getMessage()]);
    }
}

function updateInventoryItem($db, $data) {
    if (empty($data['id'])) {
        http_response_code(400);
        sendResponse(false, 'ID manquant');
    }

    try {
        $fields = [];
        $params = [':id' => $data['id']];

        foreach (['material', 'supplier', 'category', 'stock', 'threshold'] as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = :$field";
                $params[":$field"] = in_array($field, ['stock', 'threshold'])
                    ? $data[$field]
                    : sanitizeInput($data[$field]);
            }
        }

        if (!empty($data['stock']) || !empty($data['threshold'])) {
            $stmt = $db->prepare("SELECT stock, threshold FROM inventory_items WHERE id = :id");
            $stmt->execute([':id' => $data['id']]);
            $current = $stmt->fetch(PDO::FETCH_ASSOC);

            $stock = $data['stock'] ?? $current['stock'];
            $threshold = $data['threshold'] ?? $current['threshold'];
            $status = $stock == 0 ? 'Rupture' : ($stock < $threshold ? 'Faible Stock' : 'Disponible');

            $fields[] = "status = :status";
            $params[':status'] = $status;
        }

        if (empty($fields)) {
            http_response_code(400);
            sendResponse(false, 'Aucune donnée à mettre à jour');
        }

        $stmt = $db->prepare("UPDATE inventory_items SET " . implode(', ', $fields) . " WHERE id = :id");
        $stmt->execute($params);

        sendResponse(true, 'Article mis à jour');
    } catch (PDOException $e) {
        http_response_code(500);
        sendResponse(false, 'Erreur', ['error' => $e->getMessage()]);
    }
}

function deleteInventoryItem($db, $data) {
    if (empty($data['id'])) {
        http_response_code(400);
        sendResponse(false, 'ID manquant');
    }

    try {
        $stmt = $db->prepare("DELETE FROM inventory_items WHERE id = :id");
        $stmt->execute([':id' => $data['id']]);
        sendResponse(true, 'Article supprimé');
    } catch (PDOException $e) {
        http_response_code(500);
        sendResponse(false, 'Erreur', ['error' => $e->getMessage()]);
    }
}

// =======================================================
// Sécurisation des entrées
// =======================================================
function sanitizeInput($input) {
    return htmlspecialchars(strip_tags(trim($input)), ENT_QUOTES, 'UTF-8');
}

function handleTest($db) {
    try {
        // Vérification basique de la connexion BDD
        $stmt = $db->query("SELECT NOW() AS server_time");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        sendResponse(true, 'API opérationnelle ✅', [
            'server_time' => $result['server_time'],
            'database_status' => 'Connectée',
            'php_version' => PHP_VERSION,
            'script' => basename(__FILE__)
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        sendResponse(false, 'Erreur de connexion BDD ❌', [
            'error' => $e->getMessage()
        ]);
    }
}


?>

