import React from 'react';
import { Link } from 'react-router-dom';
import type { Book } from '../types';

interface BookCardProps {
  book: Book;
  showRating?: boolean;
  showType?: boolean;
}

const BookCard: React.FC<BookCardProps> = ({ book, showRating = true, showType = true }) => {
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

  const statusColors: { [key: string]: string } = {
    ongoing: 'bg-green-100 text-green-800',
    completed: 'bg-blue-100 text-blue-800',
    hiatus: 'bg-yellow-100 text-yellow-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <Link 
      to={`/book/${book.id}`}
      className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
    >
      {/* Cover Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-200">
        {book.cover_image_url ? (
          <img 
            src={book.cover_image_url} 
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-400 to-secondary-400">
            <span className="text-white text-4xl">📚</span>
          </div>
        )}
        
        {/* Type badge */}
        {showType && book.type && (
          <div className="absolute top-2 left-2">
            <span className="bg-primary-600 text-white text-xs px-2 py-1 rounded-full">
              {typeLabels[book.type] || book.type}
            </span>
          </div>
        )}

        {/* NSFW badge */}
        {book.is_nsfw && (
          <div className="absolute top-2 right-2">
            <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
              18+
            </span>
          </div>
        )}

        {/* Status badge */}
        {book.status && (
          <div className="absolute bottom-2 left-2">
            <span className={`text-xs px-2 py-1 rounded-full ${statusColors[book.status]}`}>
              {statusLabels[book.status]}
            </span>
          </div>
        )}
      </div>

      {/* Book Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors">
          {book.title_thai || book.title}
        </h3>
        
        {book.author_name && (
          <p className="text-sm text-gray-500 mt-1 truncate">
            {book.author_name_thai || book.author_name}
          </p>
        )}

        {/* Rating */}
        {showRating && (
          <div className="flex items-center mt-2">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`w-4 h-4 ${
                    star <= Math.round(book.average_rating)
                      ? 'text-yellow-400'
                      : 'text-gray-300'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="ml-2 text-sm text-gray-600">
              {book.average_rating?.toFixed(1) || '0.0'}
            </span>
            <span className="ml-1 text-xs text-gray-400">
              ({book.total_reviews || 0})
            </span>
          </div>
        )}

        {/* Genres */}
        {book.genres && book.genres.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {book.genres.slice(0, 3).map((genre, index) => (
              <span 
                key={index}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
              >
                {genre}
              </span>
            ))}
            {book.genres.length > 3 && (
              <span className="text-xs text-gray-400">
                +{book.genres.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};

export default BookCard;
