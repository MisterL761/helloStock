<?php

session_start();

// Timeout de session de 30 minutes
$sessionTimeout = 1800; // 30 minutes en secondes

if (isset($_SESSION['LAST_ACTIVITY']) && (time() - $_SESSION['LAST_ACTIVITY'] > $sessionTimeout)) {
    session_unset();
    session_destroy();
    session_start();
}

$_SESSION['LAST_ACTIVITY'] = time();

// Headers CORS
header('Access-Control-Allow-Origin: https://hello-fermetures.com');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=utf-8');

// Gérer la requête OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// Configuration des logs
$logDir = __DIR__ . '/logs';
if (!file_exists($logDir)) {
    mkdir($logDir, 0755, true);
}

try {
    // Vérification du token pour les tâches cron (optionnel)
    $cronToken = $_GET['cron_token'] ?? null;
    $expectedCronToken = 'hello_stock_cron_2024';

    // Si un token cron est fourni, exécuter les notifications
    if ($cronToken) {
        if ($cronToken !== $expectedCronToken) {
            http_response_code(403);
            echo json_encode(['error' => true, 'message' => 'Token invalide']);
            exit;
        }
        require_once __DIR__ . '/stock_notifications.php';
        exit;
    }

    // Vérifier l'authentification pour les requêtes normales
    if (isset($_SESSION['user'])) {
        // Utilisateur authentifié
        echo json_encode([
            'authenticated' => true,
            'user' => $_SESSION['user']
        ]);
    } else {
        // Utilisateur non authentifié
        http_response_code(401);
        echo json_encode([
            'authenticated' => false,
            'message' => 'Non authentifié'
        ]);
    }

} catch (Exception $e) {
    // Log de l'erreur
    file_put_contents($logDir . '/notifications_api_error.log',
        date('Y-m-d H:i:s') . " - Erreur API: " . $e->getMessage() . "\n",
        FILE_APPEND
    );

    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Erreur lors de l\'exécution: ' . $e->getMessage()
    ]);
}
?>