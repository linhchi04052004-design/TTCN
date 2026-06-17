import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { buildApiUrl } from '../config';

export default function CategoryForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    TenDanhMuc: '',
    TrangThai: 'Đang bán'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditMode) {
      fetchCategory();
    }
  }, [id]);

  const fetchCategory = async () => {
    try {
      const res = await fetch(buildApiUrl(`/admin/categories/${id}`));
      const result = await res.json();
      if (result.success) {
        setFormData({
          TenDanhMuc: result.data.TenDanhMuc,
          TrangThai: result.data.TrangThai
        });
      } else {
        setError('Không thể tải dữ liệu danh mục.');
      }
    } catch (error) {
      console.error('Lỗi lấy danh mục:', error);
      setError('Lỗi kết nối máy chủ.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Xóa lỗi khi user bắt đầu gõ
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.TenDanhMuc.trim()) {
      setError('Tên danh mục không được để trống.');
      return;
    }

    setLoading(true);
    try {
      const url = isEditMode 
        ? buildApiUrl(`/admin/categories/${id}`)
        : buildApiUrl('/admin/categories');
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      const result = await res.json();
      
      if (result.success) {
        navigate('/admin/categories');
      } else {
        setError(result.message || 'Lỗi khi lưu danh mục.');
      }
    } catch (error) {
      console.error('Lỗi lưu danh mục:', error);
      setError('Lỗi kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-stone-100 text-gray-800 font-sans overflow-hidden">
      <Sidebar />

      <div className="flex-1 overflow-y-auto p-8 relative">
        <div className="max-w-4xl mx-auto">
          
          <div className="flex items-center gap-4 mb-8">
            <Link 
              to="/admin/categories"
              className="flex items-center gap-1 text-gray-500 hover:text-gray-800 transition-colors text-sm font-medium"
            >
              <ChevronLeft size={18} /> Quay lại
            </Link>
            <h1 className="text-2xl font-bold border-l-2 border-gray-300 pl-4">
              {isEditMode ? 'Sửa danh mục món' : 'Thêm danh mục món'}
            </h1>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
            <form onSubmit={handleSubmit}>
              
              <div className="mb-8">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Tên danh mục <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  name="TenDanhMuc"
                  value={formData.TenDanhMuc}
                  onChange={handleInputChange}
                  placeholder="Nhập tên danh mục"
                  className={`w-full border rounded-lg px-4 py-3 text-sm outline-none transition-colors ${error && error.includes('Tên') ? 'border-red-500 focus:border-red-500 bg-red-50' : 'border-gray-200 focus:border-red-500 bg-gray-50 focus:bg-white'}`}
                />
                {error && error.includes('Tên') && (
                  <p className="text-red-500 text-xs mt-1.5 font-medium">{error}</p>
                )}
              </div>

              <div className="mb-10">
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Trạng thái <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input 
                        type="radio" 
                        name="TrangThai"
                        value="Đang bán"
                        checked={formData.TrangThai === 'Đang bán'}
                        onChange={handleInputChange}
                        className="peer appearance-none w-5 h-5 border-2 border-gray-300 rounded-full checked:border-red-600 transition-colors cursor-pointer"
                      />
                      <div className="absolute w-2.5 h-2.5 bg-red-600 rounded-full opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                    </div>
                    <span className="text-sm text-gray-700 group-hover:text-gray-900 font-medium">Đang bán</span>
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input 
                        type="radio" 
                        name="TrangThai"
                        value="Ngưng bán"
                        checked={formData.TrangThai === 'Ngưng bán'}
                        onChange={handleInputChange}
                        className="peer appearance-none w-5 h-5 border-2 border-gray-300 rounded-full checked:border-red-600 transition-colors cursor-pointer"
                      />
                      <div className="absolute w-2.5 h-2.5 bg-red-600 rounded-full opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                    </div>
                    <span className="text-sm text-gray-700 group-hover:text-gray-900 font-medium">Ngưng bán</span>
                  </label>
                </div>
              </div>

              {error && !error.includes('Tên') && (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => navigate('/admin/categories')}
                  className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? 'Đang xử lý...' : isEditMode ? 'Cập nhật' : 'Lưu danh mục'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
