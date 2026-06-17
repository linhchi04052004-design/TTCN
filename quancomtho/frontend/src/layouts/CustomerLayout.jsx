import { Outlet, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { XCircle } from 'lucide-react';

const ACTIVE_ORDER_ID_KEY = 'active_order_id';
const ACTIVE_ORDER_DETAILS_KEY = 'active_order_details';

const readActiveOrderDetails = () => {
  try {
    return JSON.parse(localStorage.getItem(ACTIVE_ORDER_DETAILS_KEY) || 'null');
  } catch {
    return null;
  }
};

const normalizeOrderDetails = (order, fallback = null) => {
  const source = order || fallback || {};
  return {
    MaDH: source.MaDH || localStorage.getItem(ACTIVE_ORDER_ID_KEY) || '',
    MaBan: source.MaBan || fallback?.MaBan || localStorage.getItem('customer_maBan') || '',
    items: Array.isArray(source.items) ? source.items : [],
  };
};

const OrderItems = ({ items = [] }) => {
  if (!items.length) return null;

  return (
    <div className="mb-6 max-h-44 overflow-y-auto rounded-2xl border border-red-100 bg-red-50/40 p-3 text-left">
      <div className="mb-2 text-xs font-bold uppercase tracking-wide text-red-500">Các món đã đặt</div>
      <div className="space-y-2">
        {items.map((item, index) => {
          const quantity = item.SoLuong || item.quantity || 0;
          return (
            <div key={`${item.MaMonAn || item.TenMonAn || 'item'}-${index}`} className="flex justify-between gap-3 text-sm">
              <div className="min-w-0">
                <div className="font-medium text-gray-800">{item.TenMonAn || item.MaMonAn}</div>
                {item.GhiChu && <div className="text-xs text-gray-500">Ghi chú: {item.GhiChu}</div>}
              </div>
              <div className="shrink-0 font-semibold text-gray-700">x{quantity}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const CustomerLayout = () => {
  const [cancelledOrder, setCancelledOrder] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(async () => {
      const orderId = localStorage.getItem(ACTIVE_ORDER_ID_KEY);
      if (!orderId) return;

      try {
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
        const res = await fetch(`${apiBase}/customer/order-status/${orderId}`);
        const data = await res.json();
        if (data.status === 'Đã hủy') {
          const fallback = readActiveOrderDetails();
          setCancelledOrder(normalizeOrderDetails(data.order, fallback));
          localStorage.removeItem(ACTIVE_ORDER_ID_KEY);
          localStorage.removeItem(ACTIVE_ORDER_DETAILS_KEY);
        }
      } catch (e) {}
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleDismiss = () => {
    setCancelledOrder(null);
    const maBan = cancelledOrder?.MaBan || localStorage.getItem('customer_maBan');
    if (maBan) navigate(`/order/${maBan}/menu`);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center font-sans text-gray-900">
      <div className="w-full max-w-[480px] bg-white min-h-screen shadow-2xl relative overflow-hidden flex flex-col">
        <Outlet />

        {cancelledOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-8 w-full max-w-[360px] text-center shadow-2xl">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle size={32} className="text-red-500" />
              </div>
              <h2 className="text-red-500 font-bold text-lg mb-2">Đơn hàng đã bị hủy</h2>
              {cancelledOrder.MaDH && (
                <div className="mb-4 text-sm font-semibold text-gray-700">Mã đơn: {cancelledOrder.MaDH}</div>
              )}
              <p className="text-gray-600 text-sm mb-5 leading-relaxed">
                Rất tiếc, đơn hàng của quý khách đã bị hủy bởi nhân viên.
              </p>
              <OrderItems items={cancelledOrder.items} />
              <button
                onClick={handleDismiss}
                className="w-full bg-[#cc2027] hover:bg-red-700 text-white font-medium py-3.5 rounded-xl transition-colors"
              >
                Quay lại menu
              </button>
            </div>
          </div>
        )}
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}} />
    </div>
  );
};

export default CustomerLayout;
