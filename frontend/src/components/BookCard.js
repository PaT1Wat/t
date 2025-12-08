import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';

const BookCard = ({ book }) => {
  // Generate unique ID for this component instance
  const uniqueId = useMemo(() => `half-${book.id}-${Math.random().toString(36).substr(2, 9)}`, [book.id]);

  const getRatingStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <defs>
              <linearGradient id={uniqueId}>
                <stop offset="50%" stopColor="currentColor" />
                <stop offset="50%" stopColor="#D1D5DB" />
              </linearGradient>
            </defs>
            <path fill={`url(#${uniqueId})`} d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      } else {
        stars.push(
          <svg key={i} className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      }
    }
    return stars;
  };

  const getTypeLabel = (type) => {
    const types = {
      manga: 'มังงะ',
      novel: 'นิยาย',
      light_novel: 'ไลท์โนเวล',
      webtoon: 'เว็บตูน',
    };
    return types[type] || type;
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      ongoing: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      hiatus: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    const statusLabels = {
      ongoing: 'กำลังตีพิมพ์',
      completed: 'จบแล้ว',
      hiatus: 'พักการตีพิมพ์',
      cancelled: 'ยกเลิก',
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  return (
    <Link to={`/book/${book.id}`} className="block">
      <div className="book-card bg-white rounded-lg shadow-md overflow-hidden">
        {/* Cover Image */}
        <div className="relative aspect-[2/3] bg-gray-200">
          {book.cover_image_url ? (
            <img
              src={book.cover_image_url}
              alt={book.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-400 to-primary-600">
              <svg className="w-16 h-16 text-white opacity-50" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          )}
          
          {/* Type Badge */}
          {book.type && (
            <div className="absolute top-2 left-2">
              <span className="bg-primary-600 text-white text-xs px-2 py-1 rounded">
                {getTypeLabel(book.type)}
              </span>
            </div>
          )}
          
          {/* NSFW Badge */}
          {book.is_nsfw && (
            <div className="absolute top-2 right-2">
              <span className="bg-red-600 text-white text-xs px-2 py-1 rounded">
                18+
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 line-clamp-2 min-h-[3rem]">
            {book.title_thai || book.title}
          </h3>
          
          {book.title_thai && book.title !== book.title_thai && (
            <p className="text-sm text-gray-500 line-clamp-1 mt-1">{book.title}</p>
          )}
          
          {book.author_name && (
            <p className="text-sm text-gray-600 mt-1">
              โดย {book.author_name_thai || book.author_name}
            </p>
          )}

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center">
              {getRatingStars(book.average_rating || 0)}
              <span className="text-sm text-gray-600 ml-1">
                ({(book.average_rating || 0).toFixed(1)})
              </span>
            </div>
            {book.status && getStatusBadge(book.status)}
          </div>

          {book.genres && book.genres.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {book.genres.slice(0, 3).map((genre, index) => (
                <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  {genre}
                </span>
              ))}
              {book.genres.length > 3 && (
                <span className="text-xs text-gray-500">+{book.genres.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default BookCard;
