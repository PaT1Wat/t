// Validation middleware for request data

const validateBook = (req, res, next) => {
  const { title, type } = req.body;
  const errors = [];

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    errors.push('ต้องระบุชื่อหนังสือ (title)');
  }

  if (title && title.length > 500) {
    errors.push('ชื่อหนังสือต้องไม่เกิน 500 ตัวอักษร');
  }

  const validTypes = ['manga', 'novel', 'light_novel', 'webtoon'];
  if (type && !validTypes.includes(type)) {
    errors.push('ประเภทหนังสือไม่ถูกต้อง');
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

const validateReview = (req, res, next) => {
  const { rating, content } = req.body;
  const errors = [];

  if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
    errors.push('คะแนนต้องอยู่ระหว่าง 1-5');
  }

  if (content && content.length > 5000) {
    errors.push('เนื้อหารีวิวต้องไม่เกิน 5000 ตัวอักษร');
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

const validateAuthor = (req, res, next) => {
  const { name } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('ต้องระบุชื่อผู้แต่ง');
  }

  if (name && name.length > 255) {
    errors.push('ชื่อผู้แต่งต้องไม่เกิน 255 ตัวอักษร');
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

const validatePublisher = (req, res, next) => {
  const { name } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('ต้องระบุชื่อสำนักพิมพ์');
  }

  if (name && name.length > 255) {
    errors.push('ชื่อสำนักพิมพ์ต้องไม่เกิน 255 ตัวอักษร');
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

const validatePagination = (req, res, next) => {
  let { page, limit } = req.query;
  
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 20;
  
  if (page < 1) page = 1;
  if (limit < 1) limit = 1;
  if (limit > 100) limit = 100;
  
  req.pagination = { page, limit, offset: (page - 1) * limit };
  next();
};

const validateUUID = (paramName) => (req, res, next) => {
  const uuid = req.params[paramName];
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!uuid || !uuidRegex.test(uuid)) {
    return res.status(400).json({ 
      error: 'Invalid ID', 
      message: 'รหัสไม่ถูกต้อง' 
    });
  }
  
  next();
};

module.exports = {
  validateBook,
  validateReview,
  validateAuthor,
  validatePublisher,
  validatePagination,
  validateUUID
};
