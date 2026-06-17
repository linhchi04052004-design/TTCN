import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QrCode, Users, Armchair, LayoutGrid, Clock, Printer, X, Link as LinkIcon, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import Sidebar from '../components/Sidebar';
import { buildApiUrl } from '../config';

export default function Tables() {
  const [tables, setTables] = useState([]);
  const [stats, setStats] = useState({ total: 0, empty: 0, occupied: 0 });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const editedCapacitiesRef = useRef({});

  const showMessage = useCallback((type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  }, []);
  
  // QR generation state
  // QR URL trỏ về IP thực của máy tính (cùng port với app đang chạy)
  const getDefaultQrBase = () => {
    if (window.location.hostname === 'localhost') {
      // Dùng IP thực và ĐÚNG port đang chạy để điện thoại quét được
      return `http://192.168.1.4:${window.location.port || 5173}`;
    }
    return window.location.origin;
  };
  const [qrBaseUrl, setQrBaseUrl] = useState(getDefaultQrBase());
  const [selectedTableForQR, setSelectedTableForQR] = useState(null);

  const fetchTables = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(buildApiUrl('/admin/tables'));
      const result = await res.json();
      if (result.success) {
        setTables(result.data.tables.map(table => ({
          ...table,
          SucChua: Object.prototype.hasOwnProperty.call(editedCapacitiesRef.current, table.MaBan)
            ? editedCapacitiesRef.current[table.MaBan]
            : table.SucChua,
        })));
        setStats(result.data.stats);
      }
    } catch (error) {
      console.error('Lỗi lấy danh sách bàn:', error);
      if (!silent) {
        showMessage('error', 'Không thể tải dữ liệu bàn. Vui lòng thử lại sau.');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [showMessage]);

  useEffect(() => {
    fetchTables();
    const refreshInterval = setInterval(() => {
      fetchTables({ silent: true });
    }, 3000);

    return () => clearInterval(refreshInterval);
  }, [fetchTables]);

  const handleCapacityChange = (maBan, value) => {
    editedCapacitiesRef.current[maBan] = value;
    setTables(tables.map(table => 
      table.MaBan === maBan ? { ...table, SucChua: value } : table
    ));
  };

  const handleSaveCapacity = async (maBan, newCapacity) => {
    try {
      const res = await fetch(buildApiUrl(`/admin/tables/${maBan}/capacity`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ SucChua: newCapacity })
      });
      const result = await res.json();
      
      if (result.success) {
        delete editedCapacitiesRef.current[maBan];
        showMessage('success', `Cập nhật thành công sức chứa cho bàn ${maBan}`);
        fetchTables({ silent: true });
      } else {
        showMessage('error', result.message || 'Có lỗi xảy ra khi cập nhật.');
      }
    } catch (error) {
      console.error('Lỗi cập nhật sức chứa:', error);
      showMessage('error', 'Lỗi kết nối máy chủ. Vui lòng thử lại.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex h-screen bg-stone-100 text-gray-800 font-sans overflow-hidden">
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8 relative print:p-0 print:overflow-visible print:bg-white print:h-auto print:w-full">
        
        {/* Toast Notification */}
        {message.text && (
          <div className="fixed top-8 right-8 px-6 py-3 rounded-lg shadow-lg font-medium z-50 transition-opacity bg-green-100 text-green-800 border border-green-200 print:hidden">
            {message.text}
          </div>
        )}

        <div className="print:hidden">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold mb-1">Bàn và QR</h1>
              <p className="text-gray-500 text-sm">Quản lý danh sách bàn và xuất mã QR</p>
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-600 shadow-sm">
                <Clock size={16} className="text-gray-400" />
                <span>{format(new Date(), 'dd/MM/yyyy')}</span>
              </div>
            </div>
          </div>
          


          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-5">
              <div className="bg-green-50 text-green-600 p-4 rounded-full">
                <Armchair size={28} />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-800 mb-1">Bàn trống</div>
                <div className="text-3xl font-bold text-green-600">{stats.empty}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {stats.total > 0 ? Math.round((stats.empty / stats.total) * 100) : 0}% tổng số bàn
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-5">
              <div className="bg-red-50 text-red-600 p-4 rounded-full">
                <Users size={28} />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-800 mb-1">Bàn có khách</div>
                <div className="text-3xl font-bold text-red-600">{stats.occupied}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {stats.total > 0 ? Math.round((stats.occupied / stats.total) * 100) : 0}% tổng số bàn
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-5">
              <div className="bg-indigo-50 text-indigo-600 p-4 rounded-full">
                <LayoutGrid size={28} />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-800 mb-1">Tổng số bàn</div>
                <div className="text-3xl font-bold text-indigo-600">{stats.total}</div>
                <div className="text-xs text-gray-500 mt-1">100% tổng số bàn</div>
              </div>
            </div>
          </div>

          {/* Grid Cards - Tables */}
          {loading ? (
            <div className="flex justify-center items-center h-64 text-gray-500">Đang tải dữ liệu...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {tables.map(table => {
                const qrUrl = `${qrBaseUrl.replace(/\/$/, '')}/order/${table.MaBan}`;
                return (
                <div key={table.MaBan} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col hover:border-blue-200 transition-colors">
                  <div className="p-6 flex-1 flex flex-col relative">
                    
                    {/* Top row: Name & Badge & QR */}
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-lg font-bold text-gray-800">{table.MaBan}</span>
                          {table.TrangThai === 'Trống' ? (
                            <span className="bg-green-50 text-green-600 text-xs font-bold px-2 py-1 rounded">Trống</span>
                          ) : (
                            <span className="bg-red-50 text-red-600 text-xs font-bold px-2 py-1 rounded">Có khách</span>
                          )}
                        </div>
                        <div className="text-sm font-medium text-gray-600">{table.TenBan}</div>
                      </div>
                      
                      {/* Mini QR Preview */}
                      <div className="flex flex-col items-center">
                        <div 
                          onClick={() => setSelectedTableForQR(table)}
                          className="w-14 h-14 bg-white border border-gray-200 rounded p-1 flex items-center justify-center mb-1 cursor-pointer hover:border-blue-500 transition-colors group relative"
                        >
                          <QRCodeSVG value={qrUrl} size={44} level="M" />
                          <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <QrCode size={20} className="text-blue-600" />
                          </div>
                        </div>
                        <span className="text-[10px] text-blue-600 font-medium max-w-[60px] text-center leading-tight cursor-pointer hover:underline" onClick={() => setSelectedTableForQR(table)}>
                          Xem mã QR
                        </span>
                      </div>
                    </div>

                    {/* Mid row: Status */}
                    <div className="mb-4">
                      <label className="block text-xs text-gray-500 mb-1">Trạng thái hiện tại</label>
                      <div className="font-medium text-sm">
                        {table.TrangThai === 'Trống' ? (
                           <span className="text-green-600 font-bold">{table.TrangThai}</span>
                        ) : (
                           <span className="text-red-600 font-bold">{table.TrangThai}</span>
                        )}
                      </div>
                    </div>

                    {/* Bottom row: Capacity Input */}
                    <div className="mt-auto">
                      <label className="block text-xs text-gray-500 mb-1">Sức chứa (người)</label>
                      <input 
                        type="number" 
                        value={table.SucChua || ''}
                        onChange={(e) => handleCapacityChange(table.MaBan, e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:border-red-500 transition-colors"
                        min="1"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="border-t border-gray-100 bg-gray-50">
                    <button 
                      onClick={() => handleSaveCapacity(table.MaBan, table.SucChua)}
                      className="w-full text-white bg-[#cc2027] hover:bg-[#b21b21] font-bold py-3 text-sm transition-colors text-center"
                    >
                      Lưu thay đổi
                    </button>
                  </div>
                </div>
              )})}
            </div>
          )}
        </div>

        {/* QR CODE POSTER MODAL (Hidden in print if not selected, visible in print if selected) */}
        {selectedTableForQR && (
          <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm print:static print:bg-white print:p-0 print:block">
            
            {/* Action Bar (Hidden in Print) */}
            <div className="absolute top-4 right-4 flex gap-3 print:hidden">
              <button 
                onClick={handlePrint}
                className="bg-white text-gray-800 px-4 py-2 rounded-lg shadow-lg font-bold flex items-center gap-2 hover:bg-gray-50 transition-colors"
              >
                <Printer size={18} /> In Poster
              </button>
              <button 
                onClick={() => setSelectedTableForQR(null)}
                className="bg-white/20 text-white hover:bg-white/30 p-2 rounded-lg backdrop-blur-sm transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Poster Container */}
            <div className="bg-[#fcfaf5] w-full max-w-[350px] rounded-[30px] shadow-2xl overflow-hidden relative print:shadow-none print:max-w-none print:w-screen print:h-screen print:rounded-none">
              
              {/* Red Header */}
              <div className="bg-[#cc2027] pt-8 pb-20 px-6 text-center relative z-0">
                <img 
                  src="/images/logo.png" 
                  alt="Logo Cơm Thố Anh Nguyễn" 
                  className="w-12 h-12 rounded-full object-cover mx-auto mb-3 shadow-md border-2 border-white"
                />
                <h2 className="text-white font-bold text-xl tracking-wide mb-1">Cơm Thố Anh Nguyễn</h2>
                <p className="text-white/80 text-[10px] tracking-[0.2em] font-medium uppercase">Quét • Gọi Món • Thưởng Thức</p>
              </div>

              {/* White Card Overlay */}
              <div className="bg-white rounded-[30px] mx-3 -mt-14 relative z-10 pt-6 pb-6 px-5 shadow-lg flex flex-col items-center print:mx-auto print:max-w-[320px] print:mt-8 print:border print:border-gray-200">
                
                <p className="text-gray-400 text-[10px] tracking-widest uppercase font-medium mb-1">Bàn của bạn</p>
                <h1 className="text-3xl font-black text-gray-900 mb-0.5">{selectedTableForQR.TenBan}</h1>
                <p className="text-[#cc2027] font-bold text-xs mb-4">{selectedTableForQR.MaBan}</p>

                {/* QR Box */}
                <div className="bg-white p-3 rounded-2xl shadow-[0_6px_20px_rgb(0,0,0,0.06)] border border-gray-100 mb-4">
                  <QRCodeSVG 
                    value={`${qrBaseUrl.replace(/\/$/, '')}/order/${selectedTableForQR.MaBan}`} 
                    size={160} 
                    level="H"
                    includeMargin={false}
                  />
                </div>

                <h3 className="text-base font-bold text-gray-800 mb-4">
                  <span className="text-[#cc2027]">Quét mã</span> để gọi món
                </h3>

                {/* Steps */}
                <div className="flex justify-between w-full gap-2 mb-4">
                  <div className="flex flex-col items-center text-center flex-1">
                    <div className="w-6 h-6 rounded-full bg-red-50 text-[#cc2027] font-bold text-xs flex items-center justify-center mb-1">1</div>
                    <p className="text-[10px] text-gray-500 leading-tight">Mở camera<br/>điện thoại</p>
                  </div>
                  <div className="flex flex-col items-center text-center flex-1">
                    <div className="w-6 h-6 rounded-full bg-red-50 text-[#cc2027] font-bold text-xs flex items-center justify-center mb-1">2</div>
                    <p className="text-[10px] text-gray-500 leading-tight">Quét mã QR<br/>phía trên</p>
                  </div>
                  <div className="flex flex-col items-center text-center flex-1">
                    <div className="w-6 h-6 rounded-full bg-red-50 text-[#cc2027] font-bold text-xs flex items-center justify-center mb-1">3</div>
                    <p className="text-[10px] text-gray-500 leading-tight">Chọn món &<br/>gọi ngay</p>
                  </div>
                </div>

                {/* Footer Info */}
                <div className="w-full border-t border-dashed border-gray-200 pt-4 text-center">
                  <p className="font-bold text-gray-800 text-xs mb-0.5">Cơm Thố Anh Nguyễn</p>
                  <p className="text-[10px] text-gray-500">Món ngon chuẩn vị - Phục vụ tận tình</p>
                </div>
              </div>
              
              {/* Bottom Spacer */}
              <div className="h-8 bg-[#fcfaf5]"></div>
            </div>
          </div>
        )}
      </div>
      
      {/* Hide Sidebar and everything else when printing */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block, .print\\:block * {
            visibility: visible;
          }
          .print\\:block {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: 100% !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            background: white !important;
          }
        }
      `}} />
    </div>
  );
}
