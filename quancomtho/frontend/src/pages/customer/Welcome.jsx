import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Utensils, AlertCircle, Loader2, QrCode } from 'lucide-react';
import { fetchTable } from '../../services/customerApi';

const Welcome = () => {
  const navigate = useNavigate();
  const { maBan } = useParams();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState({});
  const [tableInfo, setTableInfo] = useState(null);
  const [tableLoading, setTableLoading] = useState(false);
  const [tableError, setTableError] = useState('');

  // Kiểm tra bàn khi vào trang nếu có maBan từ URL
  useEffect(() => {
    if (maBan) {
      setTableLoading(true);
      setTableError('');
      fetchTable(maBan)
        .then((data) => {
          if (data.success) {
            setTableInfo(data.data);
          } else {
            setTableError('Không tìm thấy thông tin bàn này. Vui lòng quét lại mã QR.');
          }
        })
        .catch(() => setTableError('Không tìm thấy thông tin bàn này. Vui lòng quét lại mã QR.'))
        .finally(() => setTableLoading(false));
    }
  }, [maBan]);

  const validate = () => {
    const newErrors = {};
    if (!name.trim()) {
      newErrors.name = 'Vui lòng nhập tên của bạn.';
    }
    if (!phone.trim() || !/^0\d{9}$/.test(phone.trim())) {
      newErrors.phone = 'Số điện thoại là bắt buộc và phải đúng 10 chữ số, bắt đầu bằng 0.';
    }
    return newErrors;
  };

  const handleStart = () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Lưu thông tin khách vào localStorage
    localStorage.setItem('customer_name', name.trim());
    localStorage.setItem('customer_phone', phone.trim());
    localStorage.setItem('customer_maBan', maBan);

    // Chuyển sang trang menu – luôn đi kèm maBan
    navigate(`/order/${maBan}/menu`);
  };

  // Tính lời chào theo giờ
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return 'Chào buổi sáng.';
    if (hour < 14) return 'Chào buổi trưa.';
    if (hour < 18) return 'Chào buổi chiều.';
    return 'Chào buổi tối.';
  };

  // ⚠️ Nếu không có maBan trong URL → yêu cầu quét QR
  if (!maBan) {
    return (
      <div className="flex flex-col h-full bg-[#fdfbf7] items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <QrCode size={40} className="text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-3">Vui lòng quét mã QR</h2>
        <p className="text-gray-500 text-sm leading-relaxed">
          Để đặt món, bạn cần quét <strong>mã QR trên bàn</strong> của mình bằng camera điện thoại.
        </p>
        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700 text-left">
          <p className="font-bold mb-1">Hướng dẫn:</p>
          <p>📷 Mở camera → Quét mã QR trên bàn → Trang này sẽ tự mở với thông tin bàn của bạn.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#fdfbf7]">
      {/* Header */}
      <div className="flex items-center p-5 bg-[#cc2027] text-white border-b border-red-700 shadow-sm">
        <img 
          src="/images/logo.png" 
          alt="Cơm Thố Anh Nguyễn" 
          className="w-12 h-12 rounded-full object-cover mr-3 shadow-md flex-shrink-0 border-2 border-white"
        />
        <div>
          <h1 className="font-bold text-lg text-white tracking-tight">Cơm Thố Anh Nguyễn</h1>
          <p className="text-xs text-white/80 uppercase tracking-wider font-medium">Bữa ăn chất lượng</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8">
        {/* Hero Image */}
        <div className="w-full h-64 rounded-2xl overflow-hidden mb-8 shadow-md">
          <img
            src="/images/com-tho-xa-xiu.png"
            alt="Cơm thố xá xíu Anh Nguyễn"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Table Info */}
        {tableLoading && (
          <div className="flex items-center justify-center gap-2 text-gray-400 mb-4">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">Đang tải thông tin bàn...</span>
          </div>
        )}
        {tableInfo && (
          <p className="text-center text-sm text-gray-500 mb-2 uppercase tracking-widest font-medium">
            {tableInfo.TenBan}
          </p>
        )}
        {tableError && (
          <div className="flex items-center gap-2 text-red-500 bg-red-50 border border-red-100 rounded-xl p-3 mb-4 text-sm">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{tableError}</span>
          </div>
        )}

        {/* Greetings */}
        <div className="text-center mb-8">
          <h2 className="text-4xl text-gray-800 mb-3 font-serif italic">{getGreeting()}</h2>
          <p className="text-gray-600 text-sm">Cùng chọn thố cơm hợp gu của bạn.</p>
        </div>

        {/* Inputs */}
        <div className="space-y-4 mb-8">
          <div>
            <input
              type="text"
              placeholder="Nhập tên của bạn *"
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })); }}
              className={`w-full px-5 py-4 rounded-xl bg-gray-100 text-center text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${errors.name ? 'ring-2 ring-red-300 bg-red-50' : 'focus:ring-primary/20'}`}
            />
            {errors.name && (
              <p className="text-red-500 text-xs text-center mt-1.5">{errors.name}</p>
            )}
          </div>

          <div>
            <input
              type="tel"
              placeholder="Số điện thoại *"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setErrors(p => ({ ...p, phone: '' })); }}
              className={`w-full px-5 py-4 rounded-xl bg-gray-100 text-center text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${errors.phone ? 'ring-2 ring-red-300 bg-red-50' : 'focus:ring-primary/20'}`}
            />
            {errors.phone && (
              <p className="text-red-500 text-xs text-center mt-1.5">{errors.phone}</p>
            )}
          </div>

          <p className="text-xs text-center text-gray-400">
            Số điện thoại <span className="font-semibold text-gray-600">bắt buộc</span> phải gồm <span className="font-semibold text-gray-600">đúng 10 chữ số, bắt đầu bằng 0</span>.
          </p>
        </div>

        {/* Button */}
        <button
          onClick={handleStart}
          disabled={tableLoading || !!tableError}
          className={`w-full font-semibold text-lg py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group active:scale-[0.98] ${
            tableLoading || tableError
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
              : 'bg-primary hover:bg-primaryDark text-white shadow-primary/30'
          }`}
        >
          Bắt đầu gọi món
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </button>
      </div>
    </div>
  );
};

export default Welcome;
