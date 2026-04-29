const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not defined in .env');
  process.exit(1);
}

function authenticate(req, res, next) {
  try {
    const token = req.cookies?.token;
    
    if (!token) {
      return res.status(401).json({ error: 'Nicht authentifiziert: Token fehlt' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ error: 'Nicht authentifiziert: Ungültiger Token' });
    }

    // Payload (userId, email) auf req.user speichern
    req.user = decoded;
    
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(401).json({ error: 'Nicht authentifiziert' });
  }
}

module.exports = authenticate;
