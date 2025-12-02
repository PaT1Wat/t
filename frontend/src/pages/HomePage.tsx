import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { searchApi, booksApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import BookCard from '../components/BookCard';
import SearchBar from '../components/SearchBar';
import LoadingSpinner from '../components/LoadingSpinner';
import type { Book } from '../types';

const HomePage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [recommendations, setRecommendations] = useState<Book[]>([]);
  const [popularBooks, setPopularBooks] = useState<Book[]>([]);
  const [recentBooks, setRecentBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [recsData, popularData, recentData] = await Promise.all([
          searchApi.getRecommendations(10),
          searchApi.getPopular(10),
          booksApi.getRecent(10)
        ]);

        setRecommendations(recsData.recommendations);
        setPopularBooks(popularData.books);
        setRecentBooks(recentData.books);
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated]);

  const typeCategories = [
    { type: 'manga', label: 'มังงะ', icon: '📖', color: 'from-pink-500 to-rose-500' },
    { type: 'novel', label: 'นิยาย', icon: '📚', color: 'from-blue-500 to-indigo-500' },
    { type: 'light_novel', label: 'ไลท์โนเวล', icon: '📕', color: 'from-purple-500 to-violet-500' },
    { type: 'webtoon', label: 'เว็บตูน', icon: '📱', color: 'from-green-500 to-emerald-500' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              🎌 ค้นพบมังงะและนิยายที่ใช่สำหรับคุณ
            </h1>
            <p className="text-xl text-primary-100 mb-8">
              ระบบแนะนำหนังสืออัจฉริยะ ด้วย AI ที่เข้าใจรสนิยมของคุณ
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <SearchBar size="lg" autoFocus />
            </div>

            {/* Quick stats */}
            <div className="mt-8 flex justify-center space-x-8 text-primary-100">
              <div>
                <span className="block text-3xl font-bold text-white">1000+</span>
                <span className="text-sm">หนังสือ</span>
              </div>
              <div>
                <span className="block text-3xl font-bold text-white">500+</span>
                <span className="text-sm">ผู้แต่ง</span>
              </div>
              <div>
                <span className="block text-3xl font-bold text-white">5000+</span>
                <span className="text-sm">รีวิว</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 -mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {typeCategories.map((cat) => (
              <Link
                key={cat.type}
                to={`/books?type=${cat.type}`}
                className={`bg-gradient-to-r ${cat.color} text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow`}
              >
                <span className="text-3xl mb-2 block">{cat.icon}</span>
                <span className="font-semibold text-lg">{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {loading ? (
        <LoadingSpinner message="กำลังโหลด..." />
      ) : (
        <>
          {/* Personalized Recommendations */}
          {recommendations.length > 0 && (
            <section className="py-8">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {isAuthenticated ? `แนะนำสำหรับคุณ ${user?.display_name}` : 'แนะนำสำหรับคุณ'}
                  </h2>
                  <Link 
                    to="/recommendations" 
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    ดูทั้งหมด →
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {recommendations.slice(0, 5).map((book) => (
                    <BookCard key={book.id} book={book} />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Popular Books */}
          {popularBooks.length > 0 && (
            <section className="py-8 bg-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    🔥 ยอดนิยม
                  </h2>
                  <Link 
                    to="/books?sortBy=rating" 
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    ดูทั้งหมด →
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {popularBooks.slice(0, 5).map((book) => (
                    <BookCard key={book.id} book={book} />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Recent Books */}
          {recentBooks.length > 0 && (
            <section className="py-8">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    🆕 เพิ่งเพิ่มใหม่
                  </h2>
                  <Link 
                    to="/books?sortBy=newest" 
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    ดูทั้งหมด →
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {recentBooks.slice(0, 5).map((book) => (
                    <BookCard key={book.id} book={book} />
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="py-16 bg-gradient-to-r from-primary-600 to-secondary-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              เริ่มต้นค้นพบหนังสือที่ใช่วันนี้!
            </h2>
            <p className="text-primary-100 mb-8 max-w-2xl mx-auto">
              สมัครสมาชิกฟรี เพื่อรับคำแนะนำหนังสือที่ตรงใจ บันทึกรายการโปรด และแบ่งปันความคิดเห็น
            </p>
            <Link
              to="/register"
              className="inline-block bg-white text-primary-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition"
            >
              สมัครสมาชิกฟรี
            </Link>
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;
