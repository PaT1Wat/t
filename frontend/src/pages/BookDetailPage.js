import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { booksApi, reviewsApi, favoritesApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import BookCard from '../components/BookCard';
import RatingStars from '../components/RatingStars';
import LoadingSpinner from '../components/LoadingSpinner';

const BookDetailPage = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [ratingDistribution, setRatingDistribution] = useState({});
  const [similarBooks, setSimilarBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [reviewSpoiler, setReviewSpoiler] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchBookDetails = async () => {
    setLoading(true);
    try {
      // Fetch book details
      const bookResponse = await booksApi.getById(id);
      setBook(bookResponse.data);

      // Fetch reviews
      const reviewsResponse = await reviewsApi.getBookReviews(id);
      setReviews(reviewsResponse.data.results);
      setRatingDistribution(reviewsResponse.data.rating_distribution || {});

      // Fetch similar books
      const similarResponse = await booksApi.getSimilar(id, 6);
      setSimilarBooks(similarResponse.data);

      // Check favorite status
      if (isAuthenticated) {
        try {
          const favResponse = await favoritesApi.check(id);
          setIsFavorite(favResponse.data.is_favorite);
          } catch (error) {
            console.error('Error checking favorite status:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching book details:', error);
      }
      setLoading(false);
    };
    fetchBookDetails();
  }, [id, isAuthenticated]);

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      alert('กรุณาเข้าสู่ระบบเพื่อเพิ่มรายการโปรด');
      return;
    }

    try {
      if (isFavorite) {
        await favoritesApi.remove(id);
        setIsFavorite(false);
      } else {
        await favoritesApi.add(id);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('กรุณาเข้าสู่ระบบเพื่อเขียนรีวิว');
      return;
    }

    setSubmitting(true);
    try {
      await reviewsApi.create({
        book_id: id,
        rating: reviewRating,
        content: reviewContent,
        is_spoiler: reviewSpoiler,
      });

      // Refresh reviews
      const reviewsResponse = await reviewsApi.getBookReviews(id);
      setReviews(reviewsResponse.data.results);
      setRatingDistribution(reviewsResponse.data.rating_distribution || {});

      // Reset form
      setShowReviewForm(false);
      setReviewRating(5);
      setReviewContent('');
      setReviewSpoiler(false);

      // Refresh book for updated rating
      const bookResponse = await booksApi.getById(id);
      setBook(bookResponse.data);
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกรีวิว');
    }
    setSubmitting(false);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!book) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">ไม่พบหนังสือ</h2>
        <Link to="/" className="text-primary-600 hover:text-primary-700 mt-4 inline-block">
          กลับหน้าแรก
        </Link>
      </div>
    );
  }

  const getTypeLabel = (type) => {
    const types = { manga: 'มังงะ', novel: 'นิยาย', light_novel: 'ไลท์โนเวล', webtoon: 'เว็บตูน' };
    return types[type] || type;
  };

  const getStatusLabel = (status) => {
    const statuses = { ongoing: 'กำลังตีพิมพ์', completed: 'จบแล้ว', hiatus: 'พักการตีพิมพ์', cancelled: 'ยกเลิก' };
    return statuses[status] || status;
  };

  return (
    <div>
      {/* Book Details */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="md:flex">
          {/* Cover Image */}
          <div className="md:w-1/3 lg:w-1/4">
            <div className="aspect-[2/3] bg-gray-200">
              {book.cover_image_url ? (
                <img
                  src={book.cover_image_url}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-400 to-primary-600">
                  <svg className="w-24 h-24 text-white opacity-50" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Book Info */}
          <div className="p-6 md:w-2/3 lg:w-3/4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {book.title_thai || book.title}
                </h1>
                {book.title_thai && book.title !== book.title_thai && (
                  <p className="text-lg text-gray-600 mt-1">{book.title}</p>
                )}
              </div>
              <button
                onClick={handleToggleFavorite}
                className={`p-2 rounded-full ${isFavorite ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
              >
                <svg className="w-8 h-8" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>

            {/* Author & Publisher */}
            <div className="flex flex-wrap gap-4 text-gray-600 mb-4">
              {book.author_name && (
                <span>โดย: <strong>{book.author_name_thai || book.author_name}</strong></span>
              )}
              {book.publisher_name && (
                <span>สำนักพิมพ์: <strong>{book.publisher_name_thai || book.publisher_name}</strong></span>
              )}
            </div>

            {/* Rating */}
            <div className="flex items-center gap-4 mb-4">
              <RatingStars rating={book.average_rating || 0} readonly size="lg" />
              <span className="text-xl font-semibold">{(book.average_rating || 0).toFixed(1)}</span>
              <span className="text-gray-600">({book.total_reviews || 0} รีวิว)</span>
            </div>

            {/* Meta Info */}
            <div className="flex flex-wrap gap-2 mb-4">
              {book.type && (
                <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm">
                  {getTypeLabel(book.type)}
                </span>
              )}
              {book.status && (
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                  {getStatusLabel(book.status)}
                </span>
              )}
              {book.publication_year && (
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                  {book.publication_year}
                </span>
              )}
              {book.is_nsfw && (
                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">
                  18+
                </span>
              )}
            </div>

            {/* Genres & Tags */}
            {book.genres && book.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {book.genres.map((genre, index) => (
                  <Link
                    key={index}
                    to={`/search?genre=${encodeURIComponent(genre)}`}
                    className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm hover:bg-blue-200"
                  >
                    {genre}
                  </Link>
                ))}
              </div>
            )}

            {/* Description */}
            {(book.description_thai || book.description) && (
              <div className="mt-4">
                <h3 className="font-semibold text-gray-900 mb-2">เรื่องย่อ</h3>
                <p className="text-gray-700 whitespace-pre-line">
                  {book.description_thai || book.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">รีวิว</h2>
          {isAuthenticated && (
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
            >
              {showReviewForm ? 'ยกเลิก' : 'เขียนรีวิว'}
            </button>
          )}
        </div>

        {/* Rating Distribution */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900">{(book.average_rating || 0).toFixed(1)}</div>
              <RatingStars rating={book.average_rating || 0} readonly size="sm" />
              <div className="text-sm text-gray-600 mt-1">{book.total_reviews || 0} รีวิว</div>
            </div>
            <div className="flex-1">
              {[5, 4, 3, 2, 1].map((star) => (
                <div key={star} className="flex items-center gap-2 mb-1">
                  <span className="w-3 text-sm">{star}</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400"
                      style={{
                        width: `${book.total_reviews ? ((ratingDistribution[star] || 0) / book.total_reviews * 100) : 0}%`
                      }}
                    ></div>
                  </div>
                  <span className="w-8 text-sm text-gray-600">{ratingDistribution[star] || 0}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Review Form */}
        {showReviewForm && (
          <form onSubmit={handleSubmitReview} className="mb-6 p-4 border border-gray-200 rounded-lg">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">คะแนน</label>
              <RatingStars rating={reviewRating} onRatingChange={setReviewRating} size="lg" />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">รีวิว</label>
              <textarea
                value={reviewContent}
                onChange={(e) => setReviewContent(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="เขียนรีวิวของคุณ..."
              ></textarea>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={reviewSpoiler}
                  onChange={(e) => setReviewSpoiler(e.target.checked)}
                  className="rounded text-primary-600"
                />
                <span className="text-sm text-gray-700">มีสปอยล์</span>
              </label>
              <button
                type="submit"
                disabled={submitting}
                className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {submitting ? 'กำลังบันทึก...' : 'บันทึกรีวิว'}
              </button>
            </div>
          </form>
        )}

        {/* Reviews List */}
        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                <div className="flex items-center gap-3 mb-2">
                  <img
                    src={review.avatar_url || `https://ui-avatars.com/api/?name=${review.display_name || review.username}`}
                    alt={review.display_name || review.username}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{review.display_name || review.username}</div>
                    <div className="flex items-center gap-2">
                      <RatingStars rating={review.rating} readonly size="sm" />
                      <span className="text-sm text-gray-500">
                        {new Date(review.created_at).toLocaleDateString('th-TH')}
                      </span>
                    </div>
                  </div>
                </div>
                {review.is_spoiler && (
                  <div className="text-sm text-red-600 mb-2">⚠️ รีวิวนี้มีสปอยล์</div>
                )}
                {review.content && (
                  <p className="text-gray-700">{review.content}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-600 py-8">ยังไม่มีรีวิว</p>
        )}
      </div>

      {/* Similar Books */}
      {similarBooks.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">หนังสือที่คล้ายกัน</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {similarBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BookDetailPage;
