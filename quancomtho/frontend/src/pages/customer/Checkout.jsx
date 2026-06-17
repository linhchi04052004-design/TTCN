import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { placeOrder, getOrderStatus } from '../../services/customerApi';

const ACTIVE_ORDER_ID_KEY = 'active_order_id';
const ACTIVE_ORDER_DETAILS_KEY = 'active_order_details';

const readActiveOrderDetails = () => {
  try {
    return JSON.parse(localStorage.getItem(ACTIVE_ORDER_DETAILS_KEY) || 'null');
  } catch {
    return null;
  }
};

const getQuantity = (item) => item.SoLuong || item.quantity || 0;
const getPrice = (item) => Number(item.DonGia ?? item.DonGiaTaiThoiDiemBan ?? 0);

const normalizeOrderDetails = (order, fallback = null) => {
  const source = order || fallback || {};
  return {
    MaDH: source.MaDH || localStorage.getItem(ACTIVE_ORDER_ID_KEY) || '',
    MaBan: source.MaBan || fallback?.MaBan || localStorage.getItem('customer_maBan') || '',
    items: Array.isArray(source.items) ? source.items : [],
  };
};

const buildOrderSnapshot = (maDH, maBan, items) => ({
  MaDH: maDH || '',
  MaBan: maBan || '',
  items: items.map((item) => ({
    MaMonAn: item.MaMonAn,
    TenMonAn: item.TenMonAn || item.MaMonAn,
    SoLuong: getQuantity(item),
    DonGia: getPrice(item),
    GhiChu: item.GhiChu || '',
  })),
});

const OrderItems = ({ items = [] }) => (
  <div className="space-y-4 mb-6">
    {items.map((item, index) => (
      <div key={`${item.MaMonAn || item.TenMonAn || 'item'}-${index}`} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 flex justify-between items-center">
        <div className="flex-1 mr-4">
          <h3 className="font-bold text-gray-800 text-base mb-1">{item.TenMonAn || item.MaMonAn}</h3>
          {item.GhiChu && <p className="text-xs text-gray-500 mb-1">Ghi chú: {item.GhiChu}</p>}
          <p className="text-xs text-gray-500">Số lượng: {getQuantity(item)}</p>
        </div>
        <div className="font-bold text-[#cc2027] text-base whitespace-nowrap">
          {(getPrice(item) * getQuantity(item)).toLocaleString('vi-VN')}đ
        </div>
      </div>
    ))}
  </div>
);

const CompactOrderItems = ({ items = [] }) => {
  if (!items.length) return null;

  return (
    <div className="mb-6 max-h-44 overflow-y-auto rounded-2xl border border-gray-100 bg-gray-50 p-3 text-left">
      <div className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">Các món đã đặt</div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={`${item.MaMonAn || item.TenMonAn || 'item'}-${index}`} className="flex justify-between gap-3 text-sm">
            <div className="min-w-0">
              <div className="font-medium text-gray-800">{item.TenMonAn || item.MaMonAn}</div>
              {item.GhiChu && <div className="text-xs text-gray-500">Ghi chú: {item.GhiChu}</div>}
            </div>
            <div className="shrink-0 font-semibold text-gray-700">x{getQuantity(item)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { maBan } = useParams();
  const currentMaBan = maBan || localStorage.getItem('customer_maBan');

  const activeOrderId = localStorage.getItem(ACTIVE_ORDER_ID_KEY);
  const activeOrderDetails = readActiveOrderDetails();
  const initialCartItems = location.state?.cartItems || activeOrderDetails?.items || [];

  const [showSuccess, setShowSuccess] = useState(Boolean(activeOrderId));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState(activeOrderId);
  const [confirmedOrder, setConfirmedOrder] = useState(
    activeOrderId ? normalizeOrderDetails(activeOrderDetails, { MaDH: activeOrderId, MaBan: currentMaBan }) : null
  );
  const [cancelledOrder, setCancelledOrder] = useState(null);

  const displayedItems = confirmedOrder?.items?.length ? confirmedOrder.items : initialCartItems;
  const totalAmount = displayedItems.reduce((sum, item) => sum + getPrice(item) * getQuantity(item), 0);

  useEffect(() => {
    if (displayedItems.length === 0 && !showSuccess && !confirmedOrder) {
      navigate(currentMaBan ? `/order/${currentMaBan}/menu` : '/order/menu');
    }
  }, [displayedItems.length, showSuccess, confirmedOrder, currentMaBan, navigate]);

  useEffect(() => {
    if (!showSuccess || !orderId || cancelledOrder) return;

    const interval = setInterval(async () => {
      try {
        const data = await getOrderStatus(orderId);
        if (data.status === 'Đã hủy') {
          const fallback = confirmedOrder || readActiveOrderDetails();
          const orderDetails = normalizeOrderDetails(data.order, fallback);
          setCancelledOrder(orderDetails);
          localStorage.removeItem(ACTIVE_ORDER_ID_KEY);
          localStorage.removeItem(ACTIVE_ORDER_DETAILS_KEY);
          clearInterval(interval);
        }
      } catch (e) {
        // Bỏ qua lỗi mạng tạm thời, lần polling sau sẽ thử lại.
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [showSuccess, orderId, cancelledOrder, confirmedOrder]);

  const handleSubmitOrder = async () => {
    const existingOrderId = localStorage.getItem(ACTIVE_ORDER_ID_KEY);
    if (existingOrderId) {
      const existingDetails = normalizeOrderDetails(readActiveOrderDetails(), { MaDH: existingOrderId, MaBan: currentMaBan });
      setOrderId(existingOrderId);
      setConfirmedOrder(existingDetails);
      setShowSuccess(true);
      return;
    }

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
        items: initialCartItems.map(item => ({
          MaMonAn: item.MaMonAn,
          SoLuong: getQuantity(item),
          GhiChu: item.GhiChu || '',
        }))
      };
      const res = await placeOrder(orderData);
      if (res.success) {
        const newOrderId = res.data?.MaDH;
        if (!newOrderId) {
          setError('Không nhận được mã đơn từ máy chủ. Vui lòng báo nhân viên kiểm tra.');
          return;
        }
        const snapshot = buildOrderSnapshot(newOrderId, currentMaBan, initialCartItems);
        localStorage.setItem(ACTIVE_ORDER_ID_KEY, newOrderId);
        localStorage.setItem(ACTIVE_ORDER_DETAILS_KEY, JSON.stringify(snapshot));
        setOrderId(newOrderId);
        setConfirmedOrder(snapshot);
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
    navigate(currentMaBan ? `/order/${currentMaBan}/menu` : '/order/menu');
  };

  if (displayedItems.length === 0 && !showSuccess) return null;

  return (
    <div className="flex flex-col h-full bg-[#fdfbf7] relative">
      <div className="bg-[#cc2027] text-white p-6 pt-8 rounded-b-[40px] shadow-lg relative z-10">
        <button onClick={() => navigate(-1)} className="absolute top-6 left-4 p-2 text-white/80 hover:text-white">
          <ArrowLeft size={24} />
        </button>
        <div className="mt-8 mb-4">
          <p className="text-[10px] uppercase tracking-widest text-white/60 mb-1">{currentMaBan ? `Bàn ${currentMaBan}` : 'Đơn hàng'}</p>
          <h1 className="text-2xl font-serif mb-2">{confirmedOrder ? 'Đơn hàng đã xác nhận' : 'Xác nhận đơn hàng'}</h1>
          <p className="text-white/70 text-xs">
            {confirmedOrder ? 'Đơn của quý khách đã được gửi cho nhà bếp.' : 'Kiểm tra lại món đã chọn trước khi gửi cho nhà bếp.'}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 -mt-4 pt-8">
        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-2xl mb-6 text-sm border border-red-100">{error}</div>
        )}
        {confirmedOrder?.MaDH && (
          <div className="bg-green-50 text-green-700 p-4 rounded-2xl mb-6 text-sm border border-green-100">
            Đã xác nhận đơn <span className="font-bold">{confirmedOrder.MaDH}</span>. Vui lòng chờ nhân viên phục vụ.
          </div>
        )}
        <OrderItems items={displayedItems} />
        <div className="bg-[#cc2027] text-white p-4 rounded-2xl shadow-md flex justify-between items-center mb-8">
          <span className="text-white/80 text-sm">Tổng thanh toán</span>
          <span className="font-bold text-lg">{totalAmount.toLocaleString('vi-VN')}đ</span>
        </div>
      </div>

      {!confirmedOrder && (
        <div className="p-4 bg-white border-t border-gray-100 sticky bottom-0">
          <button
            onClick={handleSubmitOrder}
            disabled={isSubmitting}
            className={`w-full text-white font-medium text-lg py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${isSubmitting ? 'bg-primary/70 cursor-not-allowed' : 'bg-primary hover:bg-primaryDark active:scale-[0.98]'}`}
          >
            {isSubmitting ? <><Loader2 size={20} className="animate-spin" />Đang gửi đơn...</> : 'Xác nhận gửi đơn'}
          </button>
        </div>
      )}

      {showSuccess && !cancelledOrder && confirmedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-full max-w-[360px] text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={32} className="text-primary" />
            </div>
            <h2 className="text-primary font-bold text-lg mb-2">Đơn hàng đã được xác nhận</h2>
            <div className="mb-4 text-sm font-semibold text-gray-700">Mã đơn: {confirmedOrder.MaDH}</div>
            <p className="text-gray-600 text-sm mb-5 leading-relaxed">Quý khách vui lòng chờ nhân viên phục vụ món ăn.</p>
            <CompactOrderItems items={confirmedOrder.items} />
            <button onClick={handleBackToMenu} className="w-full bg-primary hover:bg-primaryDark text-white font-medium py-3.5 rounded-xl transition-colors active:scale-[0.98]">
              Quay lại menu
            </button>
          </div>
        </div>
      )}

      {cancelledOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-full max-w-[360px] text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle size={32} className="text-red-500" />
            </div>
            <h2 className="text-red-500 font-bold text-lg mb-2">Đơn hàng đã bị hủy</h2>
            <div className="mb-4 text-sm font-semibold text-gray-700">Mã đơn: {cancelledOrder.MaDH}</div>
            <p className="text-gray-600 text-sm mb-5 leading-relaxed">
              Rất tiếc, đơn hàng của quý khách đã bị hủy. Vui lòng liên hệ nhân viên hoặc đặt lại.
            </p>
            <CompactOrderItems items={cancelledOrder.items} />
            <button onClick={handleBackToMenu} className="w-full bg-primary hover:bg-primaryDark text-white font-medium py-3.5 rounded-xl transition-colors active:scale-[0.98]">
              Quay lại menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
