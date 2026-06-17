import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Plus, Loader2 } from 'lucide-react';
import { fetchCategories, fetchDishes } from '../../services/customerApi';
import DishDetail from '../../components/customer/DishDetail';
import Cart from '../../components/customer/Cart';
import { buildStorageUrl } from '../../config';

const ACTIVE_ORDER_ID_KEY = 'active_order_id';
const ACTIVE_ORDER_DETAILS_KEY = 'active_order_details';

const readActiveOrderDetails = () => {
  try {
    return JSON.parse(localStorage.getItem(ACTIVE_ORDER_DETAILS_KEY) || 'null');
  } catch {
    return null;
  }
};

const Menu = () => {
  const navigate = useNavigate();
  const { maBan } = useParams();

  const [categories, setCategories] = useState([]);
  const [allDishes, setAllDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedDish, setSelectedDish] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [activeOrder, setActiveOrder] = useState(() => {
    const orderId = localStorage.getItem(ACTIVE_ORDER_ID_KEY);
    const details = readActiveOrderDetails();
    return orderId ? { MaDH: orderId, ...details } : null;
  });

  const categoryScrollRef = useRef(null);

  // Lấy dữ liệu từ API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [catRes, dishRes] = await Promise.all([fetchCategories(), fetchDishes()]);
        if (catRes.success) setCategories(catRes.data);
        if (dishRes.success) setAllDishes(dishRes.data);
      } catch (err) {
        setError('Không tải được thực đơn. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const refreshActiveOrder = () => {
      const orderId = localStorage.getItem(ACTIVE_ORDER_ID_KEY);
      const details = readActiveOrderDetails();
      setActiveOrder(orderId ? { MaDH: orderId, ...details } : null);
    };

    window.addEventListener('focus', refreshActiveOrder);
    return () => window.removeEventListener('focus', refreshActiveOrder);
  }, []);

  // Lọc món theo danh mục
  const filteredDishes = activeCategory === 'all'
    ? allDishes
    : allDishes.filter(d => d.MaDanhMuc === activeCategory);

  // Xử lý ảnh (backend có thể trả về đường dẫn tương đối hoặc null)
  const getDishImage = (dish) => {
    if (!dish.HinhAnh) return 'https://images.unsplash.com/photo-1618449840665-9ed506d73a34?w=600&auto=format&fit=crop&q=80';
    if (dish.HinhAnh.startsWith('http')) return dish.HinhAnh;
    return buildStorageUrl(dish.HinhAnh);
  };

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleAddToCart = (item) => {
    // Kiểm tra nếu món đã có trong giỏ thì chỉ tăng số lượng
    setCartItems(prev => {
      const existing = prev.find(i => i.MaMonAn === item.MaMonAn && i.GhiChu === item.GhiChu);
      if (existing) {
        return prev.map(i =>
          i.MaMonAn === item.MaMonAn && i.GhiChu === item.GhiChu
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      return [...prev, item];
    });
    showToast(`Đã thêm ${item.TenMonAn} vào giỏ hàng`);
  };

  const handleUpdateQuantity = (index, newQuantity) => {
    if (newQuantity < 1) {
      handleRemoveItem(index);
      return;
    }
    setCartItems(prev => prev.map((item, i) => i === index ? { ...item, quantity: newQuantity } : item));
  };

  const handleRemoveItem = (index) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    if (maBan) {
      navigate(`/order/${maBan}/checkout`, { state: { cartItems } });
    } else {
      navigate('/order/checkout', { state: { cartItems } });
    }
  };

  // Số lượng sản phẩm khác nhau trong giỏ (đếm theo mã sản phẩm)
  const cartUniqueCount = cartItems.length;
  const cartTotal = cartItems.reduce((sum, item) => sum + item.DonGia * item.quantity, 0);

  // Danh mục "Món ăn kèm" để gợi ý
  const sideDishCategory = categories.find(c =>
    c.TenDanhMuc.toLowerCase().includes('kèm') ||
    c.TenDanhMuc.toLowerCase().includes('phu') ||
    c.TenDanhMuc.toLowerCase().includes('phụ')
  );
  const sideDishes = sideDishCategory
    ? allDishes.filter(d => d.MaDanhMuc === sideDishCategory.MaDanhMuc)
    : [];

  if (loading) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-3 text-gray-400 bg-[#fdfbf7]">
        <Loader2 size={36} className="animate-spin text-primary" />
        <p>Đang tải thực đơn...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-4 p-6 bg-[#fdfbf7]">
        <p className="text-red-500 text-center">{error}</p>
        <button onClick={() => window.location.reload()} className="bg-primary text-white px-6 py-2 rounded-full">Thử lại</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#fdfbf7] relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="text-primary p-2 -ml-2 rounded-full hover:bg-red-50 transition-colors">
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 className="font-bold text-base text-gray-800 leading-tight">Cơm Thố Anh Nguyễn</h1>
            <p className="text-xs text-gray-400 uppercase tracking-widest">{maBan ? `Bàn ${maBan}` : 'Thực đơn'}</p>
          </div>
        </div>
        <button
          onClick={() => setIsCartOpen(true)}
          className="relative w-11 h-11 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-700 transition-colors"
        >
          <ShoppingCart size={20} />
          {cartUniqueCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-md">
              {cartUniqueCount}
            </span>
          )}
        </button>
      </div>

      {activeOrder?.MaDH && (
        <button
          onClick={() => navigate(maBan ? `/order/${maBan}/checkout` : '/order/checkout')}
          className="mx-4 mt-4 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-left text-sm text-green-700 shadow-sm"
        >
          <span className="font-bold">Đơn {activeOrder.MaDH} đã xác nhận.</span>
          <span className="block text-xs text-green-600">Nhân viên đang chuẩn bị món cho quý khách.</span>
        </button>
      )}

      {/* Category Tabs */}
      <div className="bg-white border-b border-gray-100 sticky top-[57px] z-10">
        <div
          ref={categoryScrollRef}
          className="flex overflow-x-auto hide-scrollbar px-4 py-3 gap-2.5"
        >
          {/* Tab "Tất cả" */}
          <button
            onClick={() => setActiveCategory('all')}
            className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-medium transition-colors border ${
              activeCategory === 'all'
                ? 'bg-primary border-primary text-white shadow-sm'
                : 'bg-white border-gray-200 text-gray-600 hover:border-primary/40'
            }`}
          >
            Tất cả
          </button>
          {categories.map(cat => (
            <button
              key={cat.MaDanhMuc}
              onClick={() => setActiveCategory(cat.MaDanhMuc)}
              className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-medium transition-colors border ${
                activeCategory === cat.MaDanhMuc
                  ? 'bg-primary border-primary text-white shadow-sm'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-primary/40'
              }`}
            >
              {cat.TenDanhMuc}
            </button>
          ))}
        </div>
      </div>

      {/* Menu List */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 pb-28">
        {filteredDishes.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <p>Chưa có món nào trong danh mục này.</p>
          </div>
        ) : (
          filteredDishes.map(dish => (
            <div key={dish.MaMonAn} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-50">
              <div
                className="h-44 bg-gray-200 relative cursor-pointer overflow-hidden group"
                onClick={() => setSelectedDish(dish)}
              >
                <img
                  src={getDishImage(dish)}
                  alt={dish.TenMonAn}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-1">
                  <h3
                    className="font-bold text-gray-800 text-base flex-1 pr-2 cursor-pointer"
                    onClick={() => setSelectedDish(dish)}
                  >
                    {dish.TenMonAn}
                  </h3>
                  <span className="font-bold text-primary text-sm whitespace-nowrap">
                    {Number(dish.DonGia).toLocaleString('vi-VN')}đ
                  </span>
                </div>
                {dish.MoTa && (
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{dish.MoTa}</p>
                )}
                <button
                  onClick={() => setSelectedDish(dish)}
                  className="w-full bg-red-50 hover:bg-primary text-primary hover:text-white font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm border border-red-100 hover:border-primary"
                >
                  <Plus size={16} /> Thêm món
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating Cart Bar */}
      {cartUniqueCount > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-4 z-20">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-primary text-white font-semibold py-4 rounded-2xl shadow-xl shadow-primary/40 flex items-center justify-between px-5"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-bold text-sm">
                {cartUniqueCount}
              </div>
              <span>Xem giỏ hàng</span>
            </div>
            <span className="font-bold">{cartTotal.toLocaleString('vi-VN')}đ</span>
          </button>
        </div>
      )}

      {/* Dish Detail Modal */}
      {selectedDish && (
        <DishDetail
          dish={selectedDish}
          getImage={getDishImage}
          onClose={() => setSelectedDish(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* Cart Modal */}
      {isCartOpen && (
        <Cart
          items={cartItems}
          sideDishes={sideDishes}
          getImage={getDishImage}
          onClose={() => setIsCartOpen(false)}
          onUpdateQuantity={handleUpdateQuantity}
          onRemove={handleRemoveItem}
          onCheckout={handleCheckout}
          onAddSideDish={(dish) => {
            setIsCartOpen(false);
            setSelectedDish(dish);
          }}
        />
      )}

      {/* Toast */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-gray-900/90 text-white px-6 py-2.5 rounded-full text-sm shadow-xl whitespace-nowrap">
          {toastMessage}
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
};

export default Menu;
