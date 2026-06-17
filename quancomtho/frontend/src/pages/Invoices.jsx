import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, Wallet, FileText, TrendingUp, Search, Eye, Printer, Filter } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import Sidebar from '../components/Sidebar';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState({ total_invoices: 0, total_revenue: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Filters
  const [dateFilterType, setDateFilterType] = useState('Hôm nay'); // Hôm nay, 7 ngày qua, 30 ngày qua, Tùy chọn
  const [fromDate, setFromDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [paymentMethod, setPaymentMethod] = useState('Tất cả'); // Tất cả, Tiền mặt, Chuyển khoản, Ví điện tử

  useEffect(() => {
    fetchInvoices();
  }, [fromDate, toDate, paymentMethod, dateFilterType]);

  const handleDatePresetChange = (preset) => {
    setDateFilterType(preset);
    const today = new Date();
    if (preset === 'Hôm nay') {
      setFromDate(format(today, 'yyyy-MM-dd'));
      setToDate(format(today, 'yyyy-MM-dd'));
    } else if (preset === '7 ngày qua') {
      setFromDate(format(subDays(today, 6), 'yyyy-MM-dd'));
      setToDate(format(today, 'yyyy-MM-dd'));
    } else if (preset === '30 ngày qua') {
      setFromDate(format(subDays(today, 29), 'yyyy-MM-dd'));
      setToDate(format(today, 'yyyy-MM-dd'));
    }
    // Tùy chọn -> keep existing custom dates or let user change
  };

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (fromDate) queryParams.append('from_date', fromDate);
      if (toDate) queryParams.append('to_date', toDate);
      if (paymentMethod !== 'Tất cả') queryParams.append('payment_method', paymentMethod);

      const res = await fetch(`http://localhost:8000/api/admin/invoices?${queryParams.toString()}`);
      const result = await res.json();
      if (result.success) {
        setInvoices(result.data.invoices);
        setSummary(result.data.summary);
      }
    } catch (error) {
      console.error('Lỗi lấy hóa đơn:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
  };

  const getPaymentMethodIcon = (method) => {
    switch(method) {
      case 'Tiền mặt': return <span className="text-red-500 font-bold border border-red-500 rounded px-2 py-0.5 text-xs">💵 Tiền mặt</span>;
      case 'Momo': return <span className="text-pink-500 font-bold border border-pink-500 rounded px-2 py-0.5 text-xs">💳 Momo</span>;
      case 'VNPay': return <span className="text-blue-500 font-bold border border-blue-500 rounded px-2 py-0.5 text-xs">🏦 VNPay</span>;
      default: return <span className="text-gray-500 font-bold border border-gray-500 rounded px-2 py-0.5 text-xs">{method}</span>;
    }
  };

  return (
    <div className="flex h-screen bg-stone-100 text-gray-800 font-sans overflow-hidden">
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">Hóa đơn</h1>
            <p className="text-gray-500 text-sm">Quản lý hóa đơn đã thanh toán</p>
          </div>
          <div className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-600 shadow-sm">
            <Clock size={16} className="text-gray-400" />
            <span>{format(new Date(), 'dd/MM/yyyy')}</span>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mb-6">
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              {['Hôm nay', '7 ngày qua', '30 ngày qua', 'Tùy chọn'].map(preset => (
                <button
                  key={preset}
                  onClick={() => handleDatePresetChange(preset)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${dateFilterType === preset ? 'bg-red-600 text-white shadow' : 'text-gray-600 hover:text-red-600'}`}
                >
                  {preset}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-4 flex-1 justify-end">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-500 font-medium">Từ ngày:</label>
                <input 
                  type="date" 
                  value={fromDate}
                  onChange={(e) => { setFromDate(e.target.value); setDateFilterType('Tùy chọn'); }}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-red-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-500 font-medium">Đến ngày:</label>
                <input 
                  type="date" 
                  value={toDate}
                  onChange={(e) => { setToDate(e.target.value); setDateFilterType('Tùy chọn'); }}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-red-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-500 font-medium">Phương thức TT:</label>
                <select 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-red-500 min-w-[150px]"
                >
                  <option value="Tất cả">Tất cả</option>
                  <option value="Tiền mặt">Tiền mặt</option>
                  <option value="Momo">Momo</option>
                  <option value="VNPay">VNPay</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-5">
            <div className="bg-red-50 text-red-600 p-4 rounded-xl">
              <FileText size={32} />
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1 font-medium">Tổng hóa đơn</div>
              <div className="text-3xl font-bold text-gray-800">{summary.total_invoices}</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-5 relative overflow-hidden">
            <div className="bg-red-50 text-red-600 p-4 rounded-xl z-10">
              <Wallet size={32} />
            </div>
            <div className="z-10">
              <div className="text-sm text-gray-500 mb-1 font-medium">Tổng doanh thu</div>
              <div className="text-3xl font-bold text-red-600">{formatCurrency(summary.total_revenue)}</div>
            </div>
            <div className="absolute right-4 bottom-4 text-red-100 opacity-50 pointer-events-none">
              <TrendingUp size={100} />
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                <tr>
                  <th className="p-4 uppercase text-xs tracking-wider">Mã hóa đơn</th>
                  <th className="p-4 uppercase text-xs tracking-wider">Ngày thanh toán</th>
                  <th className="p-4 uppercase text-xs tracking-wider">Phương thức thanh toán</th>
                  <th className="p-4 uppercase text-xs tracking-wider text-right">Thành tiền</th>
                  <th className="p-4 uppercase text-xs tracking-wider text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">Đang tải dữ liệu...</td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">Không tìm thấy hóa đơn nào phù hợp.</td>
                  </tr>
                ) : (
                  invoices.map((invoice) => (
                    <tr key={invoice.MaHD} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-medium text-gray-800">{invoice.MaHD}</td>
                      <td className="p-4">{formatDate(invoice.NgayThanhToan)}</td>
                      <td className="p-4">{getPaymentMethodIcon(invoice.PTTT)}</td>
                      <td className="p-4 text-right font-bold text-gray-800">{formatCurrency(invoice.ThanhTien)}</td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={() => navigate(`/admin/invoices/${invoice.MaHD}`)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors"
                          >
                            <Eye size={14} /> Xem chi tiết
                          </button>
                          <button 
                            onClick={() => window.open(`/admin/invoices/${invoice.MaHD}/print`, '_blank')}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-100 rounded transition-colors"
                          >
                            <Printer size={14} /> In hóa đơn
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
