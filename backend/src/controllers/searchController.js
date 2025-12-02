const searchService = require('../services/searchService');
const recommendationService = require('../services/recommendationService');

// Search books
const searchBooks = async (req, res) => {
  try {
    const { q, type, genres, tags, status, authorId, publisherId, minRating, fromYear, toYear, sortBy, includeNsfw } = req.query;
    const { page, limit, offset } = req.pagination;

    const filters = {
      type,
      genres: genres ? (Array.isArray(genres) ? genres : [genres]) : null,
      tags: tags ? (Array.isArray(tags) ? tags : [tags]) : null,
      status,
      authorId,
      publisherId,
      minRating: minRating ? parseFloat(minRating) : null,
      fromYear: fromYear ? parseInt(fromYear) : null,
      toYear: toYear ? parseInt(toYear) : null,
      sortBy,
      includeNsfw: includeNsfw === 'true'
    };

    const results = await searchService.searchBooks(q, filters, { limit, offset });

    // Save search history for logged-in users
    if (req.user && q) {
      await searchService.saveSearchHistory(req.user.id, q, filters, results.pagination.total);
    }

    res.json(results);
  } catch (error) {
    console.error('Search books error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: 'เกิดข้อผิดพลาดในการค้นหา' 
    });
  }
};

// Get autocomplete suggestions
const getAutocomplete = async (req, res) => {
  try {
    const { q } = req.query;
    const limit = parseInt(req.query.limit) || 10;

    const suggestions = await searchService.getAutocompleteSuggestions(q, limit);

    res.json(suggestions);
  } catch (error) {
    console.error('Autocomplete error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: 'เกิดข้อผิดพลาด' 
    });
  }
};

// Get recent searches for user
const getRecentSearches = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    const searches = await searchService.getRecentSearches(userId, limit);

    res.json({ searches });
  } catch (error) {
    console.error('Get recent searches error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: 'เกิดข้อผิดพลาด' 
    });
  }
};

// Get popular searches
const getPopularSearches = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const searches = await searchService.getPopularSearches(limit);

    res.json({ searches });
  } catch (error) {
    console.error('Get popular searches error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: 'เกิดข้อผิดพลาด' 
    });
  }
};

// Get available filters
const getFilters = async (req, res) => {
  try {
    const filters = await searchService.getAvailableFilters();

    res.json({ filters });
  } catch (error) {
    console.error('Get filters error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: 'เกิดข้อผิดพลาด' 
    });
  }
};

// Get personalized recommendations
const getRecommendations = async (req, res) => {
  try {
    const userId = req.user?.id;
    const limit = parseInt(req.query.limit) || 20;

    const recommendations = await recommendationService.getRecommendations(userId, limit);

    res.json({ recommendations });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: 'เกิดข้อผิดพลาดในการดึงคำแนะนำ' 
    });
  }
};

// Get similar books
const getSimilarBooks = async (req, res) => {
  try {
    const { bookId } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const similarBooks = await recommendationService.getContentBasedRecommendations(bookId, limit);

    res.json({ similarBooks });
  } catch (error) {
    console.error('Get similar books error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: 'เกิดข้อผิดพลาด' 
    });
  }
};

// Get popular books
const getPopularBooks = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const books = await recommendationService.getPopularRecommendations(limit);

    res.json({ books });
  } catch (error) {
    console.error('Get popular books error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: 'เกิดข้อผิดพลาด' 
    });
  }
};

module.exports = {
  searchBooks,
  getAutocomplete,
  getRecentSearches,
  getPopularSearches,
  getFilters,
  getRecommendations,
  getSimilarBooks,
  getPopularBooks
};
