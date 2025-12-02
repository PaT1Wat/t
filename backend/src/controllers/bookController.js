const { pool } = require('../config/database');
const recommendationService = require('../services/recommendationService');

// Get all books with pagination
const getAllBooks = async (req, res) => {
  try {
    const { page, limit, offset } = req.pagination;

    const [countResult, booksResult] = await Promise.all([
      pool.query('SELECT COUNT(*) as total FROM books'),
      pool.query(`
        SELECT b.*, 
               a.name as author_name, 
               a.name_thai as author_name_thai,
               p.name as publisher_name,
               p.name_thai as publisher_name_thai
        FROM books b
        LEFT JOIN authors a ON b.author_id = a.id
        LEFT JOIN publishers p ON b.publisher_id = p.id
        ORDER BY b.created_at DESC
        LIMIT $1 OFFSET $2
      `, [limit, offset])
    ]);

    const total = parseInt(countResult.rows[0].total);

    res.json({
      books: booksResult.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all books error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลหนังสือ' 
    });
  }
};

// Get book by ID
const getBookById = async (req, res) => {
  try {
    const { id } = req.params;

    const bookResult = await pool.query(`
      SELECT b.*, 
             a.name as author_name, 
             a.name_thai as author_name_thai,
             a.bio as author_bio,
             p.name as publisher_name,
             p.name_thai as publisher_name_thai
      FROM books b
      LEFT JOIN authors a ON b.author_id = a.id
      LEFT JOIN publishers p ON b.publisher_id = p.id
      WHERE b.id = $1
    `, [id]);

    if (bookResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Book not found', 
        message: 'ไม่พบหนังสือ' 
      });
    }

    const book = bookResult.rows[0];

    // Track viewing for logged-in users
    if (req.user) {
      await pool.query(`
        INSERT INTO reading_history (user_id, book_id, view_count, last_viewed_at)
        VALUES ($1, $2, 1, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id, book_id)
        DO UPDATE SET view_count = reading_history.view_count + 1, last_viewed_at = CURRENT_TIMESTAMP
      `, [req.user.id, id]);
    }

    // Get related recommendations
    const similarBooks = await recommendationService.getContentBasedRecommendations(id, 6);

    res.json({ book, similarBooks });
  } catch (error) {
    console.error('Get book by ID error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลหนังสือ' 
    });
  }
};

// Create new book (admin only)
const createBook = async (req, res) => {
  try {
    const {
      title,
      titleThai,
      description,
      descriptionThai,
      coverImageUrl,
      type,
      status,
      publicationYear,
      totalChapters,
      totalVolumes,
      authorId,
      publisherId,
      tags,
      genres,
      isNsfw
    } = req.body;

    const result = await pool.query(`
      INSERT INTO books (
        title, title_thai, description, description_thai, cover_image_url,
        type, status, publication_year, total_chapters, total_volumes,
        author_id, publisher_id, tags, genres, is_nsfw
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `, [
      title, titleThai, description, descriptionThai, coverImageUrl,
      type, status || 'ongoing', publicationYear, totalChapters, totalVolumes,
      authorId, publisherId, tags || [], genres || [], isNsfw || false
    ]);

    res.status(201).json({ 
      book: result.rows[0], 
      message: 'เพิ่มหนังสือสำเร็จ' 
    });
  } catch (error) {
    console.error('Create book error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: 'เกิดข้อผิดพลาดในการเพิ่มหนังสือ' 
    });
  }
};

// Update book (admin only)
const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      titleThai,
      description,
      descriptionThai,
      coverImageUrl,
      type,
      status,
      publicationYear,
      totalChapters,
      totalVolumes,
      authorId,
      publisherId,
      tags,
      genres,
      isNsfw
    } = req.body;

    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    const fieldMappings = {
      title: 'title',
      titleThai: 'title_thai',
      description: 'description',
      descriptionThai: 'description_thai',
      coverImageUrl: 'cover_image_url',
      type: 'type',
      status: 'status',
      publicationYear: 'publication_year',
      totalChapters: 'total_chapters',
      totalVolumes: 'total_volumes',
      authorId: 'author_id',
      publisherId: 'publisher_id',
      tags: 'tags',
      genres: 'genres',
      isNsfw: 'is_nsfw'
    };

    Object.entries(req.body).forEach(([key, value]) => {
      if (fieldMappings[key] !== undefined && value !== undefined) {
        updateFields.push(`${fieldMappings[key]} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ 
        error: 'No fields to update', 
        message: 'ไม่มีข้อมูลที่ต้องอัพเดท' 
      });
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE books SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Book not found', 
        message: 'ไม่พบหนังสือ' 
      });
    }

    res.json({ 
      book: result.rows[0], 
      message: 'อัพเดทหนังสือสำเร็จ' 
    });
  } catch (error) {
    console.error('Update book error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: 'เกิดข้อผิดพลาดในการอัพเดทหนังสือ' 
    });
  }
};

// Delete book (admin only)
const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM books WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Book not found', 
        message: 'ไม่พบหนังสือ' 
      });
    }

    res.json({ 
      message: 'ลบหนังสือสำเร็จ' 
    });
  } catch (error) {
    console.error('Delete book error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: 'เกิดข้อผิดพลาดในการลบหนังสือ' 
    });
  }
};

// Get books by type
const getBooksByType = async (req, res) => {
  try {
    const { type } = req.params;
    const { page, limit, offset } = req.pagination;

    const validTypes = ['manga', 'novel', 'light_novel', 'webtoon'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        error: 'Invalid type', 
        message: 'ประเภทหนังสือไม่ถูกต้อง' 
      });
    }

    const [countResult, booksResult] = await Promise.all([
      pool.query('SELECT COUNT(*) as total FROM books WHERE type = $1', [type]),
      pool.query(`
        SELECT b.*, a.name as author_name, p.name as publisher_name
        FROM books b
        LEFT JOIN authors a ON b.author_id = a.id
        LEFT JOIN publishers p ON b.publisher_id = p.id
        WHERE b.type = $1
        ORDER BY b.created_at DESC
        LIMIT $2 OFFSET $3
      `, [type, limit, offset])
    ]);

    const total = parseInt(countResult.rows[0].total);

    res.json({
      books: booksResult.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get books by type error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลหนังสือ' 
    });
  }
};

// Get top rated books
const getTopRatedBooks = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const result = await pool.query(`
      SELECT b.*, a.name as author_name, p.name as publisher_name
      FROM books b
      LEFT JOIN authors a ON b.author_id = a.id
      LEFT JOIN publishers p ON b.publisher_id = p.id
      WHERE b.total_reviews >= 5
      ORDER BY b.average_rating DESC, b.total_reviews DESC
      LIMIT $1
    `, [limit]);

    res.json({ books: result.rows });
  } catch (error) {
    console.error('Get top rated books error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลหนังสือ' 
    });
  }
};

// Get recently added books
const getRecentBooks = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const result = await pool.query(`
      SELECT b.*, a.name as author_name, p.name as publisher_name
      FROM books b
      LEFT JOIN authors a ON b.author_id = a.id
      LEFT JOIN publishers p ON b.publisher_id = p.id
      ORDER BY b.created_at DESC
      LIMIT $1
    `, [limit]);

    res.json({ books: result.rows });
  } catch (error) {
    console.error('Get recent books error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลหนังสือ' 
    });
  }
};

module.exports = {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  getBooksByType,
  getTopRatedBooks,
  getRecentBooks
};
