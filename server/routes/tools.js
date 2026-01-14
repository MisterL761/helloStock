const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { writeLog } = require('../middleware/logger');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const [tools] = await pool.query(
      'SELECT id, name, supplier, quantity FROM tools ORDER BY name ASC'
    );

    res.json(tools);
  } catch (error) {
    writeLog('tools_error.log', `Erreur: ${error.message}`);
    res.status(500).json({ error: true, message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, supplier, quantity } = req.body;

    if (!name || !supplier || quantity === undefined) {
      throw new Error('Données manquantes');
    }

    const [existing] = await pool.query(
      'SELECT id FROM tools WHERE name = ? AND supplier = ?',
      [name, supplier]
    );

    if (existing.length > 0) {
      writeLog('tools_post.log', `Outil similaire existant, ID: ${existing[0].id}`);
      res.json({ success: true, id: existing[0].id, message: 'Outil similaire déjà existant' });
      return;
    }

    const [result] = await pool.query(
      'INSERT INTO tools (name, supplier, quantity) VALUES (?, ?, ?)',
      [name, supplier, parseInt(quantity)]
    );

    writeLog('tools_post.log', `Outil ajouté, ID: ${result.insertId}`);
    res.json({ success: true, id: result.insertId });
  } catch (error) {
    writeLog('tools_error.log', `Erreur: ${error.message}`);
    res.status(500).json({ error: true, message: error.message });
  }
});

router.put('/', async (req, res) => {
  try {
    const { id, name, supplier, quantity } = req.body;

    if (!id || !name || !supplier || quantity === undefined) {
      throw new Error('Données manquantes');
    }

    await pool.query(
      'UPDATE tools SET name = ?, supplier = ?, quantity = ? WHERE id = ?',
      [name, supplier, parseInt(quantity), id]
    );

    writeLog('tools_put.log', `Outil mis à jour, ID: ${id}`);
    res.json({ success: true });
  } catch (error) {
    writeLog('tools_error.log', `Erreur: ${error.message}`);
    res.status(500).json({ error: true, message: error.message });
  }
});

router.delete('/', async (req, res) => {
  try {
    const id = parseInt(req.query.id);

    if (!id) {
      throw new Error('ID manquant');
    }

    await pool.query('DELETE FROM tools WHERE id = ?', [id]);

    writeLog('tools_delete.log', `Outil supprimé, ID: ${id}`);
    res.json({ success: true });
  } catch (error) {
    writeLog('tools_error.log', `Erreur: ${error.message}`);
    res.status(500).json({ error: true, message: error.message });
  }
});

module.exports = router;
