import { Outlet, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { XCircle } from 'lucide-react';

const CustomerLayout = () => {
  const [orderCancelled, setOrderCancelled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(async () => {
      const orderId = localStorage.getItem('active_order_id');
      if (!orderId) return;

      try {
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
        const res = await fetch(`${apiBase}/customer/order-status/${orderId}`);
        const data = await res.json();
        if (data.status === 'Đã hủy') {
          localStorage.removeItem('active_order_id');
          setOrderCancelled(true);
        }
      } catch (e) {}
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleDismiss = () => {
    setOrderCancelled(false);
    const maBan = localStorage.getItem('customer_maBan');
    if (maBan) navigate(`/order/${maBan}/menu`);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center font-sans text-gray-900">
      <div className="w-full max-w-[480px] bg-white min-h-screen shadow-2xl relative overflow-hidden flex flex-col">
        <Outlet />

        {orderCancelled && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-8 w-full max-w-[340px] text-center shadow-2xl">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle size={32} className="text-red-500" />
              </div>
              <h2 className="text-red-500 font-bold text-lg mb-4">Đơn hàng đã bị hủy</h2>
              <p className="text-gray-600 text-sm mb-8 leading-relaxed">
                Rất tiếc, đơn hàng của quý khách đã bị hủy bởi nhân viên. Vui lòng liên hệ nhân viên hoặc đặt lại.
              </p>
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