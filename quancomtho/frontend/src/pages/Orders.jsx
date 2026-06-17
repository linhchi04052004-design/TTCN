import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ShoppingBag, ChevronDown, CheckCircle, XCircle, Clock, Utensils, AlertCircle, X, Eye } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import CancelOrderPopup from '../components/CancelOrderPopup';

export default function Orders() {
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [tableModal, setTableModal] = useState(null); // { table, orders: [] }
  const [tableModalLoading, setTableModalLoading] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tablesRes, ordersRes] = await Promise.all([
        fetch('http://localhost:8000/api/admin/tables'),
        fetch('http://localhost:8000/api/admin/orders')
      ]);

      const tablesResult = await tablesRes.json();
      const ordersResult = await ordersRes.json();

      if (tablesResult.success) {
        setTables(tablesResult.data.tables);
      }
      if (ordersResult.success) {
        setOrders(ordersResult.data);
      }
    } catch (error) {
      console.error('Lỗi lấy dữ liệu:', error);
      showMessage('error', 'Không thể tải dữ liệu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTakeaway = () => {
    navigate('/admin/orders/create');
  };

  const handleCreateTableOrder = (maBan) => {
    navigate(`/admin/orders/create/${maBan}`);
  };

  const handleViewTableOrders = async (table) => {
    setTableModal({ table, orders: [] });
    setTableModalLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/admin/orders?maBan=${table.MaBan}`);
      const result = await res.json();
      if (result.success) {
        // Filter orders for this table
        const tableOrders = result.data.filter(o => o.MaBan === table.MaBan);
        setTableModal({ table, orders: tableOrders });
      }
    } catch (error) {
      console.error('Lỗi tải đơn của bàn:', error);
    } finally {
      setTableModalLoading(false);
    }
  };

  const handlePayOrder = (maDH) => {
    navigate(`/admin/payment/${maDH}`);
  };

  const handleCancelOrderClick = (order) => {
    setOrderToCancel(order);
  };

  const executeCancelOrder = async (maDH) => {
    try {
      const res = await fetch(`http://localhost:8000/api/admin/orders/${maDH}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
      });
      const result = await res.json();
      if (result.success) {
        showMessage('success', `Hủy đơn thành công!`);
        if (tableModal) {
          // Refresh table modal orders
          handleViewTableOrders(tableModal.table);
        }
        fetchData();
      } else {
        showMessage('error', result.message || 'Lỗi hủy đơn.');
      }
    } catch (error) {
      showMessage('error', 'Lỗi kết nối máy chủ.');
    } finally {
      setOrderToCancel(null);
    }
  };

  return (
    <div className="flex h-screen bg-[#F8F9FA] text-gray-800 font-sans overflow-hidden">
      <Sidebar />

      {orderToCancel && (
        <CancelOrderPopup 
          order={orderToCancel} 
          onClose={() => setOrderToCancel(null)} 
          onConfirm={executeCancelOrder} 
        />
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto relative">
        
        {/* Toast Notification */}
        {message.text && (
          <div className={`fixed top-8 right-8 px-6 py-3 rounded-lg shadow-lg font-medium z-50 transition-opacity flex items-center gap-2 ${message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
             {message.type === 'success' ? <CheckCircle size={18}/> : <AlertCircle size={18}/>}
            {message.text}
          </div>
        )}

        {/* Table Orders Modal */}
        {tableModal && (
          <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{tableModal.table.TenBan}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Đơn hàng hiện tại tại bàn</p>
                </div>
                <button
                  onClick={() => setTableModal(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6">
                {tableModalLoading ? (
                  <div className="text-center text-gray-400 py-8">Đang tải đơn hàng...</div>
                ) : tableModal.orders.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <Utensils size={40} className="mx-auto mb-3 text-gray-200"/>
                    <p>Bàn này chưa có đơn nào chưa thanh toán.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tableModal.orders.map(order => {
                      let totalItems = 0;
                      let totalPrice = 0;
                      if (order.chi_tiet && order.chi_tiet.length > 0) {
                        order.chi_tiet.forEach(item => {
                          totalItems += item.SoLuong;
                          totalPrice += (item.SoLuong * item.DonGiaTaiThoiDiemBan);
                        });
                      }
                      return (
                        <div key={order.MaDH} className="border border-gray-200 rounded-xl overflow-hidden">
                          {/* Order header */}
                          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                            <div>
                              <span className="font-bold text-gray-800">{order.MaDH}</span>
                              <span className="ml-2 text-xs text-gray-500">{order.NgayDat}</span>
                            </div>
                            <span className="text-sm font-bold text-red-600">{totalPrice.toLocaleString('vi-VN')}đ</span>
                          </div>
                          {/* Items */}
                          {order.chi_tiet && order.chi_tiet.length > 0 && (
                            <div className="px-4 py-3 space-y-1">
                              {order.chi_tiet.map(item => (
                                <div key={item.MaCTDH} className="flex justify-between text-sm">
                                  <span className="text-gray-700">{item.mon_an ? item.mon_an.TenMonAn : item.MaMonAn} <span className="text-gray-400">x{item.SoLuong}</span></span>
                                  <span className="text-gray-600">{(item.SoLuong * item.DonGiaTaiThoiDiemBan).toLocaleString('vi-VN')}đ</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {/* Actions */}
                          <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
                            <button
                              onClick={() => handlePayOrder(order.MaDH)}
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg text-sm transition-colors"
                            >
                              Thanh toán
                            </button>
                            <button
                              onClick={() => handleCancelOrderClick(order)}
                              className="flex-1 bg-white border border-red-600 text-red-600 hover:bg-red-50 font-bold py-2 rounded-lg text-sm transition-colors"
                            >
                              Hủy đơn
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-gray-100 flex-shrink-0">
                <button
                  onClick={() => { setTableModal(null); handleCreateTableOrder(tableModal.table.MaBan); }}
                  className="w-full border border-dashed border-red-400 text-red-600 hover:bg-red-50 font-medium py-2 rounded-lg text-sm transition-colors"
                >
                  + Tạo thêm đơn mới cho bàn này
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold uppercase tracking-wide">ĐƠN HÀNG</h1>
            <div className="flex items-center gap-4">
              <button 
                onClick={handleCreateTakeaway}
                className="flex items-center gap-2 border border-red-600 text-red-600 px-4 py-2 rounded-lg font-bold hover:bg-red-50 transition-colors"
              >
                <ShoppingBag size={18} />
                ĐƠN MANG VỀ
              </button>
              
              <div className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-600 shadow-sm">
                <Clock size={16} className="text-gray-400" />
                <span>{format(new Date(), 'dd/MM/yyyy')}</span>
              </div>
            </div>
          </div>

          {/* Sơ đồ bàn */}
          <div className="mb-10">
            <h2 className="text-lg font-bold mb-4 uppercase">SƠ ĐỒ BÀN</h2>
            <div className="flex gap-4 mb-4">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-3 h-3 rounded-full bg-green-500"></div> Trống – nhấn để tạo đơn
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-3 h-3 rounded-full bg-red-500"></div> Có khách – nhấn để xem đơn
              </div>
            </div>

            {loading ? (
               <div className="text-gray-500">Đang tải dữ liệu bàn...</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {tables.map(table => (
                  <div 
                    key={table.MaBan} 
                    className={`bg-white rounded-xl border p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all cursor-pointer ${
                      table.TrangThai === 'Trống'
                        ? 'border-green-200 hover:border-green-400 hover:bg-green-50/30'
                        : 'border-red-200 hover:border-red-400 hover:bg-red-50/30'
                    }`}
                    onClick={() => {
                      if (table.TrangThai === 'Trống') {
                        handleCreateTableOrder(table.MaBan);
                      } else {
                        handleViewTableOrders(table);
                      }
                    }}
                  >
                    <div className="font-bold text-gray-800 text-base mb-1">{table.TenBan}</div>
                    <div className="text-gray-400 text-xs mb-3">{table.SucChua} người</div>
                    {table.TrangThai === 'Trống' ? (
                      <div className="bg-green-100 text-green-700 w-full py-1 rounded-lg text-xs font-bold">Trống</div>
                    ) : (
                      <div className="bg-red-100 text-red-700 w-full py-1 rounded-lg text-xs font-bold flex items-center justify-center gap-1">
                        <Eye size={12}/> Có khách
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Danh sách đơn hàng */}
          <div>
            <h2 className="text-lg font-bold mb-4 uppercase flex items-center gap-2">
                DANH SÁCH ĐƠN HÀNG <span className="text-gray-400 text-sm font-normal normal-case">(Chưa thanh toán)</span>
            </h2>
            
            {loading ? (
                <div className="text-gray-500">Đang tải danh sách đơn hàng...</div>
            ) : orders.length === 0 ? (
                <div className="bg-white p-8 rounded-xl border border-gray-100 text-center text-gray-500 shadow-sm">
                    Không có đơn hàng nào cần thanh toán.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {orders.map(order => {
                        let totalItems = 0;
                        let totalPrice = 0;
                        if(order.chi_tiet && order.chi_tiet.length > 0) {
                            order.chi_tiet.forEach(item => {
                                totalItems += item.SoLuong;
                                totalPrice += (item.SoLuong * item.DonGiaTaiThoiDiemBan);
                            });
                        }

                        return (
                            <div key={order.MaDH} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow cursor-pointer">
                                <div className="p-5 flex-1" onClick={() => navigate(`/admin/orders/${order.MaDH}`)}>
                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                                        {order.HinhThuc === 'Tại bàn' ? <Utensils size={14}/> : <ShoppingBag size={14}/>}
                                        {order.HinhThuc}
                                    </div>
                                    
                                    <div className="font-bold text-xl text-gray-800 mb-1">{order.MaDH}</div>
                                    <div className="text-sm text-gray-600 mb-1">
                                        {order.HinhThuc === 'Tại bàn' && order.ban_an ? order.ban_an.TenBan : (order.TenKhach || 'Khách vãng lai')}
                                    </div>
                                    <div className="text-xs text-gray-400 mb-4">{order.NgayDat}</div>
                                    
                                    {/* Items list */}
                                    {order.chi_tiet && order.chi_tiet.length > 0 && (
                                      <div className="border-t border-dashed border-gray-100 pt-3 mb-3 space-y-1">
                                        {order.chi_tiet.slice(0, 3).map(item => (
                                          <div key={item.MaCTDH} className="flex justify-between text-xs text-gray-600">
                                            <span>{item.mon_an ? item.mon_an.TenMonAn : item.MaMonAn} x{item.SoLuong}</span>
                                            <span>{(item.SoLuong * item.DonGiaTaiThoiDiemBan).toLocaleString('vi-VN')}đ</span>
                                          </div>
                                        ))}
                                        {order.chi_tiet.length > 3 && (
                                          <div className="text-xs text-gray-400">+{order.chi_tiet.length - 3} món khác...</div>
                                        )}
                                      </div>
                                    )}

                                    <div className="border-t border-dashed border-gray-200 pt-3">
                                        <div className="text-sm text-gray-500 mb-1">{totalItems} món</div>
                                        <div className="font-bold text-xl text-red-600">
                                            {totalPrice.toLocaleString('vi-VN')}đ
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 flex gap-3 border-t border-gray-100 bg-gray-50 mt-auto">
                                    <button 
                                        onClick={() => handlePayOrder(order.MaDH)}
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg transition-colors shadow-sm"
                                    >
                                        Thanh toán
                                    </button>
                                    <button 
                                        onClick={() => handleCancelOrderClick(order)}
                                        className="flex-1 bg-white border border-red-600 text-red-600 hover:bg-red-50 font-bold py-2 rounded-lg transition-colors shadow-sm"
                                    >
                                        Hủy đơn
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
