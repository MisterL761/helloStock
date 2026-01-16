const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'hello_stock_secret_key_2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 1800000
  }
}));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const authRoutes = require('./routes/auth');
const inventoryRoutes = require('./routes/inventory');
const ordersRoutes = require('./routes/orders');
const receivedRoutes = require('./routes/received');
const installedRoutes = require('./routes/installed');
const defectiveRoutes = require('./routes/defective');
const toolsRoutes = require('./routes/tools');
const statsRoutes = require('./routes/stats');

app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/received', receivedRoutes);
app.use('/api/installed', installedRoutes);
app.use('/api/defective', defectiveRoutes);
app.use('/api/tools', toolsRoutes);
app.use('/api/stats', statsRoutes);

app.get('/api/check-stock', async (req, res) => {
  const { optionalAuth } = require('./middleware/auth');
  const StockNotifier = require('./services/notifications');

  optionalAuth(req, res, async () => {
    try {
      const notifier = new StockNotifier();
      await notifier.createNotificationTable();
      const result = await notifier.checkStockLevels();
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API opérationnelle',
    timestamp: new Date().toISOString()
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: true,
    message: 'Erreur serveur',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = app;
