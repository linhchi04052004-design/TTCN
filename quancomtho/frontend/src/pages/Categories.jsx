import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, Edit2, Trash2, X, AlertCircle, AlertTriangle } from 'lucide-react';
import Sidebar from '../components/Sidebar';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tất cả');
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');

  useEffect(() => {
    fetchCategories();
  }, [search, statusFilter]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (statusFilter !== 'Tất cả') queryParams.append('status', statusFilter);

      const res = await fetch(`http://localhost:8000/api/admin/categories?${queryParams.toString()}`);
      const result = await res.json();
      if (result.success) {
        setCategories(result.data);
      }
    } catch (error) {
      console.error('Lỗi lấy danh sách danh mục:', error);
      showMessage('error', 'Không thể tải danh sách danh mục.');
    } finally {
      setLoading(false);
    }
  };

  // Mở popup xác nhận xóa
  const triggerDelete = (cat) => {
    setCategoryToDelete(cat);
    setShowDeleteModal(true);
  };

  // Xác nhận xóa danh mục
  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    const maDM = categoryToDelete.MaDanhMuc;

    try {
      const res = await fetch(`http://localhost:8000/api/admin/categories/${maDM}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' }
      });
      const result = await res.json();
      
      if (res.status === 400) {
        // Có chứa món ăn → hiển thị popup cảnh báo
        setShowDeleteModal(false);
        setCategoryToDelete(null);
        setErrorModalMessage('Danh mục có chứa món ăn và không cho phép xóa.');
        setShowErrorModal(true);
      } else if (result.success) {
        showMessage('success', 'Đã xóa danh mục.');
        fetchCategories();
        setShowDeleteModal(false);
        setCategoryToDelete(null);
      } else {
        setShowDeleteModal(false);
        setCategoryToDelete(null);
        setErrorModalMessage(result.message || 'Không thể xóa danh mục này.');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Lỗi xóa danh mục:', error);
      setShowDeleteModal(false);
      setCategoryToDelete(null);
      showMessage('error', 'Lỗi kết nối máy chủ.');
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  return (
    <div className="flex h-screen bg-stone-100 text-gray-800 font-sans overflow-hidden">
      <Sidebar />

      <div className="flex-1 overflow-y-auto p-8 relative">
        
        {message.text && (
          <div className={`fixed top-8 right-8 px-6 py-3 rounded-lg shadow-lg font-medium z-50 transition-opacity ${message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
            {message.text}
          </div>
        )}

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Danh mục món</h1>
          <button 
            onClick={() => navigate('/admin/categories/create')}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus size={18} /> Thêm danh mục
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input 
              type="text" 
              placeholder="Tìm kiếm tên danh mục..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-red-500 transition-colors bg-gray-50 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <span className="text-sm font-medium text-gray-600 whitespace-nowrap">Trạng thái</span>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-red-500 transition-colors bg-gray-50 min-w-[160px]"
            >
              <option value="Tất cả">Tất cả</option>
              <option value="Đang bán">Đang bán</option>
              <option value="Ngưng bán">Ngưng bán</option>
            </select>
            <button 
              onClick={fetchCategories}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors text-sm"
            >
              Tìm kiếm
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                <tr>
                  <th className="p-4 uppercase text-xs tracking-wider">Mã danh mục</th>
                  <th className="p-4 uppercase text-xs tracking-wider">Tên danh mục</th>
                  <th className="p-4 uppercase text-xs tracking-wider text-center">Trạng thái</th>
                  <th className="p-4 uppercase text-xs tracking-wider text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-gray-500">Đang tải dữ liệu...</td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-gray-500">Không tìm thấy danh mục nào.</td>
                  </tr>
                ) : (
                  categories.map((cat) => (
                    <tr key={cat.MaDanhMuc} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-medium text-gray-800">{cat.MaDanhMuc}</td>
                      <td className="p-4 font-medium text-gray-800">{cat.TenDanhMuc}</td>
                      <td className="p-4 text-center">
                        {cat.TrangThai === 'Đang bán' ? (
                          <span className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-xs font-medium border border-green-100">Đang bán</span>
                        ) : (
                          <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-medium border border-gray-200">Ngưng bán</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-3">
                          <Link 
                            to={`/admin/categories/${cat.MaDanhMuc}/edit`}
                            className="text-gray-400 hover:text-blue-600 transition-colors"
                            title="Sửa"
                          >
                            <Edit2 size={18} />
                          </Link>
                          <button 
                            onClick={() => triggerDelete(cat)}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                            title="Xóa"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-gray-100 text-sm text-gray-500 bg-gray-50">
            Hiển thị <span className="font-medium text-gray-800">{categories.length}</span> danh mục
          </div>
        </div>

      </div>

      {/* Modal Xác nhận Xóa danh mục */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative" style={{animation: 'modalFadeIn 0.2s ease-out'}}>
            <button 
              onClick={() => { setShowDeleteModal(false); setCategoryToDelete(null); }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
            <div className="p-8 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-red-100 text-red-500 flex items-center justify-center mb-4">
                <AlertCircle size={32} />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Xóa danh mục</h2>
              <p className="text-gray-500 mb-6">Bạn có chắc chắn muốn xóa danh mục này?</p>
              
              {categoryToDelete && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl mb-8 w-full max-w-xs justify-center text-left">
                  <span className="font-bold text-gray-800 text-sm">{categoryToDelete.TenDanhMuc}</span>
                </div>
              )}

              <div className="flex items-center gap-3 w-full">
                <button 
                  onClick={() => { setShowDeleteModal(false); setCategoryToDelete(null); }}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cảnh báo Lỗi (danh mục có chứa món) */}
      {showErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative" style={{animation: 'modalFadeIn 0.2s ease-out'}}>
            <button 
              onClick={() => setShowErrorModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
            <div className="p-8 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-500 flex items-center justify-center mb-4">
                <AlertTriangle size={32} />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Không thể xóa</h2>
              <p className="text-gray-500 mb-8">{errorModalMessage}</p>

              <div className="flex items-center gap-3 w-full">
                <button 
                  onClick={() => setShowErrorModal(false)}
                  className="flex-1 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors"
                >
                  Đã hiểu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
