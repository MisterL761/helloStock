<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "Test 1: PHP fonctionne<br>";

// Test connexion DB
try {
    require_once 'db.php';
    echo "Test 2: db.php chargé<br>";

    global $pdo;
    if ($pdo) {
        echo "Test 3: Connexion DB OK<br>";
    } else {
        echo "Test 3: Pas de connexion DB<br>";
    }
} catch (Exception $e) {
    echo "Erreur DB: " . $e->getMessage() . "<br>";
}

// Test classe
try {
    require_once 'stock_notifications.php';
    echo "Test 4: Script chargé<br>";
} catch (Exception $e) {
    echo "Erreur Script: " . $e->getMessage() . "<br>";
}
?>