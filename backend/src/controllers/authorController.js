const { pool } = require('../config/database');

// Get all authors
const getAllAuthors = async (req, res) => {
  try {
    const { page, limit, offset } = req.pagination;

    const [countResult, authorsResult] = await Promise.all([
      pool.query('SELECT COUNT(*) as total FROM authors'),
      pool.query(`
        SELECT a.*, 
               (SELECT COUNT(*) FROM books WHERE author_id = a.id) as book_count
        FROM authors a
        ORDER BY a.name ASC
        LIMIT $1 OFFSET $2
      `, [limit, offset])
    ]);

    const total = parseInt(countResult.rows[0].total);

    res.json({
      authors: authorsResult.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all authors error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้แต่ง' 
    });
  }
};

// Get author by ID
const getAuthorById = async (req, res) => {
  try {
    const { id } = req.params;

    const authorResult = await pool.query(
      'SELECT * FROM authors WHERE id = $1',
      [id]
    );

    if (authorResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Author not found', 
        message: 'ไม่พบผู้แต่ง' 
      });
    }

    // Get author's books
    const booksResult = await pool.query(`
      SELECT * FROM books WHERE author_id = $1 ORDER BY created_at DESC
    `, [id]);

    res.json({ 
      author: authorResult.rows[0],
      books: booksResult.rows
    });
  } catch (error) {
    console.error('Get author by ID error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้แต่ง' 
    });
  }
};

// Create author (admin only)
const createAuthor = async (req, res) => {
  try {
    const { name, nameThai, bio, bioThai, imageUrl } = req.body;

    const result = await pool.query(`
      INSERT INTO authors (name, name_thai, bio, bio_thai, image_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [name, nameThai, bio, bioThai, imageUrl]);

    res.status(201).json({ 
      author: result.rows[0], 
      message: 'เพิ่มผู้แต่งสำเร็จ' 
    });
  } catch (error) {
    console.error('Create author error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: 'เกิดข้อผิดพลาดในการเพิ่มผู้แต่ง' 
    });
  }
};

// Update author (admin only)
const updateAuthor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, nameThai, bio, bioThai, imageUrl } = req.body;

    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramIndex}`);
      values.push(name);
      paramIndex++;
    }
    if (nameThai !== undefined) {
      updateFields.push(`name_thai = $${paramIndex}`);
      values.push(nameThai);
      paramIndex++;
    }
    if (bio !== undefined) {
      updateFields.push(`bio = $${paramIndex}`);
      values.push(bio);
      paramIndex++;
    }
    if (bioThai !== undefined) {
      updateFields.push(`bio_thai = $${paramIndex}`);
      values.push(bioThai);
      paramIndex++;
    }
    if (imageUrl !== undefined) {
      updateFields.push(`image_url = $${paramIndex}`);
      values.push(imageUrl);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ 
        error: 'No fields to update', 
        message: 'ไม่มีข้อมูลที่ต้องอัพเดท' 
      });
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE authors SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Author not found', 
        message: 'ไม่พบผู้แต่ง' 
      });
    }

    res.json({ 
      author: result.rows[0], 
      message: 'อัพเดทผู้แต่งสำเร็จ' 
    });
  } catch (error) {
    console.error('Update author error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: 'เกิดข้อผิดพลาดในการอัพเดทผู้แต่ง' 
    });
  }
};

// Delete author (admin only)
const deleteAuthor = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM authors WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Author not found', 
        message: 'ไม่พบผู้แต่ง' 
      });
    }

    res.json({ 
      message: 'ลบผู้แต่งสำเร็จ' 
    });
  } catch (error) {
    console.error('Delete author error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: 'เกิดข้อผิดพลาดในการลบผู้แต่ง' 
    });
  }
};

module.exports = {
  getAllAuthors,
  getAuthorById,
  createAuthor,
  updateAuthor,
  deleteAuthor
};
