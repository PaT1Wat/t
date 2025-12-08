import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usersApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const ProfilePage = () => {
  const { profile, refreshProfile, logout, loading: authLoading, isAuthenticated } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [language, setLanguage] = useState(profile?.preferred_language || 'th');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) {
    navigate('/login');
    return null;
  }

  if (authLoading || !profile) {
    return <LoadingSpinner />;
  }

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      await usersApi.updateProfile({
        display_name: displayName,
        preferred_language: language,
      });
      await refreshProfile();
      setMessage('บันทึกข้อมูลเรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">โปรไฟล์</h1>

      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Profile Header */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b">
          <img
            src={profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.display_name || profile.username}&size=100`}
            alt="Profile"
            className="w-20 h-20 rounded-full"
          />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {profile.display_name || profile.username}
            </h2>
            <p className="text-gray-600">{profile.email}</p>
            <span className={`inline-block mt-1 text-xs px-2 py-1 rounded-full ${
              profile.role === 'admin' ? 'bg-red-100 text-red-700' :
              profile.role === 'moderator' ? 'bg-yellow-100 text-yellow-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {profile.role === 'admin' ? 'ผู้ดูแลระบบ' :
               profile.role === 'moderator' ? 'ผู้ตรวจสอบ' : 'ผู้ใช้ทั่วไป'}
            </span>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSave}>
          {message && (
            <div className={`p-3 rounded-lg mb-4 ${
              message.includes('ผิดพลาด') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
            }`}>
              {message}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อที่แสดง</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">ภาษาที่ต้องการ</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="th">ไทย</option>
              <option value="en">English</option>
            </select>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200"
            >
              ออกจากระบบ
            </button>
          </div>
        </form>

        {/* Account Info */}
        <div className="mt-8 pt-6 border-t">
          <h3 className="font-semibold text-gray-900 mb-4">ข้อมูลบัญชี</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>ชื่อผู้ใช้:</strong> {profile.username}</p>
            <p><strong>อีเมล:</strong> {profile.email}</p>
            <p><strong>สมาชิกตั้งแต่:</strong> {new Date(profile.created_at).toLocaleDateString('th-TH')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
