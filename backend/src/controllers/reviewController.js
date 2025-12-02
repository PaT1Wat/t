const { pool } = require('../config/database');

// Get reviews for a book
const getBookReviews = async (req, res) => {
  try {
    const { bookId } = req.params;
    const { page, limit, offset } = req.pagination;
    const { sortBy } = req.query;

    let orderBy = 'r.created_at DESC';
    if (sortBy === 'rating_high') orderBy = 'r.rating DESC, r.created_at DESC';
    if (sortBy === 'rating_low') orderBy = 'r.rating ASC, r.created_at DESC';
    if (sortBy === 'helpful') orderBy = 'r.helpful_count DESC, r.created_at DESC';

    const [countResult, reviewsResult] = await Promise.all([
      pool.query('SELECT COUNT(*) as total FROM reviews WHERE book_id = $1 AND is_approved = true', [bookId]),
      pool.query(`
        SELECT r.*, 
               u.username, 
               u.display_name,
               u.avatar_url
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE r.book_id = $1 AND r.is_approved = true
        ORDER BY ${orderBy}
        LIMIT $2 OFFSET $3
      `, [bookId, limit, offset])
    ]);

    const total = parseInt(countResult.rows[0].total);

    // Get rating distribution
    const ratingDistribution = await pool.query(`
      SELECT rating, COUNT(*) as count
      FROM reviews
      WHERE book_id = $1 AND is_approved = true
      GROUP BY rating
      ORDER BY rating DESC
    `, [bookId]);

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingDistribution.rows.forEach(r => {
      distribution[r.rating] = parseInt(r.count);
    });

    res.json({
      reviews: reviewsResult.rows,
      ratingDistribution: distribution,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get book reviews error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลรีวิว' 
    });
  }
};

// Create review
const createReview = async (req, res) => {
  try {
    const { bookId } = req.params;
    const { rating, content, isSpoiler } = req.body;
    const userId = req.user.id;

    // Check if user already reviewed this book
    const existingReview = await pool.query(
      'SELECT * FROM reviews WHERE user_id = $1 AND book_id = $2',
      [userId, bookId]
    );

    if (existingReview.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Already reviewed', 
        message: 'คุณได้รีวิวหนังสือนี้แล้ว' 
      });
    }

    // Check if book exists
    const bookCheck = await pool.query('SELECT id FROM books WHERE id = $1', [bookId]);
    if (bookCheck.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Book not found', 
        message: 'ไม่พบหนังสือ' 
      });
    }

    // Create review
    const result = await pool.query(`
      INSERT INTO reviews (user_id, book_id, rating, content, is_spoiler)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [userId, bookId, rating, content, isSpoiler || false]);

    // Update book's average rating and total reviews
    await pool.query(`
      UPDATE books
      SET average_rating = (SELECT AVG(rating) FROM reviews WHERE book_id = $1 AND is_approved = true),
          total_reviews = (SELECT COUNT(*) FROM reviews WHERE book_id = $1 AND is_approved = true)
      WHERE id = $1
    `, [bookId]);

    res.status(201).json({ 
      review: result.rows[0], 
      message: 'เพิ่มรีวิวสำเร็จ' 
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: 'เกิดข้อผิดพลาดในการเพิ่มรีวิว' 
    });
  }
};

// Update review
const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, content, isSpoiler } = req.body;
    const userId = req.user.id;

    // Check if review exists and belongs to user
    const existingReview = await pool.query(
      'SELECT * FROM reviews WHERE id = $1',
      [reviewId]
    );

    if (existingReview.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Review not found', 
        message: 'ไม่พบรีวิว' 
      });
    }

    if (existingReview.rows[0].user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'คุณไม่มีสิทธิ์แก้ไขรีวิวนี้' 
      });
    }

    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    if (rating !== undefined) {
      updateFields.push(`rating = $${paramIndex}`);
      values.push(rating);
      paramIndex++;
    }
    if (content !== undefined) {
      updateFields.push(`content = $${paramIndex}`);
      values.push(content);
      paramIndex++;
    }
    if (isSpoiler !== undefined) {
      updateFields.push(`is_spoiler = $${paramIndex}`);
      values.push(isSpoiler);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ 
        error: 'No fields to update', 
        message: 'ไม่มีข้อมูลที่ต้องอัพเดท' 
      });
    }

    values.push(reviewId);
    const result = await pool.query(
      `UPDATE reviews SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    // Update book's average rating
    const bookId = existingReview.rows[0].book_id;
    await pool.query(`
      UPDATE books
      SET average_rating = (SELECT AVG(rating) FROM reviews WHERE book_id = $1 AND is_approved = true)
      WHERE id = $1
    `, [bookId]);

    res.json({ 
      review: result.rows[0], 
      message: 'อัพเดทรีวิวสำเร็จ' 
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: 'เกิดข้อผิดพลาดในการอัพเดทรีวิว' 
    });
  }
};

// Delete review
const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    // Check if review exists
    const existingReview = await pool.query(
      'SELECT * FROM reviews WHERE id = $1',
      [reviewId]
    );

    if (existingReview.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Review not found', 
        message: 'ไม่พบรีวิว' 
      });
    }

    if (existingReview.rows[0].user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'คุณไม่มีสิทธิ์ลบรีวิวนี้' 
      });
    }

    const bookId = existingReview.rows[0].book_id;

    await pool.query('DELETE FROM reviews WHERE id = $1', [reviewId]);

    // Update book's average rating and total reviews
    await pool.query(`
      UPDATE books
      SET average_rating = COALESCE((SELECT AVG(rating) FROM reviews WHERE book_id = $1 AND is_approved = true), 0),
          total_reviews = (SELECT COUNT(*) FROM reviews WHERE book_id = $1 AND is_approved = true)
      WHERE id = $1
    `, [bookId]);

    res.json({ 
      message: 'ลบรีวิวสำเร็จ' 
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: 'เกิดข้อผิดพลาดในการลบรีวิว' 
    });
  }
};

// Get user's reviews
const getUserReviews = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page, limit, offset } = req.pagination;

    const [countResult, reviewsResult] = await Promise.all([
      pool.query('SELECT COUNT(*) as total FROM reviews WHERE user_id = $1', [userId]),
      pool.query(`
        SELECT r.*, 
               b.title as book_title,
               b.title_thai as book_title_thai,
               b.cover_image_url as book_cover
        FROM reviews r
        JOIN books b ON r.book_id = b.id
        WHERE r.user_id = $1
        ORDER BY r.created_at DESC
        LIMIT $2 OFFSET $3
      `, [userId, limit, offset])
    ]);

    const total = parseInt(countResult.rows[0].total);

    res.json({
      reviews: reviewsResult.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลรีวิว' 
    });
  }
};

// Mark review as helpful
const markReviewHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const result = await pool.query(`
      UPDATE reviews
      SET helpful_count = helpful_count + 1
      WHERE id = $1
      RETURNING *
    `, [reviewId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Review not found', 
        message: 'ไม่พบรีวิว' 
      });
    }

    res.json({ 
      review: result.rows[0], 
      message: 'ขอบคุณสำหรับความคิดเห็น' 
    });
  } catch (error) {
    console.error('Mark review helpful error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: 'เกิดข้อผิดพลาด' 
    });
  }
};

// Moderate review (admin/moderator only)
const moderateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { isApproved } = req.body;

    const result = await pool.query(`
      UPDATE reviews
      SET is_approved = $1
      WHERE id = $2
      RETURNING *
    `, [isApproved, reviewId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Review not found', 
        message: 'ไม่พบรีวิว' 
      });
    }

    // Update book's stats
    const bookId = result.rows[0].book_id;
    await pool.query(`
      UPDATE books
      SET average_rating = COALESCE((SELECT AVG(rating) FROM reviews WHERE book_id = $1 AND is_approved = true), 0),
          total_reviews = (SELECT COUNT(*) FROM reviews WHERE book_id = $1 AND is_approved = true)
      WHERE id = $1
    `, [bookId]);

    res.json({ 
      review: result.rows[0], 
      message: isApproved ? 'อนุมัติรีวิวสำเร็จ' : 'ปฏิเสธรีวิวสำเร็จ' 
    });
  } catch (error) {
    console.error('Moderate review error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: 'เกิดข้อผิดพลาดในการจัดการรีวิว' 
    });
  }
};

// Get pending reviews (admin/moderator only)
const getPendingReviews = async (req, res) => {
  try {
    const { page, limit, offset } = req.pagination;

    const [countResult, reviewsResult] = await Promise.all([
      pool.query('SELECT COUNT(*) as total FROM reviews WHERE is_approved = false'),
      pool.query(`
        SELECT r.*, 
               u.username,
               u.display_name,
               b.title as book_title,
               b.title_thai as book_title_thai
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        JOIN books b ON r.book_id = b.id
        WHERE r.is_approved = false
        ORDER BY r.created_at ASC
        LIMIT $1 OFFSET $2
      `, [limit, offset])
    ]);

    const total = parseInt(countResult.rows[0].total);

    res.json({
      reviews: reviewsResult.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get pending reviews error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลรีวิว' 
    });
  }
};

module.exports = {
  getBookReviews,
  createReview,
  updateReview,
  deleteReview,
  getUserReviews,
  markReviewHelpful,
  moderateReview,
  getPendingReviews
};
