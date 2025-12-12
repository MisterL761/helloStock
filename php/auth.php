<?php
session_start();

$sessionTimeout = 1800;

if (isset($_SESSION['LAST_ACTIVITY']) && (time() - $_SESSION['LAST_ACTIVITY'] > $sessionTimeout)) {
    session_unset();
    session_destroy();
    session_start();
}

$_SESSION['LAST_ACTIVITY'] = time();

ini_set('display_errors', 0);
error_reporting(E_ALL);

$logDir = __DIR__ . '/logs';
if (!file_exists($logDir)) {
    mkdir($logDir, 0755, true);
}

header('Access-Control-Allow-Origin: https://hello-fermetures.com');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

ob_start();

try {
    require 'db.php';

    header('Content-Type: application/json; charset=utf-8');

    $action = isset($_GET['action']) ? $_GET['action'] : '';

    file_put_contents("$logDir/auth.log", date('Y-m-d H:i:s') . " - Méthode: " . $_SERVER['REQUEST_METHOD'] . " - Action: $action\n", FILE_APPEND);

    switch ($action) {
        case 'login':
            handleLogin($pdo, $logDir);
            break;

        case 'logout':
            handleLogout($logDir);
            break;

        case 'check':
            checkAuth($logDir);
            break;

        default:
            throw new Exception('Action non valide');
            break;
    }

} catch (Exception $e) {
    file_put_contents("$logDir/auth_error.log", date('Y-m-d H:i:s') . " - Erreur: " . $e->getMessage() . "\n", FILE_APPEND);

    http_response_code(500);

    ob_end_clean();
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

function handleLogin($pdo, $logDir) {
    try {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);

        $logData = $data;
        if (isset($logData['password'])) {
            $logData['password'] = '******';
        }
        file_put_contents("$logDir/auth_login.log", date('Y-m-d H:i:s') . " - Données: " . print_r($logData, true) . "\n", FILE_APPEND);

        if (!isset($data['username']) || !isset($data['password'])) {
            throw new Exception('Nom d\'utilisateur et mot de passe requis');
        }

        $username = $data['username'];
        $password = $data['password'];

        $stmt = $pdo->prepare("SELECT id, username, password, role, full_name FROM app_users WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            file_put_contents("$logDir/auth_login.log", date('Y-m-d H:i:s') . " - Connexion échouée: Utilisateur '$username' non trouvé\n", FILE_APPEND);
            throw new Exception('Utilisateur non trouvé');
        }

        if (password_verify($password, $user['password'])) {

            $_SESSION['user'] = [
                'id' => $user['id'],
                'username' => $user['username'],
                'role' => $user['role'],
                'name' => $user['full_name']
            ];

            $_SESSION['LAST_ACTIVITY'] = time();

            $updateStmt = $pdo->prepare("UPDATE app_users SET last_login = NOW() WHERE id = ?");
            $updateStmt->execute([$user['id']]);

            file_put_contents("$logDir/auth_login.log", date('Y-m-d H:i:s') . " - Connexion réussie pour: '$username' (ID: {$user['id']})\n", FILE_APPEND);

            $userInfo = [
                'id' => $user['id'],
                'username' => $user['username'],
                'role' => $user['role'],
                'name' => $user['full_name']
            ];

            ob_end_clean();
            echo json_encode(['success' => true, 'data' => ['user' => $userInfo]]);

        } else {
            file_put_contents("$logDir/auth_login.log", date('Y-m-d H:i:s') . " - Connexion échouée: Mot de passe incorrect pour '$username'\n", FILE_APPEND);
            throw new Exception('Mot de passe incorrect');
        }

    } catch (Exception $e) {
        file_put_contents("$logDir/auth_login.log", date('Y-m-d H:i:s') . " - Erreur lors de la connexion: " . $e->getMessage() . "\n", FILE_APPEND);

        ob_end_clean();
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

function handleLogout($logDir) {
    try {
        // Journaliser la déconnexion
        if (isset($_SESSION['user'])) {
            $username = $_SESSION['user']['username'];
            $userId = $_SESSION['user']['id'];
            file_put_contents("$logDir/auth_logout.log", date('Y-m-d H:i:s') . " - Déconnexion pour '$username' (ID: $userId)\n", FILE_APPEND);
        } else {
            file_put_contents("$logDir/auth_logout.log", date('Y-m-d H:i:s') . " - Déconnexion pour une session non authentifiée\n", FILE_APPEND);
        }

        session_unset();
        session_destroy();

        // Répondre avec succès
        ob_end_clean();
        echo json_encode(['success' => true, 'message' => 'Déconnexion réussie']);

    } catch (Exception $e) {
        file_put_contents("$logDir/auth_logout.log", date('Y-m-d H:i:s') . " - Erreur lors de la déconnexion: " . $e->getMessage() . "\n", FILE_APPEND);

        ob_end_clean();
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

// Vérifier si l'utilisateur est connecté
function checkAuth($logDir) {
    try {
        if (isset($_SESSION['user'])) {
            $username = $_SESSION['user']['username'];
            $userId = $_SESSION['user']['id'];
            file_put_contents("$logDir/auth_check.log", date('Y-m-d H:i:s') . " - Vérification session valide pour '$username' (ID: $userId)\n", FILE_APPEND);

            ob_end_clean();
            echo json_encode(['success' => true, 'data' => ['user' => $_SESSION['user']]]);
        } else {
            file_put_contents("$logDir/auth_check.log", date('Y-m-d H:i:s') . " - Vérification session: Non authentifié\n", FILE_APPEND);

            ob_end_clean();
            echo json_encode(['success' => false, 'message' => 'Non authentifié']);
        }

    } catch (Exception $e) {
        file_put_contents("$logDir/auth_check.log", date('Y-m-d H:i:s') . " - Erreur lors de la vérification: " . $e->getMessage() . "\n", FILE_APPEND);

        ob_end_clean();
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}
?>