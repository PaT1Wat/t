import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SearchBar from './SearchBar';

const Navbar = () => {
  const { user, profile, logout, isAdmin } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="bg-primary-600 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <span className="text-xl font-bold">MangaRec</span>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:block flex-1 max-w-xl mx-8">
            <SearchBar />
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/" className="hover:text-primary-200 transition-colors">
              หน้าแรก
            </Link>
            <Link to="/search" className="hover:text-primary-200 transition-colors">
              ค้นหา
            </Link>
            
            {user ? (
              <>
                <Link to="/favorites" className="hover:text-primary-200 transition-colors">
                  รายการโปรด
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="hover:text-primary-200 transition-colors">
                    จัดการ
                  </Link>
                )}
                <div className="relative group">
                  <button className="flex items-center space-x-2 hover:text-primary-200">
                    <img 
                      src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.display_name || 'User'}`}
                      alt="Profile"
                      className="w-8 h-8 rounded-full border-2 border-white"
                    />
                    <span>{profile?.display_name || user.email}</span>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 hidden group-hover:block">
                    <Link to="/profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                      โปรไฟล์
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      ออกจากระบบ
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-primary-200 transition-colors">
                  เข้าสู่ระบบ
                </Link>
                <Link 
                  to="/register" 
                  className="bg-white text-primary-600 px-4 py-2 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  สมัครสมาชิก
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden pb-4">
            <div className="mb-4">
              <SearchBar />
            </div>
            <div className="space-y-2">
              <Link to="/" className="block py-2 hover:text-primary-200">หน้าแรก</Link>
              <Link to="/search" className="block py-2 hover:text-primary-200">ค้นหา</Link>
              {user ? (
                <>
                  <Link to="/favorites" className="block py-2 hover:text-primary-200">รายการโปรด</Link>
                  <Link to="/profile" className="block py-2 hover:text-primary-200">โปรไฟล์</Link>
                  <button onClick={handleLogout} className="block py-2 hover:text-primary-200">
                    ออกจากระบบ
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="block py-2 hover:text-primary-200">เข้าสู่ระบบ</Link>
                  <Link to="/register" className="block py-2 hover:text-primary-200">สมัครสมาชิก</Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
