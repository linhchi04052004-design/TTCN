import { Link } from 'react-router-dom';

export default function CashierDashboard() {
  return (
    <div className="bg-gray-100 flex h-screen">
      <div className="w-64 bg-gray-800 text-white p-5 flex flex-col gap-4">
        <h2 className="text-xl font-bold mb-4 text-red-500">Thu Ngân Panel</h2>
        <a href="#" className="hover:text-red-400">Đơn hàng</a>
        <a href="#" className="hover:text-red-400">Hóa đơn</a>
        <a href="#" className="hover:text-red-400">Bàn và QR</a>
      </div>
      <div className="flex-1 p-10">
        <h1 className="text-3xl font-bold">Chào mừng Thu Ngân!</h1>
        <p className="mt-4">Bạn có quyền quản lý đơn hàng, hóa đơn và bàn.</p>
        <Link to="/" className="mt-4 inline-block text-red-600 underline">Đăng xuất</Link>
      </div>
    </div>
  );
}
