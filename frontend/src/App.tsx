import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoadingSpinner from './components/LoadingSpinner';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SearchPage from './pages/SearchPage';
import BookDetailPage from './pages/BookDetailPage';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner size="lg" message="กำลังตรวจสอบสถานะ..." />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Admin Route Component
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner size="lg" message="กำลังตรวจสอบสิทธิ์..." />;
  }
  
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

// Main App Layout
const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/books" element={<SearchPage />} />
        <Route path="/book/:id" element={<BookDetailPage />} />
        
        {/* Protected Routes */}
        <Route path="/favorites" element={
          <ProtectedRoute>
            <div className="p-8 text-center">
              <h1 className="text-2xl font-bold">รายการโปรด</h1>
              <p className="text-gray-600 mt-2">หน้านี้กำลังพัฒนา</p>
            </div>
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <div className="p-8 text-center">
              <h1 className="text-2xl font-bold">โปรไฟล์</h1>
              <p className="text-gray-600 mt-2">หน้านี้กำลังพัฒนา</p>
            </div>
          </ProtectedRoute>
        } />
        <Route path="/my-reviews" element={
          <ProtectedRoute>
            <div className="p-8 text-center">
              <h1 className="text-2xl font-bold">รีวิวของฉัน</h1>
              <p className="text-gray-600 mt-2">หน้านี้กำลังพัฒนา</p>
            </div>
          </ProtectedRoute>
        } />
        
        {/* Admin Routes */}
        <Route path="/admin" element={
          <AdminRoute>
            <div className="p-8 text-center">
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-gray-600 mt-2">หน้านี้กำลังพัฒนา</p>
            </div>
          </AdminRoute>
        } />
        
        {/* 404 */}
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-gray-300">404</h1>
              <p className="text-xl text-gray-600 mt-4">ไม่พบหน้าที่คุณต้องการ</p>
              <a href="/" className="mt-4 inline-block text-primary-600 hover:text-primary-700">
                กลับหน้าแรก
              </a>
            </div>
          </div>
        } />
      </Routes>
      
      {/* Footer */}
      <footer className="bg-white border-t mt-auto py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-600">
            <p>© 2024 MangaRec - ระบบแนะนำมังงะและนิยาย</p>
            <p className="text-sm mt-2">พัฒนาด้วย ❤️ สำหรับนักอ่านทุกคน</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </Router>
  );
}

export default App;
