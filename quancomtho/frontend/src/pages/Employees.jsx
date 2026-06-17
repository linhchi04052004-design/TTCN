import React, { useState, useEffect } from 'react';
import { Mail, Phone, Trash2, User, UserPlus, X, AlertCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    TenNV: '',
    SDT: '',
    Email: '',
    VaiTro: ''
  });

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  const currentUser = {
    username: localStorage.getItem('username') || "admin"
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/admin/employees');
      const result = await res.json();
      if (result.success) {
        setEmployees(result.data);
      }
    } catch (error) {
      console.error('Lỗi lấy danh sách nhân viên:', error);
      showMessage('error', 'Không thể tải danh sách tài khoản.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.TenNV || !formData.SDT || !formData.VaiTro) {
      showMessage('error', 'Vui lòng điền đầy đủ Họ tên, SĐT và chọn Vai trò.');
      return;
    }

    try {
      const res = await fetch('http://localhost:8000/api/admin/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      const result = await res.json();
      
      if (result.success) {
        showMessage('success', `Tạo thành công. Tên đăng nhập: ${result.data.TenDangNhap}, Mật khẩu: ${result.data.MatKhau}`);
        setFormData({ TenNV: '', SDT: '', Email: '', VaiTro: '' });
        fetchEmployees();
      } else {
        showMessage('error', result.message || 'Lỗi khi tạo tài khoản.');
      }
    } catch (error) {
      console.error('Lỗi tạo tài khoản:', error);
      showMessage('error', 'Lỗi kết nối máy chủ.');
    }
  };

  // Mở popup xác nhận xóa
  const triggerDelete = (emp) => {
    setEmployeeToDelete(emp);
    setShowDeleteModal(true);
  };

  // Xác nhận xóa
  const confirmDelete = async () => {
    if (!employeeToDelete) return;

    try {
      const res = await fetch(`http://localhost:8000/api/admin/employees/${employeeToDelete.MaTK}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' }
      });
      const result = await res.json();
      
      if (result.success) {
        showMessage('success', 'Đã xóa tài khoản.');
        fetchEmployees();
      } else {
        showMessage('error', result.message || 'Lỗi khi xóa tài khoản.');
      }
    } catch (error) {
      console.error('Lỗi xóa tài khoản:', error);
      showMessage('error', 'Lỗi kết nối máy chủ.');
    } finally {
      setShowDeleteModal(false);
      setEmployeeToDelete(null);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 6000);
  };

  const getRoleBadge = (role) => {
    switch(role) {
      case 'admin':
        return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">Admin</span>;
      case 'Nhân viên thu ngân':
        return <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-medium">Nhân viên thu ngân</span>;
      default: 
        return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">{role}</span>;
    }
  };

  return (
    <div className="flex h-screen bg-stone-100 text-gray-800 font-sans overflow-hidden">
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8 relative">
        
        {/* Toast Notification */}
        {message.text && (
          <div className={`fixed top-8 right-8 px-6 py-4 rounded-lg shadow-xl font-medium z-50 transition-opacity max-w-md ${message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
            {message.text}
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Nhân viên & phân quyền</h1>
          <p className="text-gray-500 text-sm">Quản lý tài khoản và phân quyền cho nhân viên</p>
        </div>

        {/* Create Employee Form */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mb-8">
          <h2 className="text-sm font-bold text-red-600 uppercase mb-4">Tạo tài khoản nhân viên mới</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div>
              <label className="block text-sm text-gray-700 font-medium mb-2">Họ tên nhân viên</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={18} className="text-gray-400" />
                </div>
                <input 
                  type="text" 
                  name="TenNV"
                  value={formData.TenNV}
                  onChange={handleInputChange}
                  placeholder="Nhập họ tên nhân viên"
                  className="pl-10 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-red-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-700 font-medium mb-2">Email (nhận mật khẩu)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-gray-400" />
                </div>
                <input 
                  type="email" 
                  name="Email"
                  value={formData.Email}
                  onChange={handleInputChange}
                  placeholder="example@email.com"
                  className="pl-10 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-red-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-700 font-medium mb-2">Số điện thoại</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone size={18} className="text-gray-400" />
                </div>
                <input 
                  type="text" 
                  name="SDT"
                  value={formData.SDT}
                  onChange={handleInputChange}
                  placeholder="Nhập số điện thoại"
                  className="pl-10 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-red-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-700 font-medium mb-2">Vai trò</label>
              <select 
                name="VaiTro"
                value={formData.VaiTro}
                onChange={handleInputChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-red-500 transition-colors appearance-none bg-white"
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right .5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}
              >
                <option value="" disabled>Chọn vai trò</option>
                <option value="admin">Admin</option>
                <option value="Nhân viên thu ngân">Nhân viên thu ngân</option>
              </select>
            </div>

            <div className="md:col-span-2 flex justify-end">
              <button 
                type="submit"
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors shadow-sm"
              >
                <UserPlus size={18} /> Tạo tài khoản
              </button>
            </div>
          </form>
        </div>

        {/* Employee List */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-bold text-gray-800 uppercase text-sm">Danh sách tài khoản ({employees.length})</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                <tr>
                  <th className="p-4 uppercase text-xs tracking-wider">Tên đăng nhập</th>
                  <th className="p-4 uppercase text-xs tracking-wider">Họ tên / Liên hệ</th>
                  <th className="p-4 uppercase text-xs tracking-wider text-center">Vai trò</th>
                  <th className="p-4 uppercase text-xs tracking-wider text-center">Trạng thái</th>
                  <th className="p-4 uppercase text-xs tracking-wider text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">Đang tải dữ liệu...</td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">Không có tài khoản nào.</td>
                  </tr>
                ) : (
                  employees.map((emp) => (
                    <tr key={emp.MaTK} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-gray-800">{emp.TenDangNhap}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{emp.MaTK} - {emp.MaNV}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-gray-800 mb-1">{emp.TenNV}</div>
                        <div className="flex flex-col gap-1 text-xs text-gray-500">
                          <div className="flex items-center gap-1.5"><Phone size={12} /> {emp.SDT}</div>
                          {emp.Email && <div className="flex items-center gap-1.5"><Mail size={12} /> {emp.Email}</div>}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        {getRoleBadge(emp.VaiTro)}
                      </td>
                      <td className="p-4 text-center">
                        {emp.TrangThai === 'Ngừng hoạt động' ? (
                          <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium flex items-center justify-center gap-1.5 mx-auto w-fit">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span> Ngừng hoạt động
                          </span>
                        ) : (
                          <span className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-xs font-medium flex items-center justify-center gap-1.5 mx-auto w-fit">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Đang dùng
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {emp.TenDangNhap === currentUser.username ? (
                          <span className="text-xs text-gray-400 italic">Tài khoản của bạn</span>
                        ) : (
                          <button 
                            onClick={() => triggerDelete(emp)}
                            className="flex items-center gap-1.5 mx-auto text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded transition-colors"
                          >
                            <Trash2 size={14} /> Xóa tài khoản
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Modal Xác nhận Xóa tài khoản */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative" style={{animation: 'modalFadeIn 0.2s ease-out'}}>
            <button 
              onClick={() => { setShowDeleteModal(false); setEmployeeToDelete(null); }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
            <div className="p-8 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-red-100 text-red-500 flex items-center justify-center mb-4">
                <AlertCircle size={32} />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Xóa tài khoản</h2>
              <p className="text-gray-500 mb-6">Bạn có chắc chắn muốn xóa tài khoản này? Thao tác không thể hoàn tác.</p>
              
              {employeeToDelete && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl mb-8 w-full max-w-xs justify-center text-left">
                  <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-bold uppercase shrink-0">
                    {employeeToDelete.TenNV?.charAt(0) || '?'}
                  </div>
                  <div>
                    <div className="font-bold text-gray-800 text-sm">{employeeToDelete.TenNV}</div>
                    <div className="text-xs text-gray-400">{employeeToDelete.TenDangNhap}</div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 w-full">
                <button 
                  onClick={() => { setShowDeleteModal(false); setEmployeeToDelete(null); }}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
