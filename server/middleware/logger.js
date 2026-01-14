const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../logs');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const writeLog = (filename, message) => {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const logMessage = `${timestamp} - ${message}\n`;
  const logPath = path.join(logDir, filename);
  fs.appendFileSync(logPath, logMessage);
};

const requestLogger = (logFile) => (req, res, next) => {
  writeLog(logFile, `Méthode: ${req.method} - URL: ${req.originalUrl}`);
  next();
};

module.exports = { writeLog, requestLogger };
