const { pool } = require('../config/database');

// Get user's favorites
const getFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page, limit, offset } = req.pagination;

    const [countResult, favoritesResult] = await Promise.all([
      pool.query('SELECT COUNT(*) as total FROM favorites WHERE user_id = $1', [userId]),
      pool.query(`
        SELECT f.id as favorite_id, f.created_at as favorited_at,
               b.*, 
               a.name as author_name,
               a.name_thai as author_name_thai,
               p.name as publisher_name
        FROM favorites f
        JOIN books b ON f.book_id = b.id
        LEFT JOIN authors a ON b.author_id = a.id
        LEFT JOIN publishers p ON b.publisher_id = p.id
        WHERE f.user_id = $1
        ORDER BY f.created_at DESC
        LIMIT $2 OFFSET $3
      `, [userId, limit, offset])
    ]);

    const total = parseInt(countResult.rows[0].total);

    res.json({
      favorites: favoritesResult.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลรายการโปรด' 
    });
  }
};

// Add to favorites
const addFavorite = async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.user.id;

    // Check if book exists
    const bookCheck = await pool.query('SELECT id, title FROM books WHERE id = $1', [bookId]);
    if (bookCheck.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Book not found', 
        message: 'ไม่พบหนังสือ' 
      });
    }

    // Check if already in favorites
    const existingFavorite = await pool.query(
      'SELECT * FROM favorites WHERE user_id = $1 AND book_id = $2',
      [userId, bookId]
    );

    if (existingFavorite.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Already in favorites', 
        message: 'หนังสือนี้อยู่ในรายการโปรดแล้ว' 
      });
    }

    const result = await pool.query(`
      INSERT INTO favorites (user_id, book_id)
      VALUES ($1, $2)
      RETURNING *
    `, [userId, bookId]);

    res.status(201).json({ 
      favorite: result.rows[0],
      book: bookCheck.rows[0],
      message: 'เพิ่มในรายการโปรดสำเร็จ' 
    });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: 'เกิดข้อผิดพลาดในการเพิ่มรายการโปรด' 
    });
  }
};

// Remove from favorites
const removeFavorite = async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      'DELETE FROM favorites WHERE user_id = $1 AND book_id = $2 RETURNING id',
      [userId, bookId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Favorite not found', 
        message: 'ไม่พบในรายการโปรด' 
      });
    }

    res.json({ 
      message: 'ลบออกจากรายการโปรดสำเร็จ' 
    });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: 'เกิดข้อผิดพลาดในการลบรายการโปรด' 
    });
  }
};

// Check if book is in favorites
const checkFavorite = async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      'SELECT * FROM favorites WHERE user_id = $1 AND book_id = $2',
      [userId, bookId]
    );

    res.json({ 
      isFavorite: result.rows.length > 0,
      favorite: result.rows[0] || null
    });
  } catch (error) {
    console.error('Check favorite error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: 'เกิดข้อผิดพลาด' 
    });
  }
};

// Get favorite count for a book
const getBookFavoriteCount = async (req, res) => {
  try {
    const { bookId } = req.params;

    const result = await pool.query(
      'SELECT COUNT(*) as count FROM favorites WHERE book_id = $1',
      [bookId]
    );

    res.json({ 
      count: parseInt(result.rows[0].count) 
    });
  } catch (error) {
    console.error('Get book favorite count error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: 'เกิดข้อผิดพลาด' 
    });
  }
};

module.exports = {
  getFavorites,
  addFavorite,
  removeFavorite,
  checkFavorite,
  getBookFavoriteCount
};
