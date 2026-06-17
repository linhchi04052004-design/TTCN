import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Search, Plus, Minus, Trash2, ArrowLeft, CheckCircle, AlertCircle, Clock, Utensils } from 'lucide-react';
import Sidebar from '../components/Sidebar';

export default function CreateOrder() {
  const { maBan } = useParams();
  const navigate = useNavigate();
  
  const [categories, setCategories] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [cart, setCart] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catsRes, dishesRes] = await Promise.all([
        fetch('http://localhost:8000/api/admin/categories'),
        fetch('http://localhost:8000/api/admin/dishes?status=' + encodeURIComponent('Đang bán'))
      ]);

      const catsResult = await catsRes.json();
      const dishesResult = await dishesRes.json();

      if (catsResult.success) setCategories(catsResult.data);
      if (dishesResult.success) setDishes(dishesResult.data);
    } catch (error) {
      showMessage('error', 'Lỗi tải thực đơn. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const filteredDishes = useMemo(() => {
    return dishes.filter(dish => {
      const matchesCategory = selectedCategory === 'all' || dish.MaDanhMuc === selectedCategory;
      const matchesSearch = dish.TenMonAn.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [dishes, selectedCategory, searchQuery]);

  const addToCart = (dish) => {
    setCart(prev => {
      const existing = prev.find(item => item.dish.MaMonAn === dish.MaMonAn);
      if (existing) {
        return prev.map(item => 
          item.dish.MaMonAn === dish.MaMonAn 
            ? { ...item, qty: item.qty + 1 } 
            : item
        );
      }
      return [...prev, { dish, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.dish.MaMonAn === id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.dish.MaMonAn !== id));
  };

  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.qty * parseFloat(item.dish.DonGia)), 0);

  const handleSubmit = async (payNow = false) => {
    if (cart.length === 0) {
      showMessage('error', 'Giỏ hàng đang trống!');
      return;
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      showMessage('error', 'Vui lòng nhập đầy đủ tên và số điện thoại khách hàng.');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      TenKhach: customerName,
      SDT: customerPhone,
      MaBan: maBan || null,
      HinhThuc: maBan ? 'Tại bàn' : 'Mang về',
      items: cart.map(item => ({
        MaMonAn: item.dish.MaMonAn,
        SoLuong: item.qty
      }))
    };

    try {
      const res = await fetch('http://localhost:8000/api/admin/orders/full', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      
      if (result.success) {
        if (payNow) {
          // Redirect to Payment Page
          navigate(`/admin/payment/${result.data.MaDH}`);
        } else {
          // Cập nhật đơn thành công (cho đơn tại bàn)
          navigate('/admin/orders');
        }
      } else {
        showMessage('error', result.message || 'Lỗi khi tạo đơn.');
        setIsSubmitting(false);
      }
    } catch (error) {
      showMessage('error', 'Lỗi kết nối máy chủ.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F8F9FA] text-gray-800 font-sans overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex overflow-hidden relative">
        {message.text && (
          <div className={`fixed top-8 right-8 px-6 py-3 rounded-lg shadow-lg font-medium z-50 flex items-center gap-2 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message.type === 'success' ? <CheckCircle size={18}/> : <AlertCircle size={18}/>}
            {message.text}
          </div>
        )}

        {/* Main Content (Left) */}
        <div className="flex-1 overflow-y-auto p-8 border-r border-gray-200">
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => navigate('/admin/orders')} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold">
              {maBan ? `Tạo đơn cho ${maBan}` : 'Tạo đơn Mang về'}
            </h1>
            <div className="ml-auto flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-600 shadow-sm">
                <Clock size={16} className="text-gray-400" />
                <span>{format(new Date(), 'dd/MM/yyyy')}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6">
            <h2 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wider">Thông tin khách hàng</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Tên khách hàng</label>
                <input 
                  type="text" 
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Nhập tên khách..." 
                  className="w-full border rounded-lg px-3 py-2 outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Số điện thoại</label>
                <input 
                  type="text" 
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="Nhập số điện thoại..." 
                  className="w-full border rounded-lg px-3 py-2 outline-none focus:border-red-500"
                />
              </div>
            </div>
          </div>

          <div className="mb-4">
            <h2 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wider">Danh sách món</h2>
            <div className="flex gap-4 mb-4">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo tên món..." 
                  className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-2 outline-none focus:border-red-500 shadow-sm"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button 
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedCategory === 'all' ? 'bg-red-600 text-white shadow-md' : 'bg-white border hover:bg-gray-50 text-gray-600'}`}
              >
                Tất cả
              </button>
              {categories.map(cat => (
                <button 
                  key={cat.MaDanhMuc}
                  onClick={() => setSelectedCategory(cat.MaDanhMuc)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedCategory === cat.MaDanhMuc ? 'bg-red-600 text-white shadow-md' : 'bg-white border hover:bg-gray-50 text-gray-600'}`}
                >
                  {cat.TenDanhMuc}
                </button>
              ))}
            </div>

            {/* Dishes Grid */}
            {loading ? (
              <div className="text-gray-500 py-10 text-center">Đang tải món ăn...</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredDishes.map(dish => (
                  <div key={dish.MaMonAn} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                    <div className="h-32 bg-gray-100 w-full relative">
                      {dish.HinhAnh ? (
                        <img
                          src={`http://localhost:8000${dish.HinhAnh}`}
                          alt={dish.TenMonAn}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
                        />
                      ) : null}
                      <div className={`w-full h-full flex items-center justify-center text-gray-400 text-xs ${dish.HinhAnh ? 'hidden' : ''}`}>
                        No Image
                      </div>
                    </div>
                    <div className="p-3 flex-1 flex flex-col">
                      <div className="font-medium text-gray-800 text-sm mb-1 leading-tight line-clamp-2 flex-1">{dish.TenMonAn}</div>
                      <div className="flex justify-between items-center mt-2">
                        <div className="font-bold text-red-600 text-sm">{parseFloat(dish.DonGia).toLocaleString('vi-VN')}đ</div>
                        <button 
                          onClick={() => addToCart(dish)}
                          className="w-7 h-7 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center transition-colors"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Cart (Right) */}
        <div className="w-96 bg-white flex flex-col shadow-[-4px_0_15px_rgba(0,0,0,0.03)] z-10">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-bold tracking-wide">CHI TIẾT ĐƠN HÀNG</h2>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="text-sm text-gray-500 hover:text-red-600 transition-colors">
                Xóa tất cả
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Utensils size={48} className="text-gray-300" />
                </div>
                <div className="font-medium text-gray-500 mb-1">Chưa có món nào</div>
                <div className="text-sm">Chọn món ở bên trái để thêm</div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {cart.map(item => (
                  <div key={item.dish.MaMonAn} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-800 mb-1 leading-tight">{item.dish.TenMonAn}</div>
                      <div className="font-bold text-red-600 text-sm">{(item.qty * parseFloat(item.dish.DonGia)).toLocaleString('vi-VN')}đ</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                        <button onClick={() => updateQty(item.dish.MaMonAn, -1)} className="px-2 py-1 hover:bg-gray-200 transition-colors"><Minus size={14} className="text-gray-600"/></button>
                        <div className="w-6 text-center text-sm font-medium">{item.qty}</div>
                        <button onClick={() => updateQty(item.dish.MaMonAn, 1)} className="px-2 py-1 hover:bg-gray-200 transition-colors"><Plus size={14} className="text-gray-600"/></button>
                      </div>
                      <button onClick={() => removeFromCart(item.dish.MaMonAn)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Checkout Footer */}
          <div className="p-6 border-t border-gray-100 bg-white">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm text-gray-500">Tạm tính ({totalItems} món)</div>
              <div className="text-sm font-medium">{totalPrice.toLocaleString('vi-VN')}đ</div>
            </div>
            <div className="flex justify-between items-center mb-6">
              <div className="text-lg font-bold">Tổng tạm tính</div>
              <div className="text-xl font-bold text-red-600">{totalPrice.toLocaleString('vi-VN')}đ</div>
            </div>
            
            <div className="flex flex-col gap-3">
              {!maBan ? (
                // Layout cho đơn mang về (Takeaway)
                <button 
                  onClick={() => handleSubmit(true)}
                  disabled={isSubmitting || cart.length === 0}
                  className="w-full bg-[#e50027] hover:bg-red-700 disabled:bg-red-300 text-white font-bold py-3 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'Đang xử lý...' : 'Tạo & Thanh toán'}
                </button>
              ) : (
                // Layout cho đơn tại bàn
                <>
                  <button 
                    onClick={() => handleSubmit(false)}
                    disabled={isSubmitting || cart.length === 0}
                    className="w-full bg-[#e50027] hover:bg-red-700 disabled:bg-red-300 text-white font-bold py-3 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? 'Đang xử lý...' : 'Cập nhật & xác nhận'}
                  </button>
                  <button 
                    onClick={() => handleSubmit(true)}
                    disabled={isSubmitting || cart.length === 0}
                    className="w-full bg-white border-2 border-red-600 hover:bg-red-50 disabled:border-red-300 disabled:text-red-300 text-red-600 font-bold py-3 rounded-xl transition-colors shadow-sm"
                  >
                    Thanh toán ngay
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
