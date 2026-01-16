const bcrypt = require('bcryptjs');

const password = process.argv[2] || 'H3LL0st@ck60*';

async function generateHash() {
  const hash = await bcrypt.hash(password, 10);

  console.log('='.repeat(50));
  console.log('Génération du hash pour le mot de passe');
  console.log('='.repeat(50));
  console.log(`Mot de passe: ${password}`);
  console.log(`Hash généré: ${hash}`);
  console.log('='.repeat(50));
  console.log('\nRequête SQL:');
  console.log(`UPDATE app_users SET password = '${hash}' WHERE username = 'depot';`);
  console.log('='.repeat(50));

  const isValid = await bcrypt.compare(password, hash);
  console.log(`\nVérification: ${isValid ? '✓ Hash valide' : '✗ Hash invalide'}`);
}

generateHash();
