const jwt = require('jsonwebtoken');

const optionalAuthMiddleware = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return next();
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key';
    const decoded = jwt.verify(token, jwtSecret);
    
    req.user = decoded.user;
    next();
  } catch (error) {
    // If token is invalid, just proceed without setting req.user
    next();
  }
};

module.exports = optionalAuthMiddleware;
