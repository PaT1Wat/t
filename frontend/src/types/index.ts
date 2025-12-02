export interface User {
  id: string;
  firebase_uid: string;
  email: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  role: 'user' | 'admin' | 'moderator';
  preferred_language: string;
  created_at: string;
  updated_at: string;
}

export interface Author {
  id: string;
  name: string;
  name_thai?: string;
  bio?: string;
  bio_thai?: string;
  image_url?: string;
  book_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Publisher {
  id: string;
  name: string;
  name_thai?: string;
  description?: string;
  description_thai?: string;
  website_url?: string;
  logo_url?: string;
  book_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Book {
  id: string;
  title: string;
  title_thai?: string;
  description?: string;
  description_thai?: string;
  cover_image_url?: string;
  type: 'manga' | 'novel' | 'light_novel' | 'webtoon';
  status: 'ongoing' | 'completed' | 'hiatus' | 'cancelled';
  publication_year?: number;
  total_chapters?: number;
  total_volumes?: number;
  author_id?: string;
  publisher_id?: string;
  average_rating: number;
  total_reviews: number;
  tags?: string[];
  genres?: string[];
  is_nsfw: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  author_name?: string;
  author_name_thai?: string;
  publisher_name?: string;
  publisher_name_thai?: string;
  // Recommendation fields
  similarity_score?: number;
  predicted_rating?: number;
  recommendation_type?: string;
}

export interface Review {
  id: string;
  user_id: string;
  book_id: string;
  rating: number;
  content?: string;
  is_spoiler: boolean;
  is_approved: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  username?: string;
  display_name?: string;
  avatar_url?: string;
  book_title?: string;
  book_title_thai?: string;
  book_cover?: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  book_id: string;
  created_at: string;
  // With book data
  favorite_id?: string;
  favorited_at?: string;
}

export interface SearchFilters {
  type?: string;
  genres?: string[];
  tags?: string[];
  status?: string;
  authorId?: string;
  publisherId?: string;
  minRating?: number;
  fromYear?: number;
  toYear?: number;
  sortBy?: string;
  includeNsfw?: boolean;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface BooksResponse {
  books: Book[];
  pagination: Pagination;
}

export interface SearchResponse {
  books: Book[];
  pagination: Pagination;
}

export interface AutocompleteResponse {
  books: { id: string; title: string; title_thai?: string; cover_image_url?: string; type: string }[];
  authors: { id: string; name: string; name_thai?: string; image_url?: string }[];
  tags: string[];
  genres: string[];
}

export interface RecommendationsResponse {
  recommendations: Book[];
}

export interface ReviewsResponse {
  reviews: Review[];
  ratingDistribution: { [key: number]: number };
  pagination: Pagination;
}

export interface FiltersResponse {
  filters: {
    types: string[];
    genres: string[];
    tags: string[];
    statuses: string[];
  };
}

export interface UserStats {
  totalFavorites: number;
  totalReviews: number;
  averageRating: number;
  totalSearches: number;
}
