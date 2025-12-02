const { getAuth } = require('../config/firebase');
const { pool } = require('../config/database');

// Verify Firebase token and attach user to request
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'ไม่พบ token การยืนยันตัวตน' 
      });
    }

    const token = authHeader.split('Bearer ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'token ไม่ถูกต้อง' 
      });
    }

    // Verify Firebase token
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token);
    
    // Get user from database
    const result = await pool.query(
      'SELECT * FROM users WHERE firebase_uid = $1',
      [decodedToken.uid]
    );

    if (result.rows.length === 0) {
      // Create user if not exists
      const newUserResult = await pool.query(
        `INSERT INTO users (firebase_uid, email, username, display_name)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [
          decodedToken.uid,
          decodedToken.email,
          decodedToken.email.split('@')[0],
          decodedToken.name || decodedToken.email.split('@')[0]
        ]
      );
      req.user = newUserResult.rows[0];
    } else {
      req.user = result.rows[0];
    }

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'การยืนยันตัวตนล้มเหลว' 
    });
  }
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split('Bearer ')[1];
    
    if (!token) {
      return next();
    }

    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token);
    
    const result = await pool.query(
      'SELECT * FROM users WHERE firebase_uid = $1',
      [decodedToken.uid]
    );

    if (result.rows.length > 0) {
      req.user = result.rows[0];
    }

    next();
  } catch (error) {
    // Continue without user
    next();
  }
};

// Check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Forbidden', 
      message: 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้' 
    });
  }
  next();
};

// Check if user is admin or moderator
const requireModerator = (req, res, next) => {
  if (!req.user || !['admin', 'moderator'].includes(req.user.role)) {
    return res.status(403).json({ 
      error: 'Forbidden', 
      message: 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้' 
    });
  }
  next();
};

module.exports = { 
  authenticate, 
  optionalAuth, 
  requireAdmin, 
  requireModerator 
};
