const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { writeLog } = require('../middleware/logger');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const [items] = await pool.query(`
      SELECT i.id, i.material, i.supplier, i.category, i.stock, i.threshold, i.price,
        CASE
          WHEN i.stock = 0 THEN 'Rupture'
          WHEN i.stock < i.threshold THEN 'Faible Stock'
          ELSE 'Disponible'
        END AS status,
        COALESCE(o.is_ordered, 0) as is_ordered,
        o.ordered_quantity,
        o.ordered_date
      FROM inventory i
      LEFT JOIN orders o ON i.id = o.inventory_id AND o.is_ordered = 1
      ORDER BY i.material ASC
    `);

    res.json(items);
  } catch (error) {
    writeLog('inventory_error.log', `Erreur: ${error.message}`);
    res.status(500).json({ error: true, message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { material, supplier, category, stock, threshold, price } = req.body;

    if (!material || !supplier || !category || stock === undefined || threshold === undefined) {
      throw new Error('Données manquantes');
    }

    const [result] = await pool.query(
      'INSERT INTO inventory (material, supplier, category, stock, threshold, price) VALUES (?, ?, ?, ?, ?, ?)',
      [material, supplier, category, stock, threshold, price || null]
    );

    writeLog('inventory_post.log', `Article ajouté, ID: ${result.insertId}`);
    res.json({ success: true, id: result.insertId });
  } catch (error) {
    writeLog('inventory_error.log', `Erreur: ${error.message}`);
    res.status(500).json({ error: true, message: error.message });
  }
});

router.put('/', async (req, res) => {
  try {
    const { id, material, supplier, category, stock, threshold, price } = req.body;

    if (!id) {
      throw new Error("ID de l'article manquant");
    }

    const fields = [];
    const params = [];

    if (material !== undefined) {
      fields.push('material = ?');
      params.push(material);
    }
    if (supplier !== undefined) {
      fields.push('supplier = ?');
      params.push(supplier);
    }
    if (category !== undefined) {
      fields.push('category = ?');
      params.push(category);
    }
    if (stock !== undefined) {
      fields.push('stock = ?');
      params.push(stock);
    }
    if (threshold !== undefined) {
      fields.push('threshold = ?');
      params.push(threshold);
    }
    if (price !== undefined) {
      fields.push('price = ?');
      params.push(price);
    }

    if (fields.length === 0) {
      throw new Error('Aucune donnée à mettre à jour');
    }

    params.push(id);

    await pool.query(
      `UPDATE inventory SET ${fields.join(', ')} WHERE id = ?`,
      params
    );

    if (stock !== undefined && threshold !== undefined && stock >= threshold) {
      await pool.query('DELETE FROM orders WHERE inventory_id = ?', [id]);
      writeLog('inventory_put.log', `Commande supprimée pour article ID: ${id} (stock suffisant)`);
    }

    writeLog('inventory_put.log', `Article mis à jour, ID: ${id}`);
    res.json({ success: true });
  } catch (error) {
    writeLog('inventory_error.log', `Erreur: ${error.message}`);
    res.status(500).json({ error: true, message: error.message });
  }
});

router.delete('/', async (req, res) => {
  try {
    const id = parseInt(req.query.id);

    if (!id) {
      throw new Error('ID manquant');
    }

    await pool.query('DELETE FROM orders WHERE inventory_id = ?', [id]);
    await pool.query('DELETE FROM inventory WHERE id = ?', [id]);

    writeLog('inventory_delete.log', `Article supprimé, ID: ${id}`);
    res.json({ success: true });
  } catch (error) {
    writeLog('inventory_error.log', `Erreur: ${error.message}`);
    res.status(500).json({ error: true, message: error.message });
  }
});

module.exports = router;
