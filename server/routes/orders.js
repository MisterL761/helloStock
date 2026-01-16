const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { writeLog } = require('../middleware/logger');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const [orders] = await pool.query(`
      SELECT
        o.id,
        o.inventory_id,
        o.ordered_quantity,
        o.ordered_date,
        o.is_ordered,
        i.material,
        i.supplier,
        i.category,
        i.stock,
        i.threshold,
        CASE
          WHEN i.stock = 0 THEN 'Rupture'
          WHEN i.stock < i.threshold THEN 'Faible Stock'
          ELSE 'Disponible'
        END AS status
      FROM orders o
      JOIN inventory i ON o.inventory_id = i.id
      WHERE o.is_ordered = 1
      ORDER BY o.ordered_date DESC
    `);

    res.json(orders);
  } catch (error) {
    writeLog('orders_error.log', `Erreur: ${error.message}`);
    res.status(500).json({ error: true, message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { inventory_id, ordered_quantity } = req.body;

    if (!inventory_id || !ordered_quantity) {
      throw new Error('Données manquantes: inventory_id et ordered_quantity requis');
    }

    const [existing] = await pool.query(
      'SELECT id FROM orders WHERE inventory_id = ?',
      [inventory_id]
    );

    let result;
    let action;

    if (existing.length > 0) {
      await pool.query(
        'UPDATE orders SET ordered_quantity = ?, ordered_date = NOW(), is_ordered = 1 WHERE inventory_id = ?',
        [ordered_quantity, inventory_id]
      );
      result = { id: existing[0].id };
      action = 'updated';
    } else {
      const [insertResult] = await pool.query(
        'INSERT INTO orders (inventory_id, ordered_quantity, ordered_date, is_ordered) VALUES (?, ?, NOW(), 1)',
        [inventory_id, ordered_quantity]
      );
      result = { id: insertResult.insertId };
      action = 'created';
      writeLog('orders_post.log', `Commande ajoutée, ID: ${insertResult.insertId}`);
    }

    res.json({ success: true, ...result, action });
  } catch (error) {
    writeLog('orders_error.log', `Erreur: ${error.message}`);
    res.status(500).json({ error: true, message: error.message });
  }
});

router.put('/', async (req, res) => {
  try {
    const { inventory_id, is_ordered, ordered_quantity } = req.body;

    if (!inventory_id) {
      throw new Error('ID de l\'article manquant (inventory_id requis)');
    }

    let action;

    if (is_ordered) {
      const [existing] = await pool.query(
        'SELECT id FROM orders WHERE inventory_id = ?',
        [inventory_id]
      );

      if (existing.length > 0) {
        const fields = ['is_ordered = ?', 'ordered_date = NOW()'];
        const params = [1];

        if (ordered_quantity !== undefined) {
          fields.push('ordered_quantity = ?');
          params.push(ordered_quantity);
        }

        params.push(inventory_id);

        await pool.query(
          `UPDATE orders SET ${fields.join(', ')} WHERE inventory_id = ?`,
          params
        );
        action = 'updated';
      } else {
        const quantity = ordered_quantity || 0;
        await pool.query(
          'INSERT INTO orders (inventory_id, ordered_quantity, ordered_date, is_ordered) VALUES (?, ?, NOW(), 1)',
          [inventory_id, quantity]
        );
        action = 'created';
      }
    } else {
      await pool.query(
        'UPDATE orders SET is_ordered = 0 WHERE inventory_id = ?',
        [inventory_id]
      );
      action = 'unchecked';
    }

    res.json({ success: true, action });
  } catch (error) {
    writeLog('orders_error.log', `Erreur: ${error.message}`);
    res.status(500).json({ error: true, message: error.message });
  }
});

router.delete('/', async (req, res) => {
  try {
    const inventory_id = parseInt(req.query.inventory_id);

    if (!inventory_id) {
      throw new Error('ID manquant (inventory_id requis)');
    }

    await pool.query('DELETE FROM orders WHERE inventory_id = ?', [inventory_id]);

    writeLog('orders_delete.log', `Commande supprimée, inventory_id: ${inventory_id}`);
    res.json({ success: true });
  } catch (error) {
    writeLog('orders_error.log', `Erreur: ${error.message}`);
    res.status(500).json({ error: true, message: error.message });
  }
});

module.exports = router;
