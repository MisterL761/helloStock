const authenticate = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      error: true,
      message: 'Non authentifié'
    });
  }
  next();
};

const optionalAuth = (req, res, next) => {
  const cronToken = req.query.cron_token;
  const expectedToken = process.env.CRON_TOKEN || 'hello_stock_cron_2024';

  if (cronToken) {
    if (cronToken !== expectedToken) {
      return res.status(403).json({
        error: true,
        message: 'Token invalide'
      });
    }
    return next();
  }

  if (!req.session || !req.session.user) {
    return res.status(401).json({
      error: true,
      message: 'Non authentifié'
    });
  }
  next();
};

module.exports = { authenticate, optionalAuth };
