import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Wallet, DollarSign, Layers, Utensils, Armchair, Users, LogOut, ChevronDown } from 'lucide-react';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMenuOpenState = location.pathname.includes('/admin/categories') || location.pathname.includes('/admin/dishes');
  const [isMenuOpen, setIsMenuOpen] = useState(isMenuOpenState);

  // Giả lập thông tin user đang đăng nhập
  const currentUser = {
    username: localStorage.getItem('username') || "admin_demo",
    role: localStorage.getItem('role') || "Quản trị viên"
  };

  const isCashier = currentUser.role === 'Nhân viên thu ngân';

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between overflow-y-auto shrink-0">
      <div>
        <div className="p-4 flex items-center gap-3 border-b border-gray-100">
          <img src="/images/logo.png" alt="Cơm Thố Anh Nguyễn" className="w-12 h-12 rounded-full object-cover" />
          <div className="font-bold text-red-600 leading-tight text-sm">
            CƠM THỐ<br />ANH NGUYỄN
          </div>
        </div>
        <div className="p-4 flex flex-col gap-2">
          {!isCashier && (
            <Link 
              to="/admin" 
              className={`flex items-center gap-3 p-3 rounded-lg font-medium text-sm transition-colors ${isActive('/admin') ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Layers size={20} /> Tổng quan
            </Link>
          )}
          <Link 
            to="/admin/orders" 
            className={`flex items-center gap-3 p-3 rounded-lg font-medium text-sm transition-colors ${isActive('/admin/orders') ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Wallet size={20} /> Đơn hàng
          </Link>
          <Link 
            to="/admin/invoices" 
            className={`flex items-center gap-3 p-3 rounded-lg font-medium text-sm transition-colors ${isActive('/admin/invoices') || location.pathname.startsWith('/admin/invoices') ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <DollarSign size={20} /> Hóa đơn
          </Link>
          {!isCashier && (
            <div className="p-3 rounded-lg text-gray-600 font-medium text-sm">
              <div 
                className="flex items-center justify-between mb-2 cursor-pointer hover:text-gray-800"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <div className="flex items-center gap-3"><Utensils size={20} /> Thực đơn</div>
                <ChevronDown size={16} className={`transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
              </div>
              {isMenuOpen && (
                <div className="pl-9 flex flex-col gap-4 text-xs text-gray-500 mt-3">
                  <Link 
                    to="/admin/categories" 
                    className={isActive('/admin/categories') || location.pathname.includes('/admin/categories') ? 'text-red-600 font-medium' : 'hover:text-red-600'}
                  >
                    • Danh mục món
                  </Link>
                  <Link 
                    to="/admin/dishes" 
                    className={isActive('/admin/dishes') && !location.pathname.includes('/suspended') ? 'text-red-600 font-medium' : 'hover:text-red-600'}
                  >
                    • Danh sách món
                  </Link>
                  <Link 
                    to="/admin/dishes/suspended" 
                    className={isActive('/admin/dishes/suspended') || location.pathname.includes('/admin/dishes/suspended') ? 'text-red-600 font-medium' : 'hover:text-red-600'}
                  >
                    • Món ngưng bán
                  </Link>
                </div>
              )}
            </div>
          )}
          <Link 
            to="/admin/tables" 
            className={`flex items-center gap-3 p-3 rounded-lg font-medium text-sm transition-colors ${isActive('/admin/tables') ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Armchair size={20} /> Bàn và QR
          </Link>
          {!isCashier && (
            <Link 
              to="/admin/employees" 
              className={`flex items-center gap-3 p-3 rounded-lg font-medium text-sm transition-colors ${isActive('/admin/employees') ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Users size={20} /> Nhân viên và quyền
            </Link>
          )}
        </div>
      </div>
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white font-bold uppercase">
            {currentUser.username.charAt(0)}
          </div>
          <div>
            <div className="font-bold text-sm">{currentUser.username}</div>
            <div className="text-xs text-gray-500">{currentUser.role}</div>
          </div>
        </div>
        <button 
          onClick={() => {
            localStorage.removeItem('username');
            localStorage.removeItem('role');
            navigate('/');
          }} 
          className="w-full flex items-center gap-3 text-red-600 font-medium text-sm hover:bg-red-50 p-2 rounded-lg"
        >
          <LogOut size={20} /> Đăng xuất
        </button>
      </div>
    </div>
  );
}
