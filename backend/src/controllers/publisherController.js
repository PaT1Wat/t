const { pool } = require('../config/database');

// Get all publishers
const getAllPublishers = async (req, res) => {
  try {
    const { page, limit, offset } = req.pagination;

    const [countResult, publishersResult] = await Promise.all([
      pool.query('SELECT COUNT(*) as total FROM publishers'),
      pool.query(`
        SELECT p.*, 
               (SELECT COUNT(*) FROM books WHERE publisher_id = p.id) as book_count
        FROM publishers p
        ORDER BY p.name ASC
        LIMIT $1 OFFSET $2
      `, [limit, offset])
    ]);

    const total = parseInt(countResult.rows[0].total);

    res.json({
      publishers: publishersResult.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all publishers error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสำนักพิมพ์' 
    });
  }
};

// Get publisher by ID
const getPublisherById = async (req, res) => {
  try {
    const { id } = req.params;

    const publisherResult = await pool.query(
      'SELECT * FROM publishers WHERE id = $1',
      [id]
    );

    if (publisherResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Publisher not found', 
        message: 'ไม่พบสำนักพิมพ์' 
      });
    }

    // Get publisher's books
    const booksResult = await pool.query(`
      SELECT * FROM books WHERE publisher_id = $1 ORDER BY created_at DESC
    `, [id]);

    res.json({ 
      publisher: publisherResult.rows[0],
      books: booksResult.rows
    });
  } catch (error) {
    console.error('Get publisher by ID error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสำนักพิมพ์' 
    });
  }
};

// Create publisher (admin only)
const createPublisher = async (req, res) => {
  try {
    const { name, nameThai, description, descriptionThai, websiteUrl, logoUrl } = req.body;

    const result = await pool.query(`
      INSERT INTO publishers (name, name_thai, description, description_thai, website_url, logo_url)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [name, nameThai, description, descriptionThai, websiteUrl, logoUrl]);

    res.status(201).json({ 
      publisher: result.rows[0], 
      message: 'เพิ่มสำนักพิมพ์สำเร็จ' 
    });
  } catch (error) {
    console.error('Create publisher error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: 'เกิดข้อผิดพลาดในการเพิ่มสำนักพิมพ์' 
    });
  }
};

// Update publisher (admin only)
const updatePublisher = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, nameThai, description, descriptionThai, websiteUrl, logoUrl } = req.body;

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
    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex}`);
      values.push(description);
      paramIndex++;
    }
    if (descriptionThai !== undefined) {
      updateFields.push(`description_thai = $${paramIndex}`);
      values.push(descriptionThai);
      paramIndex++;
    }
    if (websiteUrl !== undefined) {
      updateFields.push(`website_url = $${paramIndex}`);
      values.push(websiteUrl);
      paramIndex++;
    }
    if (logoUrl !== undefined) {
      updateFields.push(`logo_url = $${paramIndex}`);
      values.push(logoUrl);
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
      `UPDATE publishers SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Publisher not found', 
        message: 'ไม่พบสำนักพิมพ์' 
      });
    }

    res.json({ 
      publisher: result.rows[0], 
      message: 'อัพเดทสำนักพิมพ์สำเร็จ' 
    });
  } catch (error) {
    console.error('Update publisher error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: 'เกิดข้อผิดพลาดในการอัพเดทสำนักพิมพ์' 
    });
  }
};

// Delete publisher (admin only)
const deletePublisher = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM publishers WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Publisher not found', 
        message: 'ไม่พบสำนักพิมพ์' 
      });
    }

    res.json({ 
      message: 'ลบสำนักพิมพ์สำเร็จ' 
    });
  } catch (error) {
    console.error('Delete publisher error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: 'เกิดข้อผิดพลาดในการลบสำนักพิมพ์' 
    });
  }
};

module.exports = {
  getAllPublishers,
  getPublisherById,
  createPublisher,
  updatePublisher,
  deletePublisher
};
