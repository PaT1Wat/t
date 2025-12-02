const { pool } = require('../config/database');
const { getAuth } = require('../config/firebase');

// Register user (called after Firebase authentication)
const registerUser = async (req, res) => {
  try {
    const { firebaseUid, email, username, displayName, preferredLanguage } = req.body;

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE firebase_uid = $1 OR email = $2 OR username = $3',
      [firebaseUid, email, username]
    );

    if (existingUser.rows.length > 0) {
      const existing = existingUser.rows[0];
      if (existing.firebase_uid === firebaseUid) {
        return res.status(200).json({ 
          user: existing, 
          message: 'ผู้ใช้มีอยู่แล้วในระบบ' 
        });
      }
      if (existing.email === email) {
        return res.status(400).json({ 
          error: 'Email already exists', 
          message: 'อีเมลนี้ถูกใช้งานแล้ว' 
        });
      }
      if (existing.username === username) {
        return res.status(400).json({ 
          error: 'Username already exists', 
          message: 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว' 
        });
      }
    }

    // Create new user
    const result = await pool.query(
      `INSERT INTO users (firebase_uid, email, username, display_name, preferred_language)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [firebaseUid, email, username, displayName || username, preferredLanguage || 'th']
    );

    res.status(201).json({ 
      user: result.rows[0], 
      message: 'ลงทะเบียนสำเร็จ' 
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: 'เกิดข้อผิดพลาดในการลงทะเบียน' 
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้' 
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { displayName, avatarUrl, preferredLanguage } = req.body;
    const userId = req.user.id;

    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    if (displayName !== undefined) {
      updateFields.push(`display_name = $${paramIndex}`);
      values.push(displayName);
      paramIndex++;
    }

    if (avatarUrl !== undefined) {
      updateFields.push(`avatar_url = $${paramIndex}`);
      values.push(avatarUrl);
      paramIndex++;
    }

    if (preferredLanguage !== undefined) {
      updateFields.push(`preferred_language = $${paramIndex}`);
      values.push(preferredLanguage);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ 
        error: 'No fields to update', 
        message: 'ไม่มีข้อมูลที่ต้องอัพเดท' 
      });
    }

    values.push(userId);
    const result = await pool.query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    res.json({ 
      user: result.rows[0], 
      message: 'อัพเดทข้อมูลสำเร็จ' 
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: 'เกิดข้อผิดพลาดในการอัพเดทข้อมูล' 
    });
  }
};

// Get user's statistics
const getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const [favoritesCount, reviewsCount, searchCount] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM favorites WHERE user_id = $1', [userId]),
      pool.query('SELECT COUNT(*) as count, AVG(rating) as avg_rating FROM reviews WHERE user_id = $1', [userId]),
      pool.query('SELECT COUNT(*) as count FROM search_history WHERE user_id = $1', [userId])
    ]);

    res.json({
      stats: {
        totalFavorites: parseInt(favoritesCount.rows[0].count),
        totalReviews: parseInt(reviewsCount.rows[0].count),
        averageRating: parseFloat(reviewsCount.rows[0].avg_rating) || 0,
        totalSearches: parseInt(searchCount.rows[0].count)
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสถิติ' 
    });
  }
};

// Admin: Get all users
const getAllUsers = async (req, res) => {
  try {
    const { page, limit, offset } = req.pagination;

    const [countResult, usersResult] = await Promise.all([
      pool.query('SELECT COUNT(*) as total FROM users'),
      pool.query(
        'SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [limit, offset]
      )
    ]);

    const total = parseInt(countResult.rows[0].total);

    res.json({
      users: usersResult.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้' 
    });
  }
};

// Admin: Update user role
const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    const validRoles = ['user', 'admin', 'moderator'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        error: 'Invalid role', 
        message: 'บทบาทไม่ถูกต้อง' 
      });
    }

    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING *',
      [role, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'User not found', 
        message: 'ไม่พบผู้ใช้' 
      });
    }

    res.json({ 
      user: result.rows[0], 
      message: 'อัพเดทบทบาทสำเร็จ' 
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: 'เกิดข้อผิดพลาดในการอัพเดทบทบาท' 
    });
  }
};

module.exports = {
  registerUser,
  getProfile,
  updateProfile,
  getUserStats,
  getAllUsers,
  updateUserRole
};
