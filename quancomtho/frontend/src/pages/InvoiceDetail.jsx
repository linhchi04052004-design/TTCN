import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import Sidebar from '../components/Sidebar';
import { buildApiUrl } from '../config';

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState({ invoice: null, items: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoiceDetail();
  }, [id]);

  const fetchInvoiceDetail = async () => {
    try {
      const res = await fetch(buildApiUrl(`/admin/invoices/${id}`));
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Lỗi lấy chi tiết hóa đơn:', error);
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

  if (loading) {
    return (
      <div className="flex h-screen bg-stone-100 font-sans">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center text-gray-500 text-lg">Đang tải dữ liệu...</div>
      </div>
    );
  }

  const { invoice, items } = data;

  if (!invoice) {
    return (
      <div className="flex h-screen bg-stone-100 font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
          <div className="text-4xl mb-4">📄</div>
          <div className="text-xl font-medium mb-4">Không tìm thấy hóa đơn</div>
          <button onClick={() => navigate('/admin/invoices')} className="text-red-600 hover:underline">Quay lại danh sách</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-stone-100 text-gray-800 font-sans overflow-hidden">
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {/* Header Actions */}
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => navigate('/admin/invoices')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            <ArrowLeft size={20} /> Chi tiết hóa đơn
          </button>
          <button 
            onClick={() => window.open(`/admin/invoices/${id}/print`, '_blank')}
            className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-red-700 transition-colors shadow-sm"
          >
            <Printer size={18} /> In hóa đơn
          </button>
        </div>

        {/* Invoice Info Frame */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-6 border-b border-gray-100 pb-4">Thông tin hóa đơn</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Mã hóa đơn</div>
                <div className="font-bold text-red-600 text-lg">{invoice.MaHD}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Mã đơn hàng</div>
                <div className="font-bold text-gray-800">{invoice.MaDH}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Ngày thanh toán</div>
                <div className="font-medium text-gray-800">{formatDate(invoice.NgayThanhToan)}</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Tên khách</div>
                <div className="font-medium text-gray-800">{invoice.TenKhach || 'Khách lẻ'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Số điện thoại</div>
                <div className="font-medium text-gray-800">{invoice.SDT || '-'}</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Phương thức thanh toán</div>
                <div className="flex items-center gap-2 font-medium text-gray-800">
                  <div className="w-8 h-5 bg-red-100 text-red-600 rounded flex items-center justify-center text-xs border border-red-200">
                    💵
                  </div>
                  {invoice.PTTT}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Hình thức</div>
                <div className="flex items-center gap-2 font-medium text-gray-800">
                  <MapPin size={16} className="text-gray-400" /> {invoice.HinhThuc || 'Tại bàn'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items Frame */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
          <h2 className="text-lg font-bold text-gray-800 mb-6 border-b border-gray-100 pb-4">Chi tiết món</h2>
          
          <table className="w-full text-left text-sm text-gray-600 mb-6">
            <thead className="border-b border-gray-100">
              <tr>
                <th className="pb-3 font-medium uppercase text-xs">Tên món</th>
                <th className="pb-3 font-medium uppercase text-xs text-center">Số lượng</th>
                <th className="pb-3 font-medium uppercase text-xs text-right">Đơn giá</th>
                <th className="pb-3 font-medium uppercase text-xs text-right">Thành tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-4 font-medium text-gray-800">{item.TenMonAn}</td>
                  <td className="py-4 text-center">{item.SoLuong}</td>
                  <td className="py-4 text-right">{formatCurrency(item.DonGia)}</td>
                  <td className="py-4 text-right font-medium text-gray-800">{formatCurrency(item.TongTien)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <div className="flex items-center gap-12">
              <div className="font-bold text-gray-800 text-lg">Tổng cộng</div>
              <div className="font-bold text-red-600 text-3xl">{formatCurrency(invoice.ThanhTien)}</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
