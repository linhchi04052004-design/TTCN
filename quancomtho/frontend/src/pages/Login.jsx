import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const savedUsername = localStorage.getItem('rememberedUsername');
    const savedPassword = localStorage.getItem('rememberedPassword');
    if (savedUsername && savedPassword) {
      setUsername(savedUsername);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);
  
  const [errors, setErrors] = useState({
    username: false,
    password: false,
    global: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const clearError = (field) => {
    setErrors(prev => ({
      ...prev,
      [field]: false,
      global: ''
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    let hasError = false;
    const newErrors = { username: false, password: false, global: '' };

    if (!username.trim()) {
      newErrors.username = true;
      hasError = true;
    }
    if (!password) {
      newErrors.password = true;
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      // Modify this path if your backend is hosted differently
      const response = await fetch(`http://${window.location.hostname}/quancomtho/quancomtho/backend/api/login.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password
        })
      });

      const result = await response.json();

      if (result.success) {
        if (rememberMe) {
          localStorage.setItem('rememberedUsername', username.trim());
          localStorage.setItem('rememberedPassword', password);
        } else {
          localStorage.removeItem('rememberedUsername');
          localStorage.removeItem('rememberedPassword');
        }

        const role = result.user.role;
        localStorage.setItem('username', result.user.username);
        localStorage.setItem('role', role);

        if (role === 'admin' || role === 'Quản trị viên') {
          navigate('/admin');
        } else if (role === 'Nhân viên thu ngân') {
          navigate('/admin/orders');
        } else {
          setErrors(prev => ({ ...prev, global: 'Vai trò không hợp lệ.' }));
        }
      } else {
        setErrors(prev => ({ ...prev, global: result.message || 'Đăng nhập thất bại.' }));
      }
    } catch (error) {
      console.error('Error:', error);
      // Fallback for development if PHP server isn't running correctly
      setErrors(prev => ({ ...prev, global: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau hoặc kiểm tra lại đường dẫn API.' }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 lg:p-8 relative">
      
      {/* Top Navigation (Mock) */}
      <div className="absolute top-0 left-0 w-full bg-white shadow-sm px-6 py-4 flex justify-between items-center z-10 hidden md:flex">
        <div className="flex items-center gap-3">
          <img src="/images/logo.png" alt="Cơm Thố Anh Nguyễn" className="w-9 h-9 rounded-full object-cover" />
          <span className="font-bold text-primary text-lg">Cơm thố Anh Nguyễn</span>
        </div>
        <div className="text-sm text-gray-600 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Hỗ trợ: <a href="mailto:hotro@comtho.vn" className="text-primary hover:underline font-medium">hotro@comtho.vn</a>
        </div>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[85vh] max-h-[700px] min-h-[550px] relative z-0 mt-12">
        
        {/* Left Side: Image & Features */}
        <div className="hidden md:flex md:w-1/2 relative flex-col justify-center items-center text-white overflow-hidden p-10">
          <div className="absolute inset-0 bg-black">
            <img src="https://images.unsplash.com/photo-1563379926898-05f4575a45d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80" alt="Cơm thố" className="w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20"></div>
          </div>

          <div className="relative z-10 flex flex-col items-center text-center mt-[-100px]">
            <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg mb-6 overflow-hidden">
              <img src="/images/logo.png" alt="Cơm Thố Anh Nguyễn" className="w-full h-full object-cover" />
            </div>
            
            <h1 className="text-4xl font-bold mb-3 tracking-wide drop-shadow-md">QUẢN TRỊ HỆ THỐNG</h1>
            <p className="text-lg text-gray-200 drop-shadow mb-12">Quản lý nhà hàng hiệu quả và chuyên nghiệp</p>
            
            {/* Feature Icons */}
            <div className="grid grid-cols-3 gap-6 w-full max-w-lg mt-10">
              <div className="flex flex-col items-center">
                <div className="bg-white text-primary rounded-xl p-3 mb-3 shadow-md">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-sm mb-1">Quản lý dễ dàng</h3>
                <p className="text-xs text-gray-300 text-center opacity-90">Theo dõi hoạt động kinh doanh mọi lúc</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-white text-primary rounded-xl p-3 mb-3 shadow-md">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-sm mb-1">Bảo mật an toàn</h3>
                <p className="text-xs text-gray-300 text-center opacity-90">Thông tin được mã hóa và bảo vệ tuyệt đối</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-white text-primary rounded-xl p-3 mb-3 shadow-md">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-sm mb-1">Phân quyền rõ ràng</h3>
                <p className="text-xs text-gray-300 text-center opacity-90">Phân quyền theo vai trò, kiểm soát chặt chẽ</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-white md:bg-gray-50/50">
          <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-2xl md:shadow-lg border border-gray-100">
            
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">ĐĂNG NHẬP NHÂN VIÊN</h2>
              <p className="text-gray-500 text-sm">Vui lòng nhập thông tin tài khoản quản lý nhà hàng</p>
            </div>

            {/* Global Error */}
            {errors.global && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span className="text-sm font-medium">{errors.global}</span>
              </div>
            )}

            <form className="space-y-5" onSubmit={handleLogin}>
              
              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-semibold text-gray-900 mb-2">Tên đăng nhập</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={`w-5 h-5 transition-colors ${errors.username ? 'text-red-400' : 'text-gray-400 group-focus-within:text-primary'}`}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                  <input 
                    type="text" 
                    id="username" 
                    placeholder="Staff001" 
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      clearError('username');
                    }}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-all placeholder-gray-400 text-gray-900 ${
                      errors.username 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50' 
                        : 'border-gray-300 focus:border-primary focus:ring-primary'
                    }`}
                  />
                </div>
                {errors.username && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Vui lòng nhập tên đăng nhập.
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-900 mb-2">Mật khẩu</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={`w-5 h-5 transition-colors ${errors.password ? 'text-red-400' : 'text-gray-400 group-focus-within:text-primary'}`}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    id="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearError('password');
                    }}
                    className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-all placeholder-gray-400 text-gray-900 font-medium tracking-wider ${
                      errors.password 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50' 
                        : 'border-gray-300 focus:border-primary focus:ring-primary'
                    }`}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Vui lòng nhập mật khẩu.
                  </p>
                )}
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center pt-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    className="custom-checkbox group-hover:border-primary transition-colors" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="text-sm font-medium text-gray-700 select-none">Ghi nhớ đăng nhập</span>
                </label>
              </div>

              {/* Submit */}
              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-primaryDark text-white font-bold py-3.5 px-4 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <span>Đăng nhập</span>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      </div>

    </div>
  );
}
