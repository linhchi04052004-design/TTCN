import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Check, Clock } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { buildApiUrl } from '../config';

export default function PaymentSuccess() {
  const { maHD } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoice();
  }, [maHD]);

  const fetchInvoice = async () => {
    try {
      const res = await fetch(buildApiUrl(`/admin/invoices/${maHD}`));
      const result = await res.json();
      if (result.success) {
        setInvoice(result.data.invoice);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.open(`/admin/invoices/${maHD}/print`, '_blank');
  };

  if (loading) return <div className="flex h-screen bg-[#F8F9FA] items-center justify-center">Đang tải...</div>;
  if (!invoice) return <div className="flex h-screen bg-[#F8F9FA] items-center justify-center">Không tìm thấy hóa đơn.</div>;

  return (
    <div className="flex h-screen bg-[#F8F9FA] text-gray-800 font-sans overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto p-8 relative items-center justify-center">
        <div className="absolute top-8 right-8 flex items-center gap-3 text-sm">
          <div className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-600 shadow-sm">
            <Clock size={16} className="text-gray-400" />
            <span>{format(new Date(), 'dd/MM/yyyy')}</span>
          </div>
          <div className="bg-[#c23531] text-white px-3 py-1.5 rounded-lg font-medium shadow-sm">
            superadmin
          </div>
        </div>

        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-[#385e3c] rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Check size={48} className="text-white" strokeWidth={3} />
          </div>
          <h1 className="text-3xl font-bold text-[#385e3c]">Thanh toán thành công!</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 w-full max-w-md print:shadow-none print:border-none">
          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 font-medium">Mã hóa đơn</span>
              <span className="font-bold text-gray-800">{invoice.MaHD}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 font-medium">Tổng tiền</span>
              <span className="font-bold text-gray-800">{parseFloat(invoice.ThanhTien).toLocaleString('vi-VN')}đ</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 font-medium">Ngày thanh toán</span>
              <span className="font-bold text-gray-800">
                {invoice.NgayThanhToan ? format(new Date(invoice.NgayThanhToan), 'dd/MM/yyyy - HH:mm') : format(new Date(), 'dd/MM/yyyy - HH:mm')}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 font-medium">Phương thức</span>
              <span className="font-bold text-gray-800">{invoice.PTTT || 'Tiền mặt'}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 print:hidden">
            <button 
              onClick={handlePrint}
              className="bg-[#c23531] hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors shadow-sm"
            >
              In hóa đơn
            </button>
            <button 
              onClick={() => navigate('/admin/orders')}
              className="bg-white border border-[#c23531] hover:bg-red-50 text-[#c23531] font-bold py-3 rounded-lg transition-colors shadow-sm"
            >
              Quay về danh sách
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
