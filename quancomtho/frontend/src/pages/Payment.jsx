import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Clock } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Sidebar from '../components/Sidebar';
import { buildApiUrl } from '../config';

export default function Payment() {
  const { maDH } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [mainOrder, setMainOrder] = useState(null);
  const [allUnpaidOrders, setAllUnpaidOrders] = useState([]);
  const [mergedOrders, setMergedOrders] = useState([]);
  const [selectedMergeOrder, setSelectedMergeOrder] = useState('');
  
  const [paymentMethod, setPaymentMethod] = useState('Tiền mặt');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [maDH]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [orderRes, allOrdersRes] = await Promise.all([
        fetch(buildApiUrl(`/admin/orders/${maDH}`)),
        fetch(buildApiUrl('/admin/orders'))
      ]);
      const orderData = await orderRes.json();
      const allOrdersData = await allOrdersRes.json();

      if (orderData.success) {
        setMainOrder(orderData.data);
      }
      if (allOrdersData.success) {
        setAllUnpaidOrders(allOrdersData.data);
      }
    } catch (error) {
      console.error(error);
      alert('Lỗi tải dữ liệu đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  // Các đơn hàng có thể gộp (trừ đơn chính và các đơn đã gộp)
  const availableOrdersToMerge = allUnpaidOrders.filter(o => 
    o.MaDH !== maDH && !mergedOrders.find(mo => mo.MaDH === o.MaDH)
  );

  // Sắp xếp ưu tiên đơn cùng bàn lên đầu
  if (mainOrder && mainOrder.MaBan) {
    availableOrdersToMerge.sort((a, b) => {
      if (a.MaBan === mainOrder.MaBan && b.MaBan !== mainOrder.MaBan) return -1;
      if (b.MaBan === mainOrder.MaBan && a.MaBan !== mainOrder.MaBan) return 1;
      return 0;
    });
  }

  const formatOrderLabel = (o) => {
    const table = o.ban_an ? o.ban_an.TenBan : 'Mang về';
    const customer = o.TenKhach || 'Khách vãng lai';
    const phone = o.SDT ? ` - ${o.SDT}` : '';
    return `${o.MaDH} - ${table} - ${customer}${phone}`;
  };

  const calculateSubtotal = (order) => {
    if (!order || !order.chi_tiet) return 0;
    return order.chi_tiet.reduce((sum, item) => sum + (item.SoLuong * parseFloat(item.DonGiaTaiThoiDiemBan)), 0);
  };

  const handleMergeOrder = () => {
    if (!selectedMergeOrder) return;
    const orderToMerge = allUnpaidOrders.find(o => o.MaDH === selectedMergeOrder);
    if (orderToMerge) {
      setMergedOrders([...mergedOrders, orderToMerge]);
      setSelectedMergeOrder('');
    }
  };

  const handleResetMerge = () => {
    setMergedOrders([]);
    setSelectedMergeOrder('');
  };

  const totalPayment = calculateSubtotal(mainOrder) + mergedOrders.reduce((sum, o) => sum + calculateSubtotal(o), 0);

  const handlePayment = async () => {
    setIsSubmitting(true);
    const payload = {
      mainOrderId: mainOrder.MaDH,
      mergedOrderIds: mergedOrders.map(o => o.MaDH),
      paymentMethod: paymentMethod
    };

    try {
      const res = await fetch(buildApiUrl('/admin/payment/process'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.success) {
        navigate(`/admin/payment-success/${result.data.MaHD}`);
      } else {
        alert(result.message || 'Lỗi khi thanh toán');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error(error);
      alert('Lỗi kết nối máy chủ');
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="flex h-screen bg-[#F8F9FA] items-center justify-center">Đang tải...</div>;
  if (!mainOrder) return <div className="flex h-screen bg-[#F8F9FA] items-center justify-center">Không tìm thấy đơn hàng.</div>;

  return (
    <div className="flex h-screen bg-[#F8F9FA] text-gray-800 font-sans overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto p-8 relative">
        <div className="max-w-5xl mx-auto w-full">
          {/* Header */}
          <div className="flex justify-between items-center mb-8 border-b border-gray-200 pb-4">
            <h1 className="text-2xl font-bold">Thanh toán đơn hàng</h1>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-600 shadow-sm">
                <Clock size={16} className="text-gray-400" />
                <span>{format(new Date(), 'dd/MM/yyyy')}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8">
            {/* Cột trái: Chi tiết các đơn */}
            <div className="col-span-2 space-y-6">
              {/* Đơn chính */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">ĐƠN CHÍNH</h2>
                <div className="font-bold text-gray-800 mb-4">{formatOrderLabel(mainOrder)}</div>
                
                <div className="space-y-3 mb-4">
                  {mainOrder.chi_tiet && mainOrder.chi_tiet.map(item => (
                    <div key={item.MaCTDH} className="flex justify-between items-center text-sm">
                      <div className="flex-1 text-gray-700">{item.mon_an ? item.mon_an.TenMonAn : item.MaMonAn}</div>
                      <div className="w-16 text-center text-gray-500">x{item.SoLuong}</div>
                      <div className="w-24 text-right font-medium text-gray-800">
                        {(item.SoLuong * parseFloat(item.DonGiaTaiThoiDiemBan)).toLocaleString('vi-VN')}đ
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <span className="text-sm text-gray-500 font-medium">Tạm tính</span>
                  <span className="font-bold text-gray-800">{calculateSubtotal(mainOrder).toLocaleString('vi-VN')}đ</span>
                </div>
              </div>

              {/* Các đơn đã gộp */}
              {mergedOrders.map(mo => (
                <div key={mo.MaDH} className="bg-white rounded-xl shadow-sm p-6 relative border border-blue-100">
                  <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">ĐƠN ĐÃ GỘP</h2>
                  <div className="font-bold text-gray-800 mb-4">{formatOrderLabel(mo)}</div>
                  
                  <div className="space-y-3 mb-4">
                    {mo.chi_tiet && mo.chi_tiet.map(item => (
                      <div key={item.MaCTDH} className="flex justify-between items-center text-sm">
                        <div className="flex-1 text-gray-700">{item.mon_an ? item.mon_an.TenMonAn : item.MaMonAn}</div>
                        <div className="w-16 text-center text-gray-500">x{item.SoLuong}</div>
                        <div className="w-24 text-right font-medium text-gray-800">
                          {(item.SoLuong * parseFloat(item.DonGiaTaiThoiDiemBan)).toLocaleString('vi-VN')}đ
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <span className="text-sm text-gray-500 font-medium">Tạm tính</span>
                    <span className="font-bold text-gray-800">{calculateSubtotal(mo).toLocaleString('vi-VN')}đ</span>
                  </div>
                </div>
              ))}

              <div className="pt-6">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">TỔNG THANH TOÁN</h3>
                <div className="text-4xl font-bold text-[#e50027]">{totalPayment.toLocaleString('vi-VN')}đ</div>
              </div>
            </div>

            {/* Cột phải: Thao tác */}
            <div className="col-span-1 space-y-6">
              {/* Gộp đơn */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-sm font-bold text-gray-800 mb-2">GỘP ĐƠN</h3>
                <label className="block text-xs text-gray-500 mb-2">Chọn đơn cần gộp</label>
                <select 
                  value={selectedMergeOrder}
                  onChange={(e) => setSelectedMergeOrder(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-red-300 mb-4 bg-gray-50"
                >
                  <option value="">Chọn đơn...</option>
                  {availableOrdersToMerge.map(o => (
                    <option key={o.MaDH} value={o.MaDH}>{formatOrderLabel(o)}</option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button"
                    onClick={handleMergeOrder}
                    disabled={!selectedMergeOrder}
                    className="bg-[#c23531] hover:bg-red-700 disabled:bg-red-300 text-white font-bold py-2 rounded-lg transition-colors text-sm shadow-sm"
                  >
                    Gộp đơn
                  </button>
                  <button 
                    type="button"
                    onClick={handleResetMerge}
                    disabled={mergedOrders.length === 0}
                    className="bg-white border border-[#c23531] hover:bg-red-50 disabled:border-gray-200 disabled:text-gray-400 text-[#c23531] font-bold py-2 rounded-lg transition-colors text-sm shadow-sm"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Phương thức thanh toán */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase">PHƯƠNG THỨC THANH TOÁN</h3>

                <div className="mb-4">
                  <label className="block text-xs text-gray-500 mb-1.5 font-medium">Chọn phương thức thanh toán</label>
                  <select 
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-red-500 bg-gray-50 font-medium"
                  >
                    <option value="Tiền mặt">Tiền mặt</option>
                    <option value="MoMo">MoMo</option>
                    <option value="VNPay">VNPay</option>
                  </select>
                </div>

                <button 
                  onClick={handlePayment}
                  disabled={isSubmitting}
                  className="w-full bg-[#8c6239] hover:bg-[#734d2a] disabled:bg-gray-300 text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm text-sm active:scale-[0.98]"
                >
                  {isSubmitting ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
                </button>
              </div>

              {/* Mã QR thanh toán ảo làm mẫu (Chỉ hiện khi chọn MoMo hoặc VNPay) */}
              {(paymentMethod === 'MoMo' || paymentMethod === 'VNPay') && (
                <div className="bg-white rounded-xl shadow-sm p-6 border border-red-50">
                  <h3 className="text-sm font-bold text-gray-800 mb-2">Mã QR thanh toán</h3>
                  <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                    Quét mã chuyển khoản để thanh toán đơn #{mainOrder.MaDH}
                  </p>
                  
                  <div className="flex flex-col items-center mb-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <QRCodeSVG 
                      value={
                        paymentMethod === 'MoMo' 
                          ? `momo://pay?recipient=0987654321&amount=${Math.round(totalPayment)}&note=THANH+TOAN+${mainOrder.MaDH}`
                          : `vnpay://pay?amount=${Math.round(totalPayment)}&note=THANH+TOAN+${mainOrder.MaDH}`
                      } 
                      size={150} 
                      level="M"
                      includeMargin={false}
                    />
                  </div>

                  <div className="bg-amber-50/70 border border-amber-100 rounded-lg p-3 text-xs text-amber-900 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Nội dung:</span>
                      <span className="font-bold">THANH TOAN {mainOrder.MaDH}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Số tiền:</span>
                      <span className="font-bold text-red-600">{totalPayment.toLocaleString('vi-VN')}đ</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
