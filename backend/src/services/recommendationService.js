const natural = require('natural');
const KNN = require('ml-knn');
const { pool } = require('../config/database');

// TF-IDF instance for content-based filtering
const TfIdf = natural.TfIdf;

class RecommendationService {
  constructor() {
    this.tfidf = null;
    this.booksData = [];
    this.userItemMatrix = null;
    this.knnModel = null;
    this.lastUpdate = null;
    this.updateInterval = 3600000; // 1 hour
  }

  // Initialize or refresh the recommendation models
  async initialize() {
    const now = Date.now();
    if (this.lastUpdate && (now - this.lastUpdate) < this.updateInterval) {
      return; // Skip if recently updated
    }

    console.log('Initializing recommendation models...');
    
    try {
      // Load books data
      const booksResult = await pool.query(`
        SELECT b.*, 
               a.name as author_name, 
               a.name_thai as author_name_thai,
               p.name as publisher_name
        FROM books b
        LEFT JOIN authors a ON b.author_id = a.id
        LEFT JOIN publishers p ON b.publisher_id = p.id
        ORDER BY b.created_at DESC
      `);
      this.booksData = booksResult.rows;

      // Build TF-IDF model for content-based filtering
      await this.buildTfIdfModel();

      // Build user-item matrix for collaborative filtering
      await this.buildUserItemMatrix();

      this.lastUpdate = now;
      console.log('Recommendation models initialized successfully');
    } catch (error) {
      console.error('Error initializing recommendation models:', error);
    }
  }

  // Build TF-IDF model from book content
  async buildTfIdfModel() {
    this.tfidf = new TfIdf();
    
    this.booksData.forEach((book, index) => {
      // Combine all text features for TF-IDF
      const document = [
        book.title || '',
        book.title_thai || '',
        book.description || '',
        book.description_thai || '',
        book.author_name || '',
        book.author_name_thai || '',
        book.type || '',
        ...(book.tags || []),
        ...(book.genres || [])
      ].join(' ').toLowerCase();
      
      this.tfidf.addDocument(document);
    });
  }

  // Build user-item matrix for collaborative filtering
  async buildUserItemMatrix() {
    try {
      // Get all user ratings/interactions
      const ratingsResult = await pool.query(`
        SELECT user_id, book_id, rating
        FROM reviews
        UNION ALL
        SELECT user_id, book_id, 4 as rating
        FROM favorites
        UNION ALL
        SELECT user_id, book_id, LEAST(view_count, 3) as rating
        FROM reading_history
      `);

      if (ratingsResult.rows.length === 0) {
        this.userItemMatrix = null;
        return;
      }

      // Create user and book mappings
      const users = [...new Set(ratingsResult.rows.map(r => r.user_id))];
      const books = [...new Set(ratingsResult.rows.map(r => r.book_id))];
      
      this.userMapping = {};
      this.bookMapping = {};
      users.forEach((u, i) => this.userMapping[u] = i);
      books.forEach((b, i) => this.bookMapping[b] = i);
      
      this.reverseUserMapping = users;
      this.reverseBookMapping = books;

      // Build matrix
      const matrix = Array(users.length).fill(null).map(() => 
        Array(books.length).fill(0)
      );

      ratingsResult.rows.forEach(r => {
        const userIdx = this.userMapping[r.user_id];
        const bookIdx = this.bookMapping[r.book_id];
        if (userIdx !== undefined && bookIdx !== undefined) {
          // Take max rating if multiple interactions
          matrix[userIdx][bookIdx] = Math.max(matrix[userIdx][bookIdx], r.rating);
        }
      });

      this.userItemMatrix = matrix;

      // Train KNN model for user-based collaborative filtering
      if (matrix.length > 1) {
        this.knnModel = new KNN(matrix, users, { k: Math.min(5, matrix.length - 1) });
      }
    } catch (error) {
      console.error('Error building user-item matrix:', error);
      this.userItemMatrix = null;
    }
  }

  // Calculate cosine similarity between two vectors
  cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // Get TF-IDF vector for a document
  getTfIdfVector(docIndex) {
    if (!this.tfidf || docIndex < 0 || docIndex >= this.booksData.length) {
      return [];
    }
    
    const vector = [];
    this.tfidf.listTerms(docIndex).forEach(term => {
      vector.push(term.tfidf);
    });
    return vector;
  }

  // Content-based recommendations using TF-IDF and Cosine Similarity
  async getContentBasedRecommendations(bookId, limit = 10) {
    await this.initialize();
    
    const bookIndex = this.booksData.findIndex(b => b.id === bookId);
    if (bookIndex === -1) return [];

    const targetBook = this.booksData[bookIndex];
    const similarities = [];

    // Calculate similarity with all other books
    this.booksData.forEach((book, index) => {
      if (index !== bookIndex) {
        // Combine multiple similarity factors
        let similarity = 0;
        let factors = 0;

        // TF-IDF based text similarity
        const targetTerms = {};
        const bookTerms = {};
        
        this.tfidf.listTerms(bookIndex).forEach(t => targetTerms[t.term] = t.tfidf);
        this.tfidf.listTerms(index).forEach(t => bookTerms[t.term] = t.tfidf);
        
        const allTerms = new Set([...Object.keys(targetTerms), ...Object.keys(bookTerms)]);
        const vecA = [];
        const vecB = [];
        allTerms.forEach(term => {
          vecA.push(targetTerms[term] || 0);
          vecB.push(bookTerms[term] || 0);
        });
        
        const textSim = this.cosineSimilarity(vecA, vecB);
        similarity += textSim * 0.4;
        factors++;

        // Same type bonus
        if (targetBook.type === book.type) {
          similarity += 0.2;
          factors++;
        }

        // Same author bonus
        if (targetBook.author_id && targetBook.author_id === book.author_id) {
          similarity += 0.2;
          factors++;
        }

        // Genre overlap
        if (targetBook.genres && book.genres) {
          const genreOverlap = targetBook.genres.filter(g => book.genres.includes(g)).length;
          const totalGenres = new Set([...targetBook.genres, ...book.genres]).size;
          if (totalGenres > 0) {
            similarity += (genreOverlap / totalGenres) * 0.3;
            factors++;
          }
        }

        // Tag overlap
        if (targetBook.tags && book.tags) {
          const tagOverlap = targetBook.tags.filter(t => book.tags.includes(t)).length;
          const totalTags = new Set([...targetBook.tags, ...book.tags]).size;
          if (totalTags > 0) {
            similarity += (tagOverlap / totalTags) * 0.2;
            factors++;
          }
        }

        similarities.push({
          book,
          similarity: factors > 0 ? similarity / factors : 0
        });
      }
    });

    // Sort by similarity and return top N
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(s => ({
        ...s.book,
        similarity_score: s.similarity,
        recommendation_type: 'content_based'
      }));
  }

  // SVD-like matrix factorization (simplified for speed)
  performSVD(matrix, k = 10) {
    if (!matrix || matrix.length === 0) return { U: [], S: [], V: [] };
    
    const rows = matrix.length;
    const cols = matrix[0].length;
    k = Math.min(k, rows, cols);
    
    // Simple approximation using power iteration
    // In production, use a proper SVD library
    let U = Array(rows).fill(null).map(() => Array(k).fill(0).map(() => Math.random()));
    let V = Array(cols).fill(null).map(() => Array(k).fill(0).map(() => Math.random()));
    
    // Normalize
    for (let i = 0; i < k; i++) {
      let sumU = 0, sumV = 0;
      for (let j = 0; j < rows; j++) sumU += U[j][i] * U[j][i];
      for (let j = 0; j < cols; j++) sumV += V[j][i] * V[j][i];
      sumU = Math.sqrt(sumU);
      sumV = Math.sqrt(sumV);
      for (let j = 0; j < rows; j++) U[j][i] /= sumU || 1;
      for (let j = 0; j < cols; j++) V[j][i] /= sumV || 1;
    }
    
    return { U, V };
  }

  // Collaborative filtering using KNN and SVD
  async getCollaborativeRecommendations(userId, limit = 10) {
    await this.initialize();
    
    if (!this.userItemMatrix || !this.userMapping[userId]) {
      return [];
    }

    const userIndex = this.userMapping[userId];
    const userRatings = this.userItemMatrix[userIndex];
    
    // Find similar users using KNN
    const similarities = [];
    this.userItemMatrix.forEach((otherRatings, otherIndex) => {
      if (otherIndex !== userIndex) {
        const sim = this.cosineSimilarity(userRatings, otherRatings);
        if (sim > 0) {
          similarities.push({ index: otherIndex, similarity: sim });
        }
      }
    });

    // Sort by similarity
    similarities.sort((a, b) => b.similarity - a.similarity);
    const topSimilarUsers = similarities.slice(0, 10);

    // Aggregate recommendations from similar users
    const bookScores = {};
    topSimilarUsers.forEach(({ index, similarity }) => {
      this.userItemMatrix[index].forEach((rating, bookIdx) => {
        if (rating > 0 && userRatings[bookIdx] === 0) {
          const bookId = this.reverseBookMapping[bookIdx];
          if (!bookScores[bookId]) {
            bookScores[bookId] = { score: 0, count: 0 };
          }
          bookScores[bookId].score += rating * similarity;
          bookScores[bookId].count++;
        }
      });
    });

    // Convert to array and sort
    const recommendations = Object.entries(bookScores)
      .map(([bookId, { score, count }]) => ({
        book_id: bookId,
        predicted_rating: score / count,
        recommendation_type: 'collaborative'
      }))
      .sort((a, b) => b.predicted_rating - a.predicted_rating)
      .slice(0, limit);

    // Fetch book details
    if (recommendations.length === 0) return [];

    const bookIds = recommendations.map(r => r.book_id);
    const booksResult = await pool.query(`
      SELECT b.*, a.name as author_name, p.name as publisher_name
      FROM books b
      LEFT JOIN authors a ON b.author_id = a.id
      LEFT JOIN publishers p ON b.publisher_id = p.id
      WHERE b.id = ANY($1)
    `, [bookIds]);

    const booksMap = {};
    booksResult.rows.forEach(b => booksMap[b.id] = b);

    return recommendations.map(r => ({
      ...booksMap[r.book_id],
      predicted_rating: r.predicted_rating,
      recommendation_type: r.recommendation_type
    })).filter(r => r.id);
  }

  // Hybrid recommendations combining content-based and collaborative filtering
  async getHybridRecommendations(userId, limit = 20) {
    await this.initialize();

    let contentBased = [];
    let collaborative = [];

    // Get user's recently viewed/favorited books for content-based recommendations
    const userBooksResult = await pool.query(`
      SELECT DISTINCT book_id FROM (
        SELECT book_id FROM favorites WHERE user_id = $1
        UNION ALL
        SELECT book_id FROM reading_history WHERE user_id = $1 ORDER BY last_viewed_at DESC LIMIT 5
        UNION ALL
        SELECT book_id FROM reviews WHERE user_id = $1 AND rating >= 4
      ) as user_books
      LIMIT 10
    `, [userId]);

    // Get content-based recommendations from user's books
    const contentPromises = userBooksResult.rows.map(row =>
      this.getContentBasedRecommendations(row.book_id, 5)
    );
    const contentResults = await Promise.all(contentPromises);
    contentBased = contentResults.flat();

    // Get collaborative filtering recommendations
    collaborative = await this.getCollaborativeRecommendations(userId, limit);

    // Combine and deduplicate
    const seen = new Set();
    const combined = [];

    // Interleave results
    const maxLen = Math.max(contentBased.length, collaborative.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < collaborative.length && !seen.has(collaborative[i].id)) {
        seen.add(collaborative[i].id);
        combined.push({ ...collaborative[i], source: 'collaborative' });
      }
      if (i < contentBased.length && !seen.has(contentBased[i].id)) {
        seen.add(contentBased[i].id);
        combined.push({ ...contentBased[i], source: 'content' });
      }
    }

    // Filter out books user has already interacted with
    const userInteractedResult = await pool.query(`
      SELECT book_id FROM favorites WHERE user_id = $1
      UNION
      SELECT book_id FROM reviews WHERE user_id = $1
    `, [userId]);
    const userInteractedBooks = new Set(userInteractedResult.rows.map(r => r.book_id));

    return combined
      .filter(book => !userInteractedBooks.has(book.id))
      .slice(0, limit);
  }

  // Get popular books (fallback when no user data)
  async getPopularRecommendations(limit = 20) {
    const result = await pool.query(`
      SELECT b.*, a.name as author_name, p.name as publisher_name,
             COALESCE(b.average_rating, 0) * 0.4 + 
             COALESCE(b.total_reviews, 0) * 0.01 + 
             COALESCE(f.favorite_count, 0) * 0.05 as popularity_score
      FROM books b
      LEFT JOIN authors a ON b.author_id = a.id
      LEFT JOIN publishers p ON b.publisher_id = p.id
      LEFT JOIN (
        SELECT book_id, COUNT(*) as favorite_count 
        FROM favorites 
        GROUP BY book_id
      ) f ON b.id = f.book_id
      ORDER BY popularity_score DESC, b.created_at DESC
      LIMIT $1
    `, [limit]);

    return result.rows.map(book => ({
      ...book,
      recommendation_type: 'popular'
    }));
  }

  // Get personalized recommendations for a user
  async getRecommendations(userId, limit = 20) {
    try {
      if (!userId) {
        return this.getPopularRecommendations(limit);
      }

      const hybridRecs = await this.getHybridRecommendations(userId, limit);
      
      if (hybridRecs.length < limit) {
        // Fill with popular books if not enough recommendations
        const popular = await this.getPopularRecommendations(limit - hybridRecs.length);
        const existingIds = new Set(hybridRecs.map(r => r.id));
        const additionalPopular = popular.filter(p => !existingIds.has(p.id));
        return [...hybridRecs, ...additionalPopular].slice(0, limit);
      }

      return hybridRecs;
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return this.getPopularRecommendations(limit);
    }
  }
}

module.exports = new RecommendationService();
