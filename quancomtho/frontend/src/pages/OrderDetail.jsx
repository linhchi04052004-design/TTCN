import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, CheckCircle, AlertCircle, Clock, Utensils, ShoppingBag, User, Phone, Hash, Calendar, CreditCard, XCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import CancelOrderPopup from '../components/CancelOrderPopup';
import { buildApiUrl } from '../config';

export default function OrderDetail() {
  const { maDH } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchOrder();
  }, [maDH]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await fetch(buildApiUrl(`/admin/orders/${maDH}`));
      const result = await res.json();
      if (result.success) {
        setOrder(result.data);
      } else {
        showMessage('error', 'Không tìm thấy đơn hàng.');
      }
    } catch (error) {
      showMessage('error', 'Lỗi tải dữ liệu đơn hàng.');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = () => {
    navigate(`/admin/payment/${maDH}`);
  };

  const handleCancelClick = () => {
    setOrderToCancel(order);
  };

  const executeCancel = async () => {
    try {
      const res = await fetch(buildApiUrl(`/admin/orders/${maDH}/cancel`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
      });
      const result = await res.json();
      if (result.success) {
        alert('Hủy đơn thành công!');
        fetchOrder();
      } else {
        alert(result.message || 'Lỗi hủy đơn');
      }
    } catch (error) {
      alert('Lỗi kết nối');
    } finally {
      setOrderToCancel(null);
    }
  };

  // Tính tổng
  let totalItems = 0;
  let totalPrice = 0;
  if (order && order.chi_tiet) {
    order.chi_tiet.forEach(item => {
      totalItems += item.SoLuong;
      totalPrice += item.SoLuong * parseFloat(item.DonGiaTaiThoiDiemBan);
    });
  }

  const isPaid = order && order.hoa_don;
  const isCancelled = order && order.TrangThai === 'Đã hủy';

  return (
    <div className="flex h-screen bg-[#F8F9FA] text-gray-800 font-sans overflow-hidden">
      <Sidebar />

      {orderToCancel && (
        <CancelOrderPopup 
          order={orderToCancel} 
          onClose={() => setOrderToCancel(null)} 
          onConfirm={executeCancel} 
        />
      )}

      <div className="flex-1 overflow-y-auto relative">
        {/* Toast */}
        {message.text && (
          <div className={`fixed top-8 right-8 px-6 py-3 rounded-lg shadow-lg font-medium z-50 flex items-center gap-2 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message.type === 'success' ? <CheckCircle size={18}/> : <AlertCircle size={18}/>}
            {message.text}
          </div>
        )}

        <div className="p-8 max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-6 border-b border-gray-200 pb-4 flex justify-between items-end">
            <div>
              <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Vận hành Quan Com Tho</div>
              <h1 className="text-2xl font-bold text-gray-800">Chi tiết đơn hàng</h1>
            </div>
            <div className="flex gap-3 text-sm">
              <div className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-600 shadow-sm">
                <Clock size={16} className="text-gray-400" />
                <span>{order ? order.NgayDat : format(new Date(), 'dd/MM/yyyy')}</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-gray-500 text-center py-20">Đang tải dữ liệu...</div>
          ) : !order ? (
            <div className="text-gray-500 text-center py-20">Không tìm thấy đơn hàng.</div>
          ) : (
            <>
              {/* Back & Status */}
              <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate('/admin/orders')} className="text-gray-500 font-medium hover:text-red-600 transition-colors flex items-center gap-1 text-sm">
                  Quay lại
                </button>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  isPaid ? 'bg-blue-50 text-blue-600 border-blue-200' : 
                  isCancelled ? 'bg-gray-50 text-gray-500 border-gray-200' : 
                  'bg-yellow-50 text-yellow-600 border-yellow-200'
                }`}>
                  {isPaid ? 'Đã thanh toán' : isCancelled ? 'Đã hủy' : 'Chờ xác nhận'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-6">
                {/* Left: Order Info + Items */}
                <div className="col-span-2 space-y-6">

                  {/* Thông tin đơn */}
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="grid grid-cols-4 gap-6 mb-6">
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Mã đơn</div>
                        <div className="font-bold text-gray-800">{order.MaDH}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Bàn số</div>
                        <div className="font-bold text-gray-800">{order.ban_an ? order.ban_an.TenBan : 'Mang về'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Hình thức</div>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                          order.HinhThuc === 'Tại bàn' ? 'bg-orange-100 text-orange-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {order.HinhThuc}
                        </span>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Số ghế</div>
                        <div className="font-medium text-gray-800">{order.ban_an ? order.ban_an.SucChua : '—'}</div>
                      </div>
                    </div>
                    
                    <div>
                        <div className="text-xs text-gray-400 mb-1">Khách hàng</div>
                        <div className="font-bold text-gray-800">{order.TenKhach || 'Khách vãng lai'}</div>
                        <div className="text-xs text-gray-400 mt-1">{order.SDT || ''}</div>
                    </div>
                  </div>

                {/* Thông tin đơn */}


                {/* Danh sách món */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-700">Món đặt</h3>
                  </div>

                  {/* Table header */}
                  <div className="grid grid-cols-12 px-6 py-3 bg-white text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                    <div className="col-span-5">TÊN MÓN</div>
                    <div className="col-span-1 text-center">SL</div>
                    <div className="col-span-3 text-center">ĐƠN GIÁ</div>
                    <div className="col-span-3 text-right">THÀNH TIỀN</div>
                  </div>

                  {/* Items */}
                  {order.chi_tiet && order.chi_tiet.length > 0 ? (
                    order.chi_tiet.map((item, index) => {
                      const thanhTien = item.SoLuong * parseFloat(item.DonGiaTaiThoiDiemBan);
                      return (
                        <div key={item.MaCTDH} className={`grid grid-cols-12 px-6 py-3.5 items-center ${index !== order.chi_tiet.length - 1 ? 'border-b border-gray-50' : ''}`}>
                          <div className="col-span-5 font-medium text-gray-800 text-sm">
                            {item.mon_an ? item.mon_an.TenMonAn : item.MaMonAn}
                          </div>
                          <div className="col-span-1 text-center text-gray-600 text-sm">{item.SoLuong}</div>
                          <div className="col-span-3 text-center text-gray-600 text-sm">{parseFloat(item.DonGiaTaiThoiDiemBan).toLocaleString('vi-VN')}đ</div>
                          <div className="col-span-3 text-right font-medium text-gray-800 text-sm">{thanhTien.toLocaleString('vi-VN')}đ</div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="px-6 py-8 text-center text-gray-400 text-sm">Đơn hàng chưa có món nào.</div>
                  )}

                  {/* Total */}
                  <div className="px-6 py-5 bg-white flex justify-end items-center">
                    <div className="flex items-center gap-6">
                      <span className="text-sm font-bold text-gray-800">Tổng cộng</span>
                      <span className="text-lg font-bold text-orange-500">{totalPrice.toLocaleString('vi-VN')}đ</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="col-span-1 space-y-6">
                {/* Thao tác đơn */}
                {!isPaid && !isCancelled && (
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="font-bold text-gray-700 mb-4 text-sm">Thao tác đơn</h3>
                    <div className="space-y-3">
                      <button
                        onClick={handlePay}
                        className="w-full bg-[#c23531] hover:bg-red-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm shadow-sm"
                      >
                        Thanh toán ngay
                      </button>
                      <button
                        onClick={handleCancelClick}
                        className="w-full bg-white border border-[#c23531] text-[#c23531] hover:bg-red-50 font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm shadow-sm"
                      >
                        Hủy đơn
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Thông tin thanh toán (nếu đã thanh toán) */}
                {isPaid && (
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                    <h3 className="font-bold text-gray-700 mb-4">Thông tin thanh toán</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Mã hóa đơn</span>
                        <span className="font-medium">{order.hoa_don.MaHD}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Phương thức</span>
                        <span className="font-medium">{order.hoa_don.PTTT}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Thành tiền</span>
                        <span className="font-bold text-green-600">{parseFloat(order.hoa_don.ThanhTien).toLocaleString('vi-VN')}đ</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Ngày TT</span>
                        <span className="font-medium">{order.hoa_don.NgayThanhToan}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Trạng thái đã hủy */}
                {isCancelled && (
                  <div className="bg-red-50 rounded-xl border border-red-200 p-5 text-center">
                    <XCircle size={36} className="mx-auto text-red-400 mb-2"/>
                    <div className="font-bold text-red-700">Đơn hàng đã bị hủy</div>
                  </div>
                )}

              </div>
            </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
