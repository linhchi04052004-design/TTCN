import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, Edit2, Trash2, X, AlertCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';

export default function Dishes() {
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tất cả trạng thái');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [dishToDelete, setDishToDelete] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchDishes();
  }, [search, statusFilter, categoryFilter]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/admin/categories');
      const result = await res.json();
      if (result.success) {
        setCategories(result.data);
      }
    } catch (error) {
      console.error('Lỗi lấy danh mục:', error);
    }
  };

  const fetchDishes = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (statusFilter !== 'Tất cả trạng thái') queryParams.append('status', statusFilter);
      if (categoryFilter) queryParams.append('category', categoryFilter);

      const res = await fetch(`http://localhost:8000/api/admin/dishes?${queryParams.toString()}`);
      const result = await res.json();
      if (result.success) {
        setDishes(result.data);
      }
    } catch (error) {
      console.error('Lỗi lấy danh sách món ăn:', error);
      showMessage('error', 'Không thể tải danh sách món ăn.');
    } finally {
      setLoading(false);
    }
  };

  // Mở popup xác nhận xóa (ngưng bán)
  const triggerDelete = (dish) => {
    setDishToDelete(dish);
    setShowDeleteModal(true);
  };

  // Xác nhận xóa (ngưng bán)
  const confirmDelete = async () => {
    if (!dishToDelete) return;

    try {
      const res = await fetch(`http://localhost:8000/api/admin/dishes/${dishToDelete.MaMonAn}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' }
      });
      const result = await res.json();
      
      if (result.success) {
        showMessage('success', 'Đã chuyển món ăn sang Ngưng bán.');
        fetchDishes();
      } else {
        showMessage('error', result.message || 'Lỗi khi xóa món ăn.');
      }
    } catch (error) {
      console.error('Lỗi xóa món ăn:', error);
      showMessage('error', 'Lỗi kết nối máy chủ.');
    } finally {
      setShowDeleteModal(false);
      setDishToDelete(null);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  // Hàm format tiền tệ (vd: 50000 -> 50.000đ)
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
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
          <div>
            <h1 className="text-2xl font-bold mb-1">Danh sách món</h1>
            <div className="text-sm text-gray-500 font-medium">Thực đơn {'>'} Danh sách món</div>
          </div>
          <button 
            onClick={() => navigate('/admin/dishes/create')}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Plus size={18} /> Thêm món
          </button>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6 flex flex-col xl:flex-row gap-4 items-center justify-between">
          
          {/* Tags Lọc Danh mục bên trái */}
          <div className="flex items-center gap-2 overflow-x-auto w-full xl:w-auto pb-2 xl:pb-0 scrollbar-hide">
            <button
              onClick={() => setCategoryFilter('')}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${categoryFilter === '' ? 'bg-red-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Tất cả
            </button>
            {categories.map(cat => (
              <button
                key={cat.MaDanhMuc}
                onClick={() => setCategoryFilter(cat.MaDanhMuc)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${categoryFilter === cat.MaDanhMuc ? 'bg-red-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {cat.TenDanhMuc}
              </button>
            ))}
          </div>

          {/* Tìm kiếm và Lọc trạng thái bên phải */}
          <div className="flex items-center gap-4 w-full xl:w-auto ml-auto justify-end">
            <div className="relative w-full md:w-64 shrink-0">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input 
                type="text" 
                placeholder="Tìm theo tên món"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 w-full border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-red-500 transition-colors bg-gray-50 focus:bg-white"
              />
            </div>

            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-red-500 transition-colors bg-gray-50 min-w-[160px] shrink-0"
            >
              <option value="Tất cả trạng thái">Tất cả trạng thái</option>
              <option value="Đang bán">Đang bán</option>
              <option value="Ngưng bán">Ngưng bán</option>
            </select>
          </div>
        </div>

        {/* Grid Danh sách món */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Đang tải dữ liệu...</div>
        ) : dishes.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-100 shadow-sm">
            Không tìm thấy món ăn nào.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {dishes.map((dish) => {
              const isSuspended = dish.TrangThai === 'Ngưng bán';
              return (
                <div 
                  key={dish.MaMonAn} 
                  className={`bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all ${isSuspended ? 'opacity-50' : ''}`}
                >
                  {/* Hình ảnh */}
                  <div className={`relative aspect-square bg-gray-100 ${isSuspended ? 'grayscale' : ''}`}>
                    {dish.HinhAnh ? (
                      <img 
                        src={`http://localhost:8000${dish.HinhAnh}`} 
                        alt={dish.TenMonAn} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        Chưa có ảnh
                      </div>
                    )}
                    {/* Badge Trạng thái */}
                    <div className="absolute top-2 right-2">
                      {dish.TrangThai === 'Đang bán' ? (
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm">
                          Đang bán
                        </span>
                      ) : (
                        <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm">
                          Ngưng bán
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Thông tin */}
                  <div className="p-3 flex-1 flex flex-col">
                    <h3 className={`text-sm font-bold mb-0.5 line-clamp-1 ${isSuspended ? 'text-gray-400' : 'text-gray-800'}`} title={dish.TenMonAn}>
                      {dish.TenMonAn}
                    </h3>
                    <div className={`text-sm font-bold mb-1 ${isSuspended ? 'text-gray-400' : 'text-red-600'}`}>
                      {formatCurrency(dish.DonGia)}
                    </div>
                    <p className={`text-xs mb-2 line-clamp-2 flex-1 ${isSuspended ? 'text-gray-300' : 'text-gray-500'}`}>
                      {dish.MoTa || 'Chưa có mô tả'}
                    </p>
                    
                    {/* Nút hành động */}
                    <div className={`flex gap-2 pt-2 border-t border-gray-100 mt-auto ${isSuspended ? 'opacity-100' : ''}`} style={isSuspended ? {opacity: 1} : {}}>
                      <button 
                        onClick={() => navigate(`/admin/dishes/${dish.MaMonAn}/edit`)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        style={isSuspended ? {opacity: 1} : {}}
                      >
                        <Edit2 size={13} /> Sửa
                      </button>
                      <button 
                        onClick={() => triggerDelete(dish)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-red-600 border border-red-100 rounded-lg hover:bg-red-50 transition-colors"
                        style={isSuspended ? {opacity: 1} : {}}
                      >
                        <Trash2 size={13} /> Xóa
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Modal Xác nhận Xóa (Ngưng bán) */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative" style={{animation: 'modalFadeIn 0.2s ease-out'}}>
            <button 
              onClick={() => { setShowDeleteModal(false); setDishToDelete(null); }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
            <div className="p-8 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-red-100 text-red-500 flex items-center justify-center mb-4">
                <AlertCircle size={32} />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Xóa (ngưng bán) món</h2>
              <p className="text-gray-500 mb-6">Bạn có chắc chắn muốn chuyển món này sang ngưng bán?</p>
              
              {dishToDelete && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl mb-8 w-full max-w-xs justify-center text-left">
                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-gray-200">
                    {dishToDelete.HinhAnh ? (
                      <img src={`http://localhost:8000${dishToDelete.HinhAnh}`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-200" />
                    )}
                  </div>
                  <span className="font-bold text-gray-800 text-sm">{dishToDelete.TenMonAn}</span>
                </div>
              )}

              <div className="flex items-center gap-3 w-full">
                <button 
                  onClick={() => { setShowDeleteModal(false); setDishToDelete(null); }}
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

    </div>
  );
}
