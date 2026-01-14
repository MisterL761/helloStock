const app = require('./app');
const cron = require('node-cron');
const StockNotifier = require('./services/notifications');
const { writeLog } = require('./middleware/logger');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  writeLog('server.log', `Server started on port ${PORT}`);
});

cron.schedule('0 9 * * *', async () => {
  writeLog('cron.log', 'Exécution du cron de vérification des stocks');
  try {
    const notifier = new StockNotifier();
    await notifier.createNotificationTable();
    const result = await notifier.checkStockLevels();
    writeLog('cron.log', `Résultat: ${JSON.stringify(result)}`);
  } catch (error) {
    writeLog('cron.log', `Erreur: ${error.message}`);
  }
}, {
  timezone: "Europe/Paris"
});

process.on('SIGTERM', () => {
  writeLog('server.log', 'SIGTERM signal received: closing HTTP server');
  server.close(() => {
    writeLog('server.log', 'HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  writeLog('server.log', 'SIGINT signal received: closing HTTP server');
  server.close(() => {
    writeLog('server.log', 'HTTP server closed');
    process.exit(0);
  });
});
