import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import BookDetailPage from './pages/BookDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import FavoritesPage from './pages/FavoritesPage';
import ProfilePage from './pages/ProfilePage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/book/:id" element={<BookDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </main>
        <footer className="bg-gray-800 text-white py-6 mt-auto">
          <div className="container mx-auto px-4 text-center">
            <p className="text-gray-400">© 2024 MangaRec - ระบบแนะนำมังงะและนิยาย</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
