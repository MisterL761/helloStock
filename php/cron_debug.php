<?php
/**
 * CRON avec chemins absolus - Corrige les problèmes d'automatisation
 */

// Logs de debug
$logFile = '/home/helloferep/www/hello-stock/php/logs/cron_debug.log';
file_put_contents($logFile, date('Y-m-d H:i:s') . " - CRON automatique démarré\n", FILE_APPEND);

try {
    // Définir le répertoire de travail
    $baseDir = '/home/helloferep/www/hello-stock/php';
    chdir($baseDir);

    file_put_contents($logFile, date('Y-m-d H:i:s') . " - Répertoire changé vers: " . getcwd() . "\n", FILE_APPEND);

    // Vérifier que les fichiers existent
    if (!file_exists('db.php')) {
        throw new Exception('Fichier db.php introuvable');
    }

    if (!file_exists('stock_notifications.php')) {
        throw new Exception('Fichier stock_notifications.php introuvable');
    }

    file_put_contents($logFile, date('Y-m-d H:i:s') . " - Fichiers vérifiés OK\n", FILE_APPEND);

    // Capturer la sortie du script
    ob_start();
    include 'stock_notifications.php';
    $output = ob_get_clean();

    file_put_contents($logFile, date('Y-m-d H:i:s') . " - Script exécuté, sortie: " . $output . "\n", FILE_APPEND);

    echo $output;

} catch (Exception $e) {
    $error = date('Y-m-d H:i:s') . " - ERREUR CRON: " . $e->getMessage() . "\n";
    file_put_contents($logFile, $error, FILE_APPEND);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

file_put_contents($logFile, date('Y-m-d H:i:s') . " - CRON automatique terminé\n", FILE_APPEND);
?>