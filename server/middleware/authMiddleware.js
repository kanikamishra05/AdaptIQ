const { verifyAccessToken } = require('../utils/jwt');

const protect = (req, res, next) => {
  try {
    let token;

    // Check cookies first
    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    } 
    // Fallback to Bearer token in headers (useful for mobile apps or external API consumers)
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
    }

    // Verify token
    const decoded = verifyAccessToken(token);
    
    // Attach user payload to request
    req.user = decoded;
    
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, token failed or expired' });
  }
};

module.exports = { protect };
