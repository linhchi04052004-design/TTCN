import React from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

export default function MockQRPayment() {
  const { method, amount, orderId } = useParams();

  const isMomo = method.toLowerCase() === 'momo';
  const bgColor = isMomo ? 'bg-[#ae2070]' : 'bg-[#005ba6]';
  const logo = isMomo ? 'MoMo' : 'VNPay';
  
  const paymentData = JSON.stringify({
    method,
    amount: parseInt(amount, 10),
    orderId,
    timestamp: new Date().toISOString()
  });

  return (
    <div className={`min-h-screen ${bgColor} flex flex-col items-center justify-center p-4 font-sans text-white`}>
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center text-gray-800">
        <h1 className="text-2xl font-bold mb-1" style={{ color: isMomo ? '#ae2070' : '#005ba6' }}>
          Thanh toán {logo}
        </h1>
        <p className="text-sm text-gray-500 mb-6">Môi trường thử nghiệm (Sandbox)</p>
        
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6 flex justify-center">
          <QRCodeSVG 
            value={paymentData}
            size={200}
            level={"H"}
            includeMargin={true}
          />
        </div>

        <div className="space-y-3 text-left bg-gray-50 p-4 rounded-xl text-sm mb-6">
          <div className="flex justify-between border-b border-gray-200 pb-2">
            <span className="text-gray-500">Mã đơn hàng:</span>
            <span className="font-bold">{orderId}</span>
          </div>
          <div className="flex justify-between border-b border-gray-200 pb-2">
            <span className="text-gray-500">Số tiền:</span>
            <span className="font-bold text-red-600 text-lg">
              {parseInt(amount, 10).toLocaleString('vi-VN')}đ
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Người nhận:</span>
            <span className="font-bold">Quán Cơm Thớ</span>
          </div>
        </div>

        <p className="text-xs text-gray-400 italic">
          Vui lòng dùng ứng dụng {logo} để quét mã này.<br/>
          (Đây là trang mô phỏng, sau khi xem xong bạn có thể đóng tab này lại)
        </p>
      </div>
    </div>
  );
}
