<?php
/**
 * Générer le VRAI hash pour H3LL0st@ck60*
 */

$password = 'H3LL0st@ck60*';

echo "🔐 GÉNÉRATION DU VRAI HASH\n";
echo "==========================\n\n";

// Générer le hash correct
$correctHash = password_hash($password, PASSWORD_DEFAULT);

echo "Mot de passe: $password\n";
echo "Hash correct: $correctHash\n\n";

// Tester que ça marche
if (password_verify($password, $correctHash)) {
    echo "✅ VÉRIFICATION: Le hash est CORRECT\n\n";
} else {
    echo "❌ VÉRIFICATION: Le hash est INCORRECT\n\n";
}

// Requête SQL corrigée
echo "📝 REQUÊTE SQL CORRIGÉE:\n";
echo "========================\n";
echo "UPDATE app_users SET password = '$correctHash' WHERE username = 'depot';\n\n";

// Test avec le mauvais hash que j'avais donné
$badHash = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
echo "🔍 TEST AVEC L'ANCIEN HASH:\n";
echo "===========================\n";
echo "Ancien hash: $badHash\n";
echo "Test avec H3LL0st@ck60*: " . (password_verify($password, $badHash) ? "✅ OK" : "❌ ÉCHEC") . "\n";
echo "Test avec password123: " . (password_verify('password123', $badHash) ? "✅ OK" : "❌ ÉCHEC") . "\n\n";

echo "🎯 CONCLUSION:\n";
echo "==============\n";
echo "L'ancien hash était pour un autre mot de passe !\n";
echo "Utilisez le nouveau hash ci-dessus.\n";
?>