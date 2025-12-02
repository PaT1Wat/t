import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchApi } from '../services/api';
import BookCard from '../components/BookCard';
import SearchBar from '../components/SearchBar';
import LoadingSpinner from '../components/LoadingSpinner';
import type { Book, SearchFilters, Pagination, FiltersResponse } from '../types';

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [books, setBooks] = useState<Book[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [availableFilters, setAvailableFilters] = useState<FiltersResponse['filters'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Get current filters from URL
  const currentFilters: SearchFilters = {
    type: searchParams.get('type') || undefined,
    genres: searchParams.getAll('genres'),
    tags: searchParams.getAll('tags'),
    status: searchParams.get('status') || undefined,
    minRating: searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : undefined,
    fromYear: searchParams.get('fromYear') ? parseInt(searchParams.get('fromYear')!) : undefined,
    toYear: searchParams.get('toYear') ? parseInt(searchParams.get('toYear')!) : undefined,
    sortBy: searchParams.get('sortBy') || undefined,
    includeNsfw: searchParams.get('includeNsfw') === 'true',
  };

  const query = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1');

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const data = await searchApi.getFilters();
        setAvailableFilters(data.filters);
      } catch (error) {
        console.error('Error fetching filters:', error);
      }
    };
    fetchFilters();
  }, []);

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      try {
        const data = await searchApi.search(query, currentFilters, page);
        setBooks(data.books);
        setPagination(data.pagination);
      } catch (error) {
        console.error('Error searching books:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    const params = new URLSearchParams(searchParams);
    
    Object.entries(newFilters).forEach(([key, value]) => {
      params.delete(key);
      if (value !== undefined && value !== '' && value !== false) {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else {
          params.set(key, String(value));
        }
      }
    });
    
    params.set('page', '1'); // Reset to first page
    setSearchParams(params);
  };

  const handleSearch = (newQuery: string) => {
    const params = new URLSearchParams(searchParams);
    if (newQuery) {
      params.set('q', newQuery);
    } else {
      params.delete('q');
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(newPage));
    setSearchParams(params);
    window.scrollTo(0, 0);
  };

  const clearFilters = () => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    setSearchParams(params);
  };

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

  const sortOptions = [
    { value: '', label: 'ตรงกับคำค้นหา' },
    { value: 'rating', label: 'คะแนนสูงสุด' },
    { value: 'reviews', label: 'รีวิวมากที่สุด' },
    { value: 'newest', label: 'ใหม่ล่าสุด' },
    { value: 'oldest', label: 'เก่าที่สุด' },
    { value: 'title', label: 'ตามตัวอักษร' },
  ];

  const hasActiveFilters = currentFilters.type || 
    (currentFilters.genres && currentFilters.genres.length > 0) ||
    (currentFilters.tags && currentFilters.tags.length > 0) ||
    currentFilters.status ||
    currentFilters.minRating ||
    currentFilters.fromYear ||
    currentFilters.toYear;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <SearchBar 
            initialQuery={query} 
            onSearch={handleSearch} 
            size="lg"
            autoFocus
          />
          
          {/* Filter Toggle & Sort */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                  showFilters ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-700'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                ตัวกรอง
                {hasActiveFilters && (
                  <span className="bg-primary-600 text-white text-xs px-2 py-0.5 rounded-full">
                    ใช้งาน
                  </span>
                )}
              </button>
              
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  ล้างตัวกรอง
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">เรียงตาม:</label>
              <select
                value={currentFilters.sortBy || ''}
                onChange={(e) => updateFilters({ sortBy: e.target.value || undefined })}
                className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="lg:w-64 flex-shrink-0">
              <div className="bg-white rounded-lg shadow p-4 sticky top-20">
                <h3 className="font-semibold text-gray-900 mb-4">ตัวกรอง</h3>
                
                {/* Type Filter */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">ประเภท</h4>
                  <div className="space-y-2">
                    {availableFilters?.types.map((type) => (
                      <label key={type} className="flex items-center">
                        <input
                          type="radio"
                          name="type"
                          checked={currentFilters.type === type}
                          onChange={() => updateFilters({ type: currentFilters.type === type ? undefined : type })}
                          className="h-4 w-4 text-primary-600"
                        />
                        <span className="ml-2 text-sm">{typeLabels[type] || type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Status Filter */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">สถานะ</h4>
                  <div className="space-y-2">
                    {availableFilters?.statuses.map((status) => (
                      <label key={status} className="flex items-center">
                        <input
                          type="radio"
                          name="status"
                          checked={currentFilters.status === status}
                          onChange={() => updateFilters({ status: currentFilters.status === status ? undefined : status })}
                          className="h-4 w-4 text-primary-600"
                        />
                        <span className="ml-2 text-sm">{statusLabels[status] || status}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Genres Filter */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">หมวดหมู่</h4>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {availableFilters?.genres.slice(0, 15).map((genre) => (
                      <label key={genre} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={currentFilters.genres?.includes(genre)}
                          onChange={(e) => {
                            const newGenres = e.target.checked
                              ? [...(currentFilters.genres || []), genre]
                              : currentFilters.genres?.filter(g => g !== genre);
                            updateFilters({ genres: newGenres });
                          }}
                          className="h-4 w-4 text-primary-600 rounded"
                        />
                        <span className="ml-2 text-sm">{genre}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Rating Filter */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">คะแนนขั้นต่ำ</h4>
                  <select
                    value={currentFilters.minRating || ''}
                    onChange={(e) => updateFilters({ minRating: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">ทั้งหมด</option>
                    <option value="4">4+ ดาว</option>
                    <option value="3">3+ ดาว</option>
                    <option value="2">2+ ดาว</option>
                  </select>
                </div>

                {/* NSFW Toggle */}
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={currentFilters.includeNsfw}
                      onChange={(e) => updateFilters({ includeNsfw: e.target.checked })}
                      className="h-4 w-4 text-primary-600 rounded"
                    />
                    <span className="ml-2 text-sm">รวมเนื้อหา 18+</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          <div className="flex-1">
            {/* Results Count */}
            <div className="mb-4">
              {pagination && (
                <p className="text-gray-600">
                  พบ <span className="font-semibold">{pagination.total}</span> รายการ
                  {query && <span> สำหรับ "{query}"</span>}
                </p>
              )}
            </div>

            {/* Active Filters Tags */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mb-4">
                {currentFilters.type && (
                  <span className="inline-flex items-center bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm">
                    {typeLabels[currentFilters.type]}
                    <button
                      onClick={() => updateFilters({ type: undefined })}
                      className="ml-1 hover:text-primary-900"
                    >×</button>
                  </span>
                )}
                {currentFilters.status && (
                  <span className="inline-flex items-center bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm">
                    {statusLabels[currentFilters.status]}
                    <button
                      onClick={() => updateFilters({ status: undefined })}
                      className="ml-1 hover:text-primary-900"
                    >×</button>
                  </span>
                )}
                {currentFilters.genres?.map((genre) => (
                  <span key={genre} className="inline-flex items-center bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                    {genre}
                    <button
                      onClick={() => updateFilters({ genres: currentFilters.genres?.filter(g => g !== genre) })}
                      className="ml-1 hover:text-blue-900"
                    >×</button>
                  </span>
                ))}
              </div>
            )}

            {loading ? (
              <LoadingSpinner message="กำลังค้นหา..." />
            ) : books.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {books.map((book) => (
                    <BookCard key={book.id} book={book} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="mt-8 flex justify-center">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page === 1}
                        className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                      >
                        ก่อนหน้า
                      </button>
                      
                      {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                        let pageNum: number;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-4 py-2 rounded-md ${
                              page === pageNum
                                ? 'bg-primary-600 text-white'
                                : 'border hover:bg-gray-100'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page === pagination.totalPages}
                        className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                      >
                        ถัดไป
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <span className="text-6xl">🔍</span>
                <h3 className="mt-4 text-xl font-semibold text-gray-900">
                  ไม่พบผลลัพธ์
                </h3>
                <p className="mt-2 text-gray-600">
                  ลองค้นหาด้วยคำอื่น หรือปรับตัวกรอง
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
