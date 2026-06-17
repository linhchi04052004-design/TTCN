import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, RotateCcw, MoreVertical, X, AlertCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';

export default function SuspendedDishes() {
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Modals state
  const [showSingleRestoreModal, setShowSingleRestoreModal] = useState(false);
  const [singleDishToRestore, setSingleDishToRestore] = useState(null);
  const [showBulkRestoreModal, setShowBulkRestoreModal] = useState(false);

  useEffect(() => {
    fetchDishes();
  }, [search]);

  const fetchDishes = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);

      const res = await fetch(`http://localhost:8000/api/admin/dishes/suspended/list?${queryParams.toString()}`);
      const result = await res.json();
      if (result.success) {
        setDishes(result.data);
      }
    } catch (error) {
      console.error('Lỗi lấy danh sách món ngưng bán:', error);
      showMessage('error', 'Không thể tải danh sách.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(dishes.map(d => d.MaMonAn));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (e, maMon) => {
    if (e.target.checked) {
      setSelectedIds(prev => [...prev, maMon]);
    } else {
      setSelectedIds(prev => prev.filter(id => id !== maMon));
    }
  };

  // --- Khôi phục 1 món ---
  const triggerSingleRestore = (dish) => {
    setSingleDishToRestore(dish);
    setShowSingleRestoreModal(true);
  };

  const confirmSingleRestore = async () => {
    if (!singleDishToRestore) return;
    try {
      const res = await fetch(`http://localhost:8000/api/admin/dishes/${singleDishToRestore.MaMonAn}/restore`, {
        method: 'PUT',
        headers: { 'Accept': 'application/json' }
      });
      const result = await res.json();
      if (result.success) {
        showMessage('success', 'Đã khôi phục món ăn.');
        // Bỏ chọn nếu món đó đang được chọn
        setSelectedIds(prev => prev.filter(id => id !== singleDishToRestore.MaMonAn));
        fetchDishes();
      } else {
        showMessage('error', result.message || 'Lỗi khôi phục.');
      }
    } catch (error) {
      showMessage('error', 'Lỗi kết nối.');
    } finally {
      setShowSingleRestoreModal(false);
      setSingleDishToRestore(null);
    }
  };

  // --- Khôi phục nhiều món ---
  const triggerBulkRestore = () => {
    if (selectedIds.length === 0) return;
    setShowBulkRestoreModal(true);
  };

  const confirmBulkRestore = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/admin/dishes/bulk-restore`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json' 
        },
        body: JSON.stringify({ ids: selectedIds })
      });
      const result = await res.json();
      if (result.success) {
        showMessage('success', `Đã khôi phục ${selectedIds.length} món ăn.`);
        setSelectedIds([]);
        fetchDishes();
      } else {
        showMessage('error', result.message || 'Lỗi khôi phục.');
      }
    } catch (error) {
      showMessage('error', 'Lỗi kết nối.');
    } finally {
      setShowBulkRestoreModal(false);
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
          <div>
            <h1 className="text-2xl font-bold mb-1">Món ngưng bán</h1>
            <div className="text-sm text-gray-500 font-medium">Quản lý và khôi phục các món đã tạm ngừng kinh doanh.</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input 
              type="text" 
              placeholder="Tìm kiếm theo tên món, danh mục..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-red-500 transition-colors bg-gray-50 focus:bg-white"
            />
          </div>

          <div>
            <button 
              onClick={triggerBulkRestore}
              disabled={selectedIds.length === 0}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors text-sm shadow-sm border ${selectedIds.length > 0 ? 'bg-white text-red-600 border-red-200 hover:bg-red-50' : 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'}`}
            >
              <RotateCcw size={16} /> 
              Khôi phục chọn {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                <tr>
                  <th className="p-4 w-12 text-center">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                      checked={dishes.length > 0 && selectedIds.length === dishes.length}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="p-4 w-16 text-center uppercase text-xs tracking-wider">STT</th>
                  <th className="p-4 uppercase text-xs tracking-wider">Tên món</th>
                  <th className="p-4 uppercase text-xs tracking-wider text-center">Danh mục</th>
                  <th className="p-4 uppercase text-xs tracking-wider text-right pr-8">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">Đang tải dữ liệu...</td>
                  </tr>
                ) : dishes.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">Không có món nào đang ngưng bán.</td>
                  </tr>
                ) : (
                  dishes.map((dish, index) => (
                    <tr key={dish.MaMonAn} className="hover:bg-gray-50 transition-colors group">
                      <td className="p-4 text-center">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                          checked={selectedIds.includes(dish.MaMonAn)}
                          onChange={(e) => handleSelectOne(e, dish.MaMonAn)}
                        />
                      </td>
                      <td className="p-4 text-center text-gray-500">{index + 1}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                            {dish.HinhAnh ? (
                              <img src={`http://localhost:8000${dish.HinhAnh}`} alt={dish.TenMonAn} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">N/A</div>
                            )}
                          </div>
                          <span className="font-bold text-gray-800">{dish.TenMonAn}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                          {dish.TenDanhMuc || dish.MaDanhMuc}
                        </span>
                      </td>
                      <td className="p-4 text-right pr-6">
                        <div className="flex items-center justify-end gap-3">
                          <button 
                            onClick={() => triggerSingleRestore(dish)}
                            className="flex items-center gap-1.5 text-red-600 font-medium text-sm hover:underline"
                          >
                            <RotateCcw size={14} /> Khôi phục
                          </button>
                          <button className="text-gray-400 hover:text-gray-600">
                            <MoreVertical size={16} />
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
            Hiển thị <span className="font-medium text-gray-800">{dishes.length}</span> món
          </div>
        </div>

      </div>

      {/* Modal Khôi phục 1 món */}
      {showSingleRestoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setShowSingleRestoreModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
            <div className="p-8 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center mb-4">
                <AlertCircle size={32} />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Khôi phục món</h2>
              <p className="text-gray-500 mb-6">Bạn có chắc chắn muốn khôi phục món này không?</p>
              
              {singleDishToRestore && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl mb-8 w-full max-w-xs justify-center text-left">
                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-gray-200">
                    {singleDishToRestore.HinhAnh ? (
                      <img src={`http://localhost:8000${singleDishToRestore.HinhAnh}`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-200" />
                    )}
                  </div>
                  <span className="font-bold text-gray-800 text-sm">{singleDishToRestore.TenMonAn}</span>
                </div>
              )}

              <div className="flex items-center gap-3 w-full">
                <button 
                  onClick={() => setShowSingleRestoreModal(false)}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  onClick={confirmSingleRestore}
                  className="flex-1 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors"
                >
                  Khôi phục
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Khôi phục nhiều món */}
      {showBulkRestoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setShowBulkRestoreModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
            <div className="p-8 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center mb-4">
                <AlertCircle size={32} />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Khôi phục các món đã chọn</h2>
              <p className="text-gray-500 mb-8">
                Bạn có chắc chắn muốn khôi phục <span className="font-bold text-red-600">{selectedIds.length}</span> món đã chọn?
              </p>

              <div className="flex items-center gap-3 w-full">
                <button 
                  onClick={() => setShowBulkRestoreModal(false)}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  onClick={confirmBulkRestore}
                  className="flex-1 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors"
                >
                  Khôi phục
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
