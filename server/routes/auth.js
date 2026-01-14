const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { writeLog } = require('../middleware/logger');

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      throw new Error("Nom d'utilisateur et mot de passe requis");
    }

    const [users] = await pool.query(
      'SELECT id, username, password, role, full_name FROM app_users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      writeLog('auth_login.log', `Connexion échouée: Utilisateur '${username}' non trouvé`);
      throw new Error('Utilisateur non trouvé');
    }

    const user = users[0];

    if (await bcrypt.compare(password, user.password)) {
      req.session.user = {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.full_name
      };

      await pool.query('UPDATE app_users SET last_login = NOW() WHERE id = ?', [user.id]);

      writeLog('auth_login.log', `Connexion réussie pour: '${username}' (ID: ${user.id})`);

      res.json({
        success: true,
        data: { user: req.session.user }
      });
    } else {
      writeLog('auth_login.log', `Connexion échouée: Mot de passe incorrect pour '${username}'`);
      throw new Error('Mot de passe incorrect');
    }
  } catch (error) {
    writeLog('auth_error.log', `Erreur: ${error.message}`);
    res.json({ success: false, message: error.message });
  }
});

router.post('/logout', (req, res) => {
  try {
    if (req.session.user) {
      const { username, id } = req.session.user;
      writeLog('auth_logout.log', `Déconnexion pour '${username}' (ID: ${id})`);
    }

    req.session.destroy((err) => {
      if (err) {
        throw new Error('Erreur lors de la déconnexion');
      }
      res.json({ success: true, message: 'Déconnexion réussie' });
    });
  } catch (error) {
    writeLog('auth_logout.log', `Erreur: ${error.message}`);
    res.json({ success: false, message: error.message });
  }
});

router.get('/check', (req, res) => {
  try {
    if (req.session && req.session.user) {
      const { username, id } = req.session.user;
      writeLog('auth_check.log', `Vérification session valide pour '${username}' (ID: ${id})`);
      res.json({ success: true, data: { user: req.session.user } });
    } else {
      writeLog('auth_check.log', 'Vérification session: Non authentifié');
      res.json({ success: false, message: 'Non authentifié' });
    }
  } catch (error) {
    writeLog('auth_check.log', `Erreur: ${error.message}`);
    res.json({ success: false, message: error.message });
  }
});

module.exports = router;
