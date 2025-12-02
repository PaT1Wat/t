import axios from 'axios';
import { getIdToken } from './firebase';
import type { 
  Book, 
  Author, 
  Publisher, 
  Review, 
  User,
  BooksResponse,
  SearchResponse,
  AutocompleteResponse,
  RecommendationsResponse,
  ReviewsResponse,
  FiltersResponse,
  SearchFilters,
  Pagination,
  UserStats
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(async (config) => {
  const token = await getIdToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

// Books API
export const booksApi = {
  getAll: async (page = 1, limit = 20): Promise<BooksResponse> => {
    const response = await api.get(`/books?page=${page}&limit=${limit}`);
    return response.data;
  },

  getById: async (id: string): Promise<{ book: Book; similarBooks: Book[] }> => {
    const response = await api.get(`/books/${id}`);
    return response.data;
  },

  getByType: async (type: string, page = 1, limit = 20): Promise<BooksResponse> => {
    const response = await api.get(`/books/type/${type}?page=${page}&limit=${limit}`);
    return response.data;
  },

  getTopRated: async (limit = 10): Promise<{ books: Book[] }> => {
    const response = await api.get(`/books/top-rated?limit=${limit}`);
    return response.data;
  },

  getRecent: async (limit = 10): Promise<{ books: Book[] }> => {
    const response = await api.get(`/books/recent?limit=${limit}`);
    return response.data;
  },

  create: async (book: Partial<Book>): Promise<{ book: Book; message: string }> => {
    const response = await api.post('/books', book);
    return response.data;
  },

  update: async (id: string, book: Partial<Book>): Promise<{ book: Book; message: string }> => {
    const response = await api.put(`/books/${id}`, book);
    return response.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/books/${id}`);
    return response.data;
  },
};

// Search API
export const searchApi = {
  search: async (query: string, filters: SearchFilters, page = 1, limit = 20): Promise<SearchResponse> => {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (filters.type) params.append('type', filters.type);
    if (filters.genres?.length) filters.genres.forEach(g => params.append('genres', g));
    if (filters.tags?.length) filters.tags.forEach(t => params.append('tags', t));
    if (filters.status) params.append('status', filters.status);
    if (filters.authorId) params.append('authorId', filters.authorId);
    if (filters.publisherId) params.append('publisherId', filters.publisherId);
    if (filters.minRating) params.append('minRating', filters.minRating.toString());
    if (filters.fromYear) params.append('fromYear', filters.fromYear.toString());
    if (filters.toYear) params.append('toYear', filters.toYear.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.includeNsfw) params.append('includeNsfw', 'true');
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const response = await api.get(`/search?${params.toString()}`);
    return response.data;
  },

  autocomplete: async (query: string, limit = 10): Promise<AutocompleteResponse> => {
    const response = await api.get(`/search/autocomplete?q=${encodeURIComponent(query)}&limit=${limit}`);
    return response.data;
  },

  getFilters: async (): Promise<FiltersResponse> => {
    const response = await api.get('/search/filters');
    return response.data;
  },

  getRecommendations: async (limit = 20): Promise<RecommendationsResponse> => {
    const response = await api.get(`/search/recommendations?limit=${limit}`);
    return response.data;
  },

  getSimilarBooks: async (bookId: string, limit = 10): Promise<{ similarBooks: Book[] }> => {
    const response = await api.get(`/search/similar/${bookId}?limit=${limit}`);
    return response.data;
  },

  getPopular: async (limit = 20): Promise<{ books: Book[] }> => {
    const response = await api.get(`/search/popular?limit=${limit}`);
    return response.data;
  },

  getPopularSearches: async (limit = 10): Promise<{ searches: { query: string; count: number }[] }> => {
    const response = await api.get(`/search/popular-searches?limit=${limit}`);
    return response.data;
  },

  getRecentSearches: async (limit = 10): Promise<{ searches: { query: string; created_at: string }[] }> => {
    const response = await api.get(`/search/recent-searches?limit=${limit}`);
    return response.data;
  },
};

// Authors API
export const authorsApi = {
  getAll: async (page = 1, limit = 20): Promise<{ authors: Author[]; pagination: Pagination }> => {
    const response = await api.get(`/authors?page=${page}&limit=${limit}`);
    return response.data;
  },

  getById: async (id: string): Promise<{ author: Author; books: Book[] }> => {
    const response = await api.get(`/authors/${id}`);
    return response.data;
  },

  create: async (author: Partial<Author>): Promise<{ author: Author; message: string }> => {
    const response = await api.post('/authors', author);
    return response.data;
  },

  update: async (id: string, author: Partial<Author>): Promise<{ author: Author; message: string }> => {
    const response = await api.put(`/authors/${id}`, author);
    return response.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/authors/${id}`);
    return response.data;
  },
};

// Publishers API
export const publishersApi = {
  getAll: async (page = 1, limit = 20): Promise<{ publishers: Publisher[]; pagination: Pagination }> => {
    const response = await api.get(`/publishers?page=${page}&limit=${limit}`);
    return response.data;
  },

  getById: async (id: string): Promise<{ publisher: Publisher; books: Book[] }> => {
    const response = await api.get(`/publishers/${id}`);
    return response.data;
  },

  create: async (publisher: Partial<Publisher>): Promise<{ publisher: Publisher; message: string }> => {
    const response = await api.post('/publishers', publisher);
    return response.data;
  },

  update: async (id: string, publisher: Partial<Publisher>): Promise<{ publisher: Publisher; message: string }> => {
    const response = await api.put(`/publishers/${id}`, publisher);
    return response.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/publishers/${id}`);
    return response.data;
  },
};

// Reviews API
export const reviewsApi = {
  getBookReviews: async (bookId: string, page = 1, limit = 10, sortBy?: string): Promise<ReviewsResponse> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (sortBy) params.append('sortBy', sortBy);

    const response = await api.get(`/reviews/book/${bookId}?${params.toString()}`);
    return response.data;
  },

  create: async (bookId: string, review: { rating: number; content?: string; isSpoiler?: boolean }): Promise<{ review: Review; message: string }> => {
    const response = await api.post(`/reviews/book/${bookId}`, review);
    return response.data;
  },

  update: async (reviewId: string, review: { rating?: number; content?: string; isSpoiler?: boolean }): Promise<{ review: Review; message: string }> => {
    const response = await api.put(`/reviews/${reviewId}`, review);
    return response.data;
  },

  delete: async (reviewId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/reviews/${reviewId}`);
    return response.data;
  },

  getUserReviews: async (page = 1, limit = 10): Promise<{ reviews: Review[]; pagination: Pagination }> => {
    const response = await api.get(`/reviews/my-reviews?page=${page}&limit=${limit}`);
    return response.data;
  },

  markHelpful: async (reviewId: string): Promise<{ review: Review; message: string }> => {
    const response = await api.post(`/reviews/${reviewId}/helpful`);
    return response.data;
  },

  // Admin/Moderator
  getPending: async (page = 1, limit = 10): Promise<{ reviews: Review[]; pagination: Pagination }> => {
    const response = await api.get(`/reviews/pending?page=${page}&limit=${limit}`);
    return response.data;
  },

  moderate: async (reviewId: string, isApproved: boolean): Promise<{ review: Review; message: string }> => {
    const response = await api.put(`/reviews/${reviewId}/moderate`, { isApproved });
    return response.data;
  },
};

// Favorites API
export const favoritesApi = {
  getAll: async (page = 1, limit = 20): Promise<{ favorites: (Book & { favorite_id: string; favorited_at: string })[]; pagination: Pagination }> => {
    const response = await api.get(`/favorites?page=${page}&limit=${limit}`);
    return response.data;
  },

  add: async (bookId: string): Promise<{ favorite: any; book: Book; message: string }> => {
    const response = await api.post(`/favorites/${bookId}`);
    return response.data;
  },

  remove: async (bookId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/favorites/${bookId}`);
    return response.data;
  },

  check: async (bookId: string): Promise<{ isFavorite: boolean }> => {
    const response = await api.get(`/favorites/check/${bookId}`);
    return response.data;
  },

  getCount: async (bookId: string): Promise<{ count: number }> => {
    const response = await api.get(`/favorites/count/${bookId}`);
    return response.data;
  },
};

// Users API
export const usersApi = {
  register: async (userData: { firebaseUid: string; email: string; username: string; displayName?: string }): Promise<{ user: User; message: string }> => {
    const response = await api.post('/users/register', userData);
    return response.data;
  },

  getProfile: async (): Promise<{ user: User }> => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  updateProfile: async (profile: { displayName?: string; avatarUrl?: string; preferredLanguage?: string }): Promise<{ user: User; message: string }> => {
    const response = await api.put('/users/profile', profile);
    return response.data;
  },

  getStats: async (): Promise<{ stats: UserStats }> => {
    const response = await api.get('/users/stats');
    return response.data;
  },

  // Admin
  getAllUsers: async (page = 1, limit = 20): Promise<{ users: User[]; pagination: Pagination }> => {
    const response = await api.get(`/users?page=${page}&limit=${limit}`);
    return response.data;
  },

  updateRole: async (userId: string, role: string): Promise<{ user: User; message: string }> => {
    const response = await api.put(`/users/${userId}/role`, { role });
    return response.data;
  },
};

export default api;
