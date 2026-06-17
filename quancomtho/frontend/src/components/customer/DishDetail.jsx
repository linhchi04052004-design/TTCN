import { X, Minus, Plus } from 'lucide-react';
import { useState } from 'react';

const DishDetail = ({ dish, getImage, onClose, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');

  if (!dish) return null;

  const price = Number(dish.DonGia);

  const handleAdd = () => {
    onAddToCart({
      MaMonAn: dish.MaMonAn,
      TenMonAn: dish.TenMonAn,
      DonGia: price,
      HinhAnh: dish.HinhAnh,
      MaDanhMuc: dish.MaDanhMuc,
      quantity,
      GhiChu: note.trim(),
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-[480px] bg-[#fdfbf7] rounded-t-3xl overflow-hidden flex flex-col max-h-[92vh] animate-[slideUp_0.3s_ease-out]">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-gray-700 shadow-sm"
        >
          <X size={18} />
        </button>

        <div className="overflow-y-auto pb-28">
          {/* Image */}
          <div className="w-full h-64 bg-gray-100 flex-shrink-0">
            <img
              src={getImage(dish)}
              alt={dish.TenMonAn}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="p-6">
            {/* Name & Price */}
            <div className="flex justify-between items-start mb-2 gap-4">
              <h2 className="text-2xl font-bold text-gray-800 flex-1">{dish.TenMonAn}</h2>
              <span className="text-xl font-bold text-primary whitespace-nowrap">
                {price.toLocaleString('vi-VN')}đ
              </span>
            </div>

            {/* Description */}
            {dish.MoTa && (
              <p className="text-gray-500 text-sm mb-5 leading-relaxed">{dish.MoTa}</p>
            )}

            {/* Note */}
            <div className="mb-5">
              <h3 className="font-bold text-gray-800 text-base mb-3">Ghi chú thêm</h3>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="VD: nhiều cơm, ít dầu mỡ, không hành..."
                className="w-full bg-gray-100 rounded-2xl p-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[90px] resize-none text-sm"
              />
            </div>

            {/* Quantity */}
            <div className="flex items-center justify-between bg-gray-100 rounded-2xl p-4">
              <span className="font-bold text-gray-800">Số lượng</span>
              <div className="flex items-center gap-4 bg-white rounded-xl px-3 py-1.5 shadow-sm">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-7 h-7 flex items-center justify-center text-gray-700 hover:text-primary transition-colors"
                >
                  <Minus size={16} />
                </button>
                <span className="font-bold w-5 text-center text-gray-800">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-7 h-7 flex items-center justify-center text-gray-700 hover:text-primary transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-primary p-4 pb-6">
          <button
            onClick={handleAdd}
            className="w-full flex justify-between items-center px-5"
          >
            <div className="text-left">
              <p className="text-white/70 text-xs">Tổng tiền</p>
              <p className="text-white font-bold text-xl">{(price * quantity).toLocaleString('vi-VN')}đ</p>
            </div>
            <span className="bg-white text-primary font-bold px-6 py-3 rounded-xl text-base hover:bg-gray-50 transition-colors">
              Thêm vào giỏ
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DishDetail;
