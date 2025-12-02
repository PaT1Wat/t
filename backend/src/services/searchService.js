const { pool } = require('../config/database');

class SearchService {
  // Full-text search with filters
  async searchBooks(query, filters = {}, pagination = { limit: 20, offset: 0 }) {
    const params = [];
    let paramIndex = 1;
    let whereConditions = [];

    // Full-text search on title and description
    if (query && query.trim()) {
      // Support both English and Thai search
      const searchQuery = query.trim().split(/\s+/).join(' & ');
      whereConditions.push(`
        (to_tsvector('simple', COALESCE(title, '') || ' ' || COALESCE(title_thai, '') || ' ' || 
         COALESCE(description, '') || ' ' || COALESCE(description_thai, '')) @@ plainto_tsquery('simple', $${paramIndex})
         OR title ILIKE $${paramIndex + 1}
         OR title_thai ILIKE $${paramIndex + 1}
         OR description ILIKE $${paramIndex + 1}
         OR description_thai ILIKE $${paramIndex + 1})
      `);
      params.push(query.trim(), `%${query.trim()}%`);
      paramIndex += 2;
    }

    // Filter by type
    if (filters.type) {
      whereConditions.push(`type = $${paramIndex}`);
      params.push(filters.type);
      paramIndex++;
    }

    // Filter by genres
    if (filters.genres && filters.genres.length > 0) {
      whereConditions.push(`genres && $${paramIndex}::text[]`);
      params.push(filters.genres);
      paramIndex++;
    }

    // Filter by tags
    if (filters.tags && filters.tags.length > 0) {
      whereConditions.push(`tags && $${paramIndex}::text[]`);
      params.push(filters.tags);
      paramIndex++;
    }

    // Filter by status
    if (filters.status) {
      whereConditions.push(`status = $${paramIndex}`);
      params.push(filters.status);
      paramIndex++;
    }

    // Filter by author
    if (filters.authorId) {
      whereConditions.push(`author_id = $${paramIndex}`);
      params.push(filters.authorId);
      paramIndex++;
    }

    // Filter by publisher
    if (filters.publisherId) {
      whereConditions.push(`publisher_id = $${paramIndex}`);
      params.push(filters.publisherId);
      paramIndex++;
    }

    // Filter by rating range
    if (filters.minRating) {
      whereConditions.push(`average_rating >= $${paramIndex}`);
      params.push(filters.minRating);
      paramIndex++;
    }

    // Filter by year range
    if (filters.fromYear) {
      whereConditions.push(`publication_year >= $${paramIndex}`);
      params.push(filters.fromYear);
      paramIndex++;
    }

    if (filters.toYear) {
      whereConditions.push(`publication_year <= $${paramIndex}`);
      params.push(filters.toYear);
      paramIndex++;
    }

    // Exclude NSFW content by default
    if (!filters.includeNsfw) {
      whereConditions.push(`(is_nsfw = false OR is_nsfw IS NULL)`);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // Sorting
    let orderBy = 'b.created_at DESC';
    if (filters.sortBy) {
      const sortOptions = {
        'rating': 'b.average_rating DESC',
        'reviews': 'b.total_reviews DESC',
        'title': 'b.title ASC',
        'newest': 'b.created_at DESC',
        'oldest': 'b.created_at ASC',
        'relevance': query ? 'ts_rank(to_tsvector(\'simple\', COALESCE(title, \'\') || \' \' || COALESCE(title_thai, \'\')), plainto_tsquery(\'simple\', $1)) DESC' : 'b.created_at DESC'
      };
      orderBy = sortOptions[filters.sortBy] || orderBy;
    }

    // Count total results
    const countQuery = `
      SELECT COUNT(*) as total
      FROM books b
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Get paginated results
    params.push(pagination.limit, pagination.offset);
    const searchQuery = `
      SELECT b.*, 
             a.name as author_name, 
             a.name_thai as author_name_thai,
             p.name as publisher_name,
             p.name_thai as publisher_name_thai
      FROM books b
      LEFT JOIN authors a ON b.author_id = a.id
      LEFT JOIN publishers p ON b.publisher_id = p.id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const searchResult = await pool.query(searchQuery, params);

    return {
      books: searchResult.rows,
      pagination: {
        total,
        page: Math.floor(pagination.offset / pagination.limit) + 1,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit)
      }
    };
  }

  // Autocomplete suggestions
  async getAutocompleteSuggestions(query, limit = 10) {
    if (!query || query.trim().length < 2) {
      return { books: [], authors: [], tags: [] };
    }

    const searchTerm = `%${query.trim()}%`;

    // Get book title suggestions
    const booksQuery = `
      SELECT id, title, title_thai, cover_image_url, type
      FROM books
      WHERE title ILIKE $1 OR title_thai ILIKE $1
      ORDER BY total_reviews DESC, average_rating DESC
      LIMIT $2
    `;
    const booksResult = await pool.query(booksQuery, [searchTerm, limit]);

    // Get author suggestions
    const authorsQuery = `
      SELECT id, name, name_thai, image_url
      FROM authors
      WHERE name ILIKE $1 OR name_thai ILIKE $1
      LIMIT $2
    `;
    const authorsResult = await pool.query(authorsQuery, [searchTerm, limit]);

    // Get tag/genre suggestions
    const tagsQuery = `
      SELECT DISTINCT unnest(tags) as tag
      FROM books
      WHERE EXISTS (
        SELECT 1 FROM unnest(tags) t WHERE t ILIKE $1
      )
      LIMIT $2
    `;
    const tagsResult = await pool.query(tagsQuery, [searchTerm, limit]);

    const genresQuery = `
      SELECT DISTINCT unnest(genres) as genre
      FROM books
      WHERE EXISTS (
        SELECT 1 FROM unnest(genres) g WHERE g ILIKE $1
      )
      LIMIT $2
    `;
    const genresResult = await pool.query(genresQuery, [searchTerm, limit]);

    return {
      books: booksResult.rows,
      authors: authorsResult.rows,
      tags: tagsResult.rows.map(r => r.tag).filter(Boolean),
      genres: genresResult.rows.map(r => r.genre).filter(Boolean)
    };
  }

  // Save search history for user
  async saveSearchHistory(userId, query, filters, resultsCount) {
    if (!userId || !query) return;

    try {
      await pool.query(`
        INSERT INTO search_history (user_id, query, filters, results_count)
        VALUES ($1, $2, $3, $4)
      `, [userId, query, JSON.stringify(filters || {}), resultsCount]);
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  }

  // Get user's recent searches
  async getRecentSearches(userId, limit = 10) {
    const result = await pool.query(`
      SELECT DISTINCT ON (query) query, filters, created_at
      FROM search_history
      WHERE user_id = $1
      ORDER BY query, created_at DESC
      LIMIT $2
    `, [userId, limit]);

    return result.rows;
  }

  // Get popular searches
  async getPopularSearches(limit = 10) {
    const result = await pool.query(`
      SELECT query, COUNT(*) as count
      FROM search_history
      WHERE created_at > NOW() - INTERVAL '7 days'
      GROUP BY query
      ORDER BY count DESC
      LIMIT $1
    `, [limit]);

    return result.rows;
  }

  // Get all available filters
  async getAvailableFilters() {
    const [typesResult, genresResult, tagsResult, statusResult] = await Promise.all([
      pool.query(`SELECT DISTINCT type FROM books WHERE type IS NOT NULL ORDER BY type`),
      pool.query(`SELECT DISTINCT unnest(genres) as genre FROM books ORDER BY genre`),
      pool.query(`SELECT DISTINCT unnest(tags) as tag FROM books ORDER BY tag`),
      pool.query(`SELECT DISTINCT status FROM books WHERE status IS NOT NULL ORDER BY status`)
    ]);

    return {
      types: typesResult.rows.map(r => r.type),
      genres: genresResult.rows.map(r => r.genre).filter(Boolean),
      tags: tagsResult.rows.map(r => r.tag).filter(Boolean),
      statuses: statusResult.rows.map(r => r.status)
    };
  }
}

module.exports = new SearchService();
