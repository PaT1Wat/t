import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { favoritesApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import BookCard from '../components/BookCard';
import LoadingSpinner from '../components/LoadingSpinner';

const FavoritesPage = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        navigate('/login');
      } else {
        fetchFavorites();
      }
    }
  }, [isAuthenticated, authLoading, navigate]);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const response = await favoritesApi.getAll(1, 100);
      setFavorites(response.data.results);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
    setLoading(false);
  };

  const handleRemoveFavorite = async (bookId) => {
    try {
      await favoritesApi.remove(bookId);
      setFavorites(prev => prev.filter(f => f.book_id !== bookId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  if (authLoading || loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">รายการโปรด</h1>

      {favorites.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {favorites.map((favorite) => (
            <div key={favorite.id} className="relative">
              <BookCard book={favorite.book} />
              <button
                onClick={() => handleRemoveFavorite(favorite.book_id)}
                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-md"
                title="ลบออกจากรายการโปรด"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <svg className="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <h3 className="text-xl font-medium text-gray-900 mb-2">ยังไม่มีรายการโปรด</h3>
          <p className="text-gray-600 mb-4">เริ่มเพิ่มหนังสือที่ชอบลงในรายการโปรดได้เลย</p>
          <Link
            to="/search"
            className="inline-block bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
          >
            ค้นหาหนังสือ
          </Link>
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;
