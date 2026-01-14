const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { writeLog } = require('../middleware/logger');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const [items] = await pool.query(
      'SELECT id, received_id, product, supplier, quantity, installed_date, client, photos_paths FROM installed ORDER BY installed_date DESC'
    );

    items.forEach(item => {
      item.client = item.client || '';
      if (item.photos_paths && item.photos_paths !== 'NULL') {
        try {
          const decoded = JSON.parse(item.photos_paths);
          item.photos_paths = Array.isArray(decoded) ? decoded : [];
        } catch (e) {
          item.photos_paths = [];
        }
      } else {
        item.photos_paths = [];
      }
      item.date = item.installed_date;
    });

    res.json(items);
  } catch (error) {
    writeLog('installed_error.log', `Erreur: ${error.message}`);
    res.status(500).json({ error: true, message: error.message });
  }
});

router.post('/', async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { id, client, quantity = 1, photos_paths } = req.body;

    if (!id) {
      throw new Error('ID du produit manquant');
    }

    const [products] = await connection.query(
      'SELECT * FROM received WHERE id = ?',
      [id]
    );

    if (products.length === 0) {
      throw new Error('Produit non trouvé');
    }

    const product = products[0];
    const finalClient = client || product.client || '';
    let finalPhotoPaths = null;

    if (photos_paths && Array.isArray(photos_paths)) {
      finalPhotoPaths = JSON.stringify(photos_paths);
    } else if (product.photos_paths) {
      finalPhotoPaths = product.photos_paths;
    } else if (product.photo_path) {
      finalPhotoPaths = JSON.stringify([product.photo_path]);
    }

    await connection.beginTransaction();

    const [result] = await connection.query(
      'INSERT INTO installed (received_id, product, supplier, quantity, installed_date, client, photos_paths) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [product.id, product.product, product.supplier, quantity, new Date(), finalClient, finalPhotoPaths]
    );

    await connection.query('DELETE FROM received WHERE id = ?', [product.id]);

    await connection.commit();

    res.json({ success: true, id: result.insertId });
  } catch (error) {
    await connection.rollback();
    writeLog('installed_error.log', `Erreur: ${error.message}`);
    res.status(500).json({ error: true, message: error.message });
  } finally {
    connection.release();
  }
});

router.delete('/', async (req, res) => {
  try {
    const id = parseInt(req.query.id || req.body.id || 0);

    if (!id) {
      throw new Error('ID manquant');
    }

    await pool.query('DELETE FROM installed WHERE id = ?', [id]);

    res.json({ success: true });
  } catch (error) {
    writeLog('installed_error.log', `Erreur: ${error.message}`);
    res.status(500).json({ error: true, message: error.message });
  }
});

module.exports = router;
