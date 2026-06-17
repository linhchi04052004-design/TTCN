import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { placeOrder } from '../../services/customerApi';

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { maBan } = useParams();
  const cartItems = location.state?.cartItems || [];
  
  const [orderType, setOrderType] = useState('Dùng tại quán'); // 'Dùng tại quán' or 'Mang về'
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fallback to table info from localStorage if URL parameter is not set
  const currentMaBan = maBan || localStorage.getItem('customer_maBan');

  const totalAmount = cartItems.reduce((sum, item) => sum + item.DonGia * item.quantity, 0);

  useEffect(() => {
    if (cartItems.length === 0 && !showSuccess) {
      navigate(currentMaBan ? `/order/${currentMaBan}/menu` : '/order/menu');
    }
  }, [cartItems, showSuccess, currentMaBan, navigate]);

  const handleSubmitOrder = async () => {
    if (!currentMaBan) {
      setError('Không xác định được bàn. Vui lòng quét mã lại.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      
      const orderData = {
        TenKhach: localStorage.getItem('customer_name') || 'Khách đặt món',
        SDT: localStorage.getItem('customer_phone') || '',
        MaBan: currentMaBan,
        items: cartItems.map(item => ({
          MaMonAn: item.MaMonAn,
          SoLuong: item.quantity,
          GhiChu: item.GhiChu || '',
        }))
      };

      const res = await placeOrder(orderData);
      
      if (res.success) {
        setShowSuccess(true);
      } else {
        setError(res.message || 'Có lỗi xảy ra khi đặt hàng.');
      }
    } catch (err) {
      setError(err.message || 'Lỗi kết nối. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToMenu = () => {
    if (currentMaBan) {
      navigate(`/order/${currentMaBan}/menu`);
    } else {
      navigate('/order/menu');
    }
  };

  if (cartItems.length === 0 && !showSuccess) {
    return null; // Handled by useEffect
  }

  return (
    <div className="flex flex-col h-full bg-[#fdfbf7] relative">
      {/* Header Banner */}
      <div className="bg-[#cc2027] text-white p-6 pt-8 rounded-b-[40px] shadow-lg relative z-10">
        <button onClick={() => navigate(-1)} className="absolute top-6 left-4 p-2 text-white/80 hover:text-white">
          <ArrowLeft size={24} />
        </button>
        <div className="mt-8 mb-4">
          <p className="text-[10px] uppercase tracking-widest text-white/60 mb-1">{currentMaBan ? `Bàn ${currentMaBan}` : 'Đơn hàng'}</p>
          <h1 className="text-2xl font-serif mb-2">Xác nhận đơn hàng</h1>
          <p className="text-white/70 text-xs">Kiểm tra lại món đã chọn trước khi gửi cho nhà bếp.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 -mt-4 pt-8">
        {/* Error message */}
        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-2xl mb-6 text-sm border border-red-100">
            {error}
          </div>
        )}

        {/* Item List */}
        <div className="space-y-4 mb-6">
          {cartItems.map((item, index) => (
            <div key={index} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 flex justify-between items-center">
              <div className="flex-1 mr-4">
                <h3 className="font-bold text-gray-800 text-base mb-1">{item.TenMonAn}</h3>
                {item.GhiChu && <p className="text-xs text-gray-500 mb-1">Ghi chú: {item.GhiChu}</p>}
                <p className="text-xs text-gray-500">Số lượng: {item.quantity}</p>
              </div>
              <div className="font-bold text-[#cc2027] text-base whitespace-nowrap">
                {(item.DonGia * item.quantity).toLocaleString('vi-VN')}đ
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="bg-[#cc2027] text-white p-4 rounded-2xl shadow-md flex justify-between items-center mb-8">
          <span className="text-white/80 text-sm">Tổng thanh toán</span>
          <span className="font-bold text-lg">{totalAmount.toLocaleString('vi-VN')}đ</span>
        </div>
      </div>

      {/* Bottom Action */}
      <div className="p-4 bg-white border-t border-gray-100 sticky bottom-0">
        <button 
          onClick={handleSubmitOrder}
          disabled={isSubmitting}
          className={`w-full text-white font-medium text-lg py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${isSubmitting ? 'bg-primary/70 cursor-not-allowed shadow-none' : 'bg-primary hover:bg-primaryDark shadow-primary/30 active:scale-[0.98]'}`}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Đang gửi đơn...
            </>
          ) : (
            'Xác nhận gửi đơn'
          )}
        </button>
      </div>

      {/* Success Popup Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]">
          <div className="bg-white rounded-3xl p-8 w-full max-w-[340px] text-center shadow-2xl animate-[slideUp_0.3s_ease-out]">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={32} className="text-primary" />
            </div>
            
            <h2 className="text-primary font-bold text-lg mb-4">Cơm thố Anh Nguyễn xin cảm ơn quý khách đã đặt hàng.</h2>
            <p className="text-gray-600 text-sm mb-8 leading-relaxed">
              Quý khách vui lòng đợi nhân viên phục vụ món ăn.
            </p>
            
            <button 
              onClick={handleBackToMenu}
              className="w-full bg-primary hover:bg-primaryDark text-white font-medium py-3.5 rounded-xl transition-colors active:scale-[0.98]"
            >
              Quay lại menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
