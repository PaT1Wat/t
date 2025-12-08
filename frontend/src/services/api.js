import axios from 'axios';
import { getIdToken } from './firebase';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
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
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Books API
export const booksApi = {
  getAll: (page = 1, limit = 20) => 
    api.get(`/books?page=${page}&limit=${limit}`),
  
  getById: (id) => 
    api.get(`/books/${id}`),
  
  getSimilar: (id, limit = 10) => 
    api.get(`/books/${id}/similar?limit=${limit}`),
  
  getRecommendations: (limit = 20) => 
    api.get(`/books/recommendations?limit=${limit}`),
  
  create: (data) => 
    api.post('/books', data),
  
  update: (id, data) => 
    api.put(`/books/${id}`, data),
  
  delete: (id) => 
    api.delete(`/books/${id}`),
};

// Search API
export const searchApi = {
  search: (query, filters = {}, page = 1, limit = 20) => {
    const params = new URLSearchParams({ q: query, page, limit });
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    return api.get(`/search?${params.toString()}`);
  },
  
  autocomplete: (query, limit = 10) => 
    api.get(`/search/autocomplete?q=${query}&limit=${limit}`),
  
  getGenres: () => 
    api.get('/search/genres'),
  
  getTags: () => 
    api.get('/search/tags'),
};

// Authors API
export const authorsApi = {
  getAll: (page = 1, limit = 20) => 
    api.get(`/authors?page=${page}&limit=${limit}`),
  
  getById: (id) => 
    api.get(`/authors/${id}`),
  
  create: (data) => 
    api.post('/authors', data),
  
  update: (id, data) => 
    api.put(`/authors/${id}`, data),
  
  delete: (id) => 
    api.delete(`/authors/${id}`),
};

// Publishers API
export const publishersApi = {
  getAll: (page = 1, limit = 20) => 
    api.get(`/publishers?page=${page}&limit=${limit}`),
  
  getById: (id) => 
    api.get(`/publishers/${id}`),
  
  create: (data) => 
    api.post('/publishers', data),
  
  update: (id, data) => 
    api.put(`/publishers/${id}`, data),
  
  delete: (id) => 
    api.delete(`/publishers/${id}`),
};

// Reviews API
export const reviewsApi = {
  getBookReviews: (bookId, page = 1, limit = 20) => 
    api.get(`/reviews/book/${bookId}?page=${page}&limit=${limit}`),
  
  create: (data) => 
    api.post('/reviews', data),
  
  update: (id, data) => 
    api.put(`/reviews/${id}`, data),
  
  delete: (id) => 
    api.delete(`/reviews/${id}`),
  
  markHelpful: (id) => 
    api.post(`/reviews/${id}/helpful`),
};

// Favorites API
export const favoritesApi = {
  getAll: (page = 1, limit = 20) => 
    api.get(`/favorites?page=${page}&limit=${limit}`),
  
  add: (bookId) => 
    api.post('/favorites', { book_id: bookId }),
  
  remove: (bookId) => 
    api.delete(`/favorites/${bookId}`),
  
  check: (bookId) => 
    api.get(`/favorites/check/${bookId}`),
};

// Users API
export const usersApi = {
  getCurrentUser: () => 
    api.get('/users/me'),
  
  updateProfile: (data) => 
    api.put('/users/me', data),
  
  getUserById: (id) => 
    api.get(`/users/${id}`),
  
  getUserReviews: (id) => 
    api.get(`/users/${id}/reviews`),
  
  getUserFavorites: (id) => 
    api.get(`/users/${id}/favorites`),
};

export default api;
