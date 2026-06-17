import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function CancelOrderPopup({ order, onClose, onConfirm }) {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden relative animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
            <AlertTriangle size={32} className="text-[#c23531]" strokeWidth={2.5} />
          </div>

          <h2 className="text-xl font-bold text-gray-800 mb-6 px-4">
            Bạn có chắc chắn muốn hủy đơn hàng này không?
          </h2>

          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left border border-gray-100">
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="text-gray-500">Mã đơn hàng:</span>
              <span className="font-bold text-gray-800">{order.MaDH}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Vị trí:</span>
              <span className="font-bold text-gray-800">{order.ban_an ? order.ban_an.TenBan : 'Mang về'}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={onClose}
              className="py-3 px-4 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 font-bold rounded-xl transition-colors shadow-sm"
            >
              Hủy
            </button>
            <button 
              onClick={() => onConfirm(order.MaDH)}
              className="py-3 px-4 bg-[#c23531] hover:bg-red-700 text-white font-bold rounded-xl transition-colors shadow-sm"
            >
              Xác nhận hủy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
