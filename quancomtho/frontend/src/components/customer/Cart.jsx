import { X, Trash2, Plus, Minus } from 'lucide-react';

const Cart = ({ items, sideDishes, getImage, onClose, onUpdateQuantity, onRemove, onCheckout, onAddSideDish }) => {
  const totalAmount = items.reduce((sum, item) => sum + item.DonGia * item.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300">
      <div className="absolute inset-0" onClick={onClose}></div>
      
      <div className="relative w-full max-w-[480px] bg-[#fdfbf7] rounded-t-3xl flex flex-col max-h-[90vh] animate-[slideUp_0.3s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white rounded-t-3xl">
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-1">Giỏ hàng</p>
            <h2 className="text-2xl font-bold text-gray-800">Món đã chọn</h2>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* Item List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {items.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              <p>Giỏ hàng đang trống.</p>
            </div>
          ) : (
            items.map((item, index) => (
              <div key={index} className="flex gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-50">
                <img src={getImage ? getImage(item) : item.HinhAnh} alt={item.TenMonAn} className="w-20 h-20 rounded-xl object-cover" />
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-gray-800 text-sm">{item.TenMonAn}</h3>
                      <button onClick={() => onRemove(index)} className="text-gray-400 hover:text-red-500">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    {item.GhiChu && <p className="text-xs text-gray-500 mt-1 italic">{item.GhiChu}</p>}
                    <p className="text-primary font-bold text-sm mt-1">{(item.DonGia * item.quantity).toLocaleString('vi-VN')}đ</p>
                  </div>
                  
                  <div className="flex items-center gap-3 self-end bg-gray-100 rounded-lg px-2 py-1 mt-2">
                    <button 
                      onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                      className="text-gray-800"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                    <button 
                      onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                      className="text-gray-800"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Side dishes suggestion */}
          {sideDishes && sideDishes.length > 0 && items.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4">Gợi ý dùng kèm</h3>
              <div className="flex overflow-x-auto hide-scrollbar gap-4 pb-2">
                {sideDishes.map(dish => (
                  <div key={dish.MaMonAn} className="min-w-[140px] bg-white rounded-xl shadow-sm border border-gray-50 overflow-hidden">
                    <img src={getImage ? getImage(dish) : dish.HinhAnh} alt={dish.TenMonAn} className="w-full h-24 object-cover" />
                    <div className="p-3">
                      <h4 className="font-bold text-sm text-gray-800 line-clamp-1 mb-1">{dish.TenMonAn}</h4>
                      <p className="text-primary text-sm font-bold mb-2">{Number(dish.DonGia).toLocaleString('vi-VN')}đ</p>
                      <button 
                        onClick={() => onAddSideDish(dish)}
                        className="w-full py-1.5 text-xs font-bold text-primary bg-red-50 rounded-lg hover:bg-primary hover:text-white transition-colors"
                      >
                        Thêm
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-6 bg-white border-t border-gray-100 pb-8">
            <div className="flex justify-between items-center mb-4 text-lg">
              <span className="text-gray-600">Tổng cộng</span>
              <span className="font-bold text-2xl text-gray-800">{totalAmount.toLocaleString('vi-VN')}đ</span>
            </div>
            <button 
              onClick={onCheckout}
              className="w-full bg-primary hover:bg-primaryDark text-white font-medium text-lg py-4 rounded-xl shadow-lg shadow-primary/30 active:scale-[0.98] transition-all"
            >
              Xác nhận giỏ hàng
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
