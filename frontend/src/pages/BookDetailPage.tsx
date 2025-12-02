import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { booksApi, reviewsApi, favoritesApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import BookCard from '../components/BookCard';
import RatingStars from '../components/RatingStars';
import LoadingSpinner from '../components/LoadingSpinner';
import type { Book, Review, ReviewsResponse } from '../types';

const BookDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [similarBooks, setSimilarBooks] = useState<Book[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsData, setReviewsData] = useState<ReviewsResponse | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);

  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newReviewContent, setNewReviewContent] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const typeLabels: { [key: string]: string } = {
    manga: 'มังงะ',
    novel: 'นิยาย',
    light_novel: 'ไลท์โนเวล',
    webtoon: 'เว็บตูน',
  };

  const statusLabels: { [key: string]: string } = {
    ongoing: 'กำลังดำเนินเรื่อง',
    completed: 'จบแล้ว',
    hiatus: 'พักการตีพิมพ์',
    cancelled: 'ยกเลิก',
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const [bookData, reviewsData] = await Promise.all([
          booksApi.getById(id),
          reviewsApi.getBookReviews(id, 1, 5)
        ]);

        setBook(bookData.book);
        setSimilarBooks(bookData.similarBooks);
        setReviews(reviewsData.reviews);
        setReviewsData(reviewsData);

        // Check if favorited
        if (isAuthenticated) {
          try {
            const favData = await favoritesApi.check(id);
            setIsFavorite(favData.isFavorite);
          } catch (error) {
            console.error('Error checking favorite:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching book:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isAuthenticated]);

  const handleToggleFavorite = async () => {
    if (!isAuthenticated || !id) return;

    try {
      if (isFavorite) {
        await favoritesApi.remove(id);
      } else {
        await favoritesApi.add(id);
      }
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !isAuthenticated) return;

    setReviewSubmitting(true);
    try {
      await reviewsApi.create(id, {
        rating: newRating,
        content: newReviewContent,
        isSpoiler
      });

      // Refresh reviews
      const reviewsData = await reviewsApi.getBookReviews(id, 1, 5);
      setReviews(reviewsData.reviews);
      setReviewsData(reviewsData);

      // Refresh book data for updated rating
      const bookData = await booksApi.getById(id);
      setBook(bookData.book);

      // Reset form
      setShowReviewForm(false);
      setNewRating(5);
      setNewReviewContent('');
      setIsSpoiler(false);
    } catch (error: any) {
      alert(error.response?.data?.message || 'เกิดข้อผิดพลาดในการส่งรีวิว');
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" message="กำลังโหลดข้อมูลหนังสือ..." />;
  }

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">ไม่พบหนังสือ</h1>
          <Link to="/" className="text-primary-600 hover:text-primary-700">
            กลับหน้าแรก
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Book Detail Section */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="md:flex">
            {/* Cover Image */}
            <div className="md:w-1/3 lg:w-1/4">
              <div className="aspect-[3/4] bg-gray-200">
                {book.cover_image_url ? (
                  <img 
                    src={book.cover_image_url} 
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-400 to-secondary-400">
                    <span className="text-white text-6xl">📚</span>
                  </div>
                )}
              </div>
            </div>

            {/* Book Info */}
            <div className="md:w-2/3 lg:w-3/4 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {book.type && (
                      <span className="bg-primary-100 text-primary-700 text-sm px-3 py-1 rounded-full">
                        {typeLabels[book.type]}
                      </span>
                    )}
                    {book.status && (
                      <span className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">
                        {statusLabels[book.status]}
                      </span>
                    )}
                    {book.is_nsfw && (
                      <span className="bg-red-100 text-red-700 text-sm px-3 py-1 rounded-full">
                        18+
                      </span>
                    )}
                  </div>
                  
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {book.title_thai || book.title}
                  </h1>
                  {book.title_thai && book.title !== book.title_thai && (
                    <p className="text-lg text-gray-600 mb-4">{book.title}</p>
                  )}
                </div>

                {/* Favorite Button */}
                {isAuthenticated && (
                  <button
                    onClick={handleToggleFavorite}
                    className={`p-2 rounded-full ${
                      isFavorite 
                        ? 'text-red-500 bg-red-50 hover:bg-red-100' 
                        : 'text-gray-400 bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <svg 
                      className="w-6 h-6" 
                      fill={isFavorite ? 'currentColor' : 'none'} 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Author & Publisher */}
              <div className="mb-4">
                {book.author_name && (
                  <Link 
                    to={`/author/${book.author_id}`}
                    className="text-primary-600 hover:text-primary-700"
                  >
                    ผู้แต่ง: {book.author_name_thai || book.author_name}
                  </Link>
                )}
                {book.publisher_name && (
                  <p className="text-gray-600">
                    สำนักพิมพ์: {book.publisher_name_thai || book.publisher_name}
                  </p>
                )}
              </div>

              {/* Rating */}
              <div className="flex items-center mb-4">
                <RatingStars rating={book.average_rating} size="lg" />
                <span className="ml-2 text-xl font-bold text-gray-900">
                  {book.average_rating?.toFixed(1) || '0.0'}
                </span>
                <span className="ml-2 text-gray-500">
                  ({book.total_reviews} รีวิว)
                </span>
              </div>

              {/* Genres & Tags */}
              <div className="mb-4">
                {book.genres && book.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {book.genres.map((genre, index) => (
                      <Link
                        key={index}
                        to={`/search?genres=${encodeURIComponent(genre)}`}
                        className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-sm hover:bg-primary-100"
                      >
                        {genre}
                      </Link>
                    ))}
                  </div>
                )}
                {book.tags && book.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {book.tags.map((tag, index) => (
                      <Link
                        key={index}
                        to={`/search?tags=${encodeURIComponent(tag)}`}
                        className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm hover:bg-gray-200"
                      >
                        #{tag}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Book Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {book.publication_year && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-500">ปีที่พิมพ์</p>
                    <p className="font-semibold">{book.publication_year}</p>
                  </div>
                )}
                {book.total_volumes && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-500">จำนวนเล่ม</p>
                    <p className="font-semibold">{book.total_volumes}</p>
                  </div>
                )}
                {book.total_chapters && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-500">จำนวนตอน</p>
                    <p className="font-semibold">{book.total_chapters}</p>
                  </div>
                )}
              </div>

              {/* Description */}
              {(book.description_thai || book.description) && (
                <div className="prose max-w-none">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">เรื่องย่อ</h3>
                  <p className="text-gray-700 whitespace-pre-line">
                    {book.description_thai || book.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">รีวิวจากผู้อ่าน</h2>
            {isAuthenticated && (
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
              >
                เขียนรีวิว
              </button>
            )}
          </div>

          {/* Rating Distribution */}
          {reviewsData && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-3">การกระจายคะแนน</h3>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = reviewsData.ratingDistribution[rating] || 0;
                  const total = Object.values(reviewsData.ratingDistribution).reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? (count / total) * 100 : 0;
                  
                  return (
                    <div key={rating} className="flex items-center gap-2">
                      <span className="w-8 text-sm">{rating} ⭐</span>
                      <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-yellow-400"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="w-12 text-sm text-gray-500">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Review Form */}
          {showReviewForm && (
            <form onSubmit={handleSubmitReview} className="mb-6 p-4 border rounded-lg">
              <h3 className="font-semibold mb-4">เขียนรีวิวของคุณ</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ให้คะแนน
                </label>
                <RatingStars 
                  rating={newRating} 
                  size="lg" 
                  editable 
                  onChange={setNewRating}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  รีวิว (ไม่บังคับ)
                </label>
                <textarea
                  value={newReviewContent}
                  onChange={(e) => setNewReviewContent(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="แบ่งปันความคิดเห็นของคุณ..."
                />
              </div>

              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isSpoiler}
                    onChange={(e) => setIsSpoiler(e.target.checked)}
                    className="h-4 w-4 text-primary-600 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    รีวิวนี้มีเนื้อหาสปอยล์
                  </span>
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50"
                >
                  {reviewSubmitting ? 'กำลังส่ง...' : 'ส่งรีวิว'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          )}

          {/* Reviews List */}
          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border-b pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                        {review.avatar_url ? (
                          <img 
                            src={review.avatar_url} 
                            alt={review.display_name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-primary-600 font-medium">
                            {review.display_name?.[0]?.toUpperCase() || 'U'}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{review.display_name || review.username}</p>
                        <div className="flex items-center gap-2">
                          <RatingStars rating={review.rating} size="sm" />
                          <span className="text-sm text-gray-500">
                            {new Date(review.created_at).toLocaleDateString('th-TH')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {review.is_spoiler && (
                      <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded">
                        สปอยล์
                      </span>
                    )}
                  </div>
                  
                  {review.content && (
                    <p className="mt-3 text-gray-700 whitespace-pre-line">
                      {review.content}
                    </p>
                  )}

                  {review.helpful_count > 0 && (
                    <p className="mt-2 text-sm text-gray-500">
                      👍 {review.helpful_count} คนเห็นว่ามีประโยชน์
                    </p>
                  )}
                </div>
              ))}

              {reviewsData && reviewsData.pagination.totalPages > 1 && (
                <Link 
                  to={`/book/${id}/reviews`}
                  className="block text-center text-primary-600 hover:text-primary-700 py-4"
                >
                  ดูรีวิวทั้งหมด ({reviewsData.pagination.total})
                </Link>
              )}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">
              ยังไม่มีรีวิว เป็นคนแรกที่รีวิวหนังสือเล่มนี้!
            </p>
          )}
        </div>

        {/* Similar Books Section */}
        {similarBooks.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">หนังสือที่คล้ายกัน</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {similarBooks.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookDetailPage;
