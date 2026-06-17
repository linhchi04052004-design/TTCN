import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, Download, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { buildApiUrl } from '../config';

export default function InvoicePrint() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState({ invoice: null, items: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoiceDetail = async () => {
      try {
        const res = await fetch(buildApiUrl(`/admin/invoices/${id}`));
        const result = await res.json();
        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error('Lỗi lấy chi tiết hóa đơn để in:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoiceDetail();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-gray-900 text-white text-xl">Đang chuẩn bị trang in...</div>;
  }

  const { invoice, items } = data;

  if (!invoice) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white flex-col">
        <div className="text-xl mb-4">Không tìm thấy dữ liệu hóa đơn để in.</div>
        <button onClick={() => navigate('/admin/invoices')} className="text-blue-400 hover:underline">Quay lại</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#333333] flex justify-center py-12 px-4 print:bg-white print:py-0 print:px-0">
      {/* Nút hành động - Ẩn khi in */}
      <div className="fixed right-8 top-12 flex flex-col gap-3 print:hidden w-48">
        <button 
          onClick={handlePrint}
          className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-3 rounded font-bold hover:bg-red-700 shadow-lg"
        >
          <Printer size={18} /> In hóa đơn
        </button>
      </div>

      {/* Vùng Hóa đơn - Vùng sẽ được in */}
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-[400px] text-gray-800 print:shadow-none print:w-full print:max-w-none print:p-0 print:rounded-none">
        
        {/* Header hóa đơn */}
        <div className="text-center mb-6">
          <img src="/images/logo.png" alt="Cơm Thố Anh Nguyễn" className="w-16 h-16 rounded-full object-cover mx-auto mb-2 print:w-14 print:h-14" />
          <h1 className="font-bold text-xl text-red-600 mb-1">CƠM THỐ ANH NGUYỄN</h1>
          <p className="text-sm text-gray-600">
            Số 1 Hồ Đắc Di - Đống Đa - Hà Nội<br/>(Cạnh Hồ Đắc Di)
          </p>
          <p className="text-sm text-gray-600 font-medium mt-1">Hotline: 1900 1234</p>
        </div>

        <h2 className="text-center font-bold text-lg mb-6 uppercase border-b-2 border-dashed border-gray-300 pb-4">
          Hóa đơn thanh toán
        </h2>

        {/* Thông tin chung */}
        <div className="text-sm space-y-1 mb-4 border-b border-dashed border-gray-300 pb-4">
          <div className="flex justify-between">
            <span className="font-medium">Mã hóa đơn:</span>
            <span>{invoice.MaHD}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Mã đơn hàng:</span>
            <span>{invoice.MaDH}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Ngày thanh toán:</span>
            <span>{formatDate(invoice.NgayThanhToan)}</span>
          </div>
        </div>

        {/* Thông tin khách */}
        <div className="text-sm space-y-1 mb-6 border-b border-dashed border-gray-300 pb-4">
          <div className="flex justify-between">
            <span className="font-medium">Khách hàng:</span>
            <span>{invoice.TenKhach || 'Khách lẻ'}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Số điện thoại:</span>
            <span>{invoice.SDT || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Phương thức TT:</span>
            <span>{invoice.PTTT}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Hình thức:</span>
            <span>{invoice.HinhThuc || 'Tại bàn'}</span>
          </div>
        </div>

        {/* Bảng chi tiết */}
        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-b border-dashed border-gray-300">
              <th className="text-left py-2 font-bold uppercase text-[11px] w-2/5">Tên món</th>
              <th className="text-center py-2 font-bold uppercase text-[11px] w-1/5">SL</th>
              <th className="text-right py-2 font-bold uppercase text-[11px] w-1/5">Đơn giá</th>
              <th className="text-right py-2 font-bold uppercase text-[11px] w-1/5">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} className="border-b border-dashed border-gray-200 last:border-0">
                <td className="py-2">{item.TenMonAn}</td>
                <td className="py-2 text-center">{item.SoLuong}</td>
                <td className="py-2 text-right">{new Intl.NumberFormat('vi-VN').format(item.DonGia)}</td>
                <td className="py-2 text-right font-medium">{new Intl.NumberFormat('vi-VN').format(item.TongTien)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Tổng tiền */}
        <div className="border-t-2 border-dashed border-gray-300 pt-4 mb-8">
          <div className="flex justify-between items-center">
            <span className="font-bold text-lg uppercase">Tổng cộng</span>
            <span className="font-bold text-xl text-red-600">{formatCurrency(invoice.ThanhTien)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm font-medium italic border-t border-dashed border-gray-300 pt-4 pb-2">
          Cảm ơn quý khách! Hẹn gặp lại!
        </div>

      </div>
    </div>
  );
}
