import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { booksApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import BookCard from '../components/BookCard';
import LoadingSpinner from '../components/LoadingSpinner';

const HomePage = () => {
  const { isAuthenticated } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [popularBooks, setPopularBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBooks();
  }, [isAuthenticated]);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      // Fetch recommendations
      const recsResponse = await booksApi.getRecommendations(12);
      setRecommendations(recsResponse.data);

      // Fetch popular/all books
      const booksResponse = await booksApi.getAll(1, 12);
      setPopularBooks(booksResponse.data.results);
    } catch (error) {
      console.error('Error fetching books:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-8 md:p-12 text-white">
        <div className="max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            ยินดีต้อนรับสู่ MangaRec
          </h1>
          <p className="text-lg md:text-xl text-primary-100 mb-6">
            ค้นพบมังงะและนิยายที่คุณจะหลงรัก ด้วยระบบแนะนำอัจฉริยะที่เรียนรู้จากความชอบของคุณ
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/search"
              className="bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
            >
              เริ่มค้นหา
            </Link>
            {!isAuthenticated && (
              <Link
                to="/register"
                className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors"
              >
                สมัครสมาชิก
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Recommendations Section */}
      {recommendations.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {isAuthenticated ? 'แนะนำสำหรับคุณ' : 'หนังสือยอดนิยม'}
            </h2>
            <Link to="/search" className="text-primary-600 hover:text-primary-700 font-medium">
              ดูทั้งหมด →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
            {recommendations.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </section>
      )}

      {/* Popular Books Section */}
      {popularBooks.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">หนังสือทั้งหมด</h2>
            <Link to="/search" className="text-primary-600 hover:text-primary-700 font-medium">
              ดูทั้งหมด →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
            {popularBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="bg-white rounded-2xl p-8 shadow-md">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
          ทำไมต้อง MangaRec?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">AI แนะนำอัจฉริยะ</h3>
            <p className="text-gray-600">
              ระบบ AI วิเคราะห์ความชอบของคุณและแนะนำหนังสือที่คุณจะต้องหลงรัก
            </p>
          </div>
          <div className="text-center">
            <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">ค้นหาได้ทุกภาษา</h3>
            <p className="text-gray-600">
              รองรับการค้นหาทั้งภาษาไทยและภาษาอังกฤษ พร้อม Autocomplete
            </p>
          </div>
          <div className="text-center">
            <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">บันทึกรายการโปรด</h3>
            <p className="text-gray-600">
              บันทึกหนังสือที่ชอบและเข้าถึงได้ง่ายทุกเมื่อ
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
