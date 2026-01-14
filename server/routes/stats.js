const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { writeLog } = require('../middleware/logger');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const [stats] = await pool.query(`
      SELECT
        COUNT(*) as total_items,
        SUM(CASE WHEN stock > threshold THEN 1 ELSE 0 END) as available_items,
        SUM(CASE WHEN stock > 0 AND stock <= threshold THEN 1 ELSE 0 END) as low_stock_items,
        SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) as out_of_stock_items
      FROM inventory
    `);

    res.json(stats[0]);
  } catch (error) {
    writeLog('stats_error.log', `Erreur: ${error.message}`);
    res.status(500).json({ error: true, message: error.message });
  }
});

module.exports = router;
