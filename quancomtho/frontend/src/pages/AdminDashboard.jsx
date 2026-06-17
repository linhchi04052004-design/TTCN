import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar
} from 'recharts';
import { Clock, Wallet, DollarSign, Layers, Utensils, Armchair, Users } from 'lucide-react';
import { format } from 'date-fns';
import Sidebar from '../components/Sidebar';
import { buildApiUrl } from '../config';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Giả lập thông tin user đang đăng nhập (trong thực tế lấy từ Context/Redux/LocalStorage)
  const currentUser = {
    username: localStorage.getItem('username') || "admin_demo",
    role: "Quản trị viên"
  };

  useEffect(() => {
    // In real app, we might need auth token here
    fetch(buildApiUrl('/admin/dashboard'), {
      headers: {
        'Accept': 'application/json'
      }
    })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setData(result.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Lỗi khi tải dữ liệu dashboard:', err);
        setLoading(false);
      });
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const formatCompactNumber = (number) => {
    if (number >= 1000000) {
      return (number / 1000000).toFixed(0) + 'M';
    }
    return number.toLocaleString('vi-VN');
  };

  const COLORS_PIE_1 = ['#8b4513', '#e60000', '#d2691e'];
  const COLORS_PIE_2 = ['#e60000', '#8b4513'];

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-gray-50 text-xl text-gray-500">Đang tải dữ liệu...</div>;
  }

  const stats = data?.stats || {};
  const charts = data?.charts || {};

  return (
    <div className="flex h-screen bg-stone-100 text-gray-800 font-sans overflow-hidden">
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1">Tổng quan</h1>
            <p className="text-gray-500 text-sm">Chào mừng bạn trở lại, {currentUser.username}!</p>
          </div>
          <div className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-600 shadow-sm">
            <Clock size={16} className="text-gray-400" />
            <span>{format(new Date(), 'dd/MM/yyyy')}</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex gap-4">
              <div className="bg-red-50 text-red-600 p-3 rounded-lg h-12 w-12 flex items-center justify-center">
                <Wallet size={24} />
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Doanh thu hôm nay</div>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.today_revenue || 0)}</div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-sm">
              <span className={stats.today_revenue_growth >= 0 ? 'text-green-500 font-medium' : 'text-red-500 font-medium'}>
                {stats.today_revenue_growth >= 0 ? '↑' : '↓'} {Math.abs(stats.today_revenue_growth)}%
              </span>
              <span className="text-gray-400">so với hôm qua</span>
            </div>
            <button 
              onClick={() => navigate('/admin/invoices')} 
              className="mt-4 w-full bg-red-50 text-red-600 text-sm font-medium py-2.5 rounded-lg hover:bg-red-100 transition"
            >
              Xem hóa đơn hôm nay →
            </button>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="bg-red-50 text-red-600 p-3 rounded-lg h-14 w-14 flex items-center justify-center mb-3">
              <DollarSign size={28} />
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Tổng doanh thu</div>
              <div className="text-3xl font-bold text-red-600">{formatCurrency(stats.total_revenue || 0)}</div>
            </div>
            <div className="mt-3 flex items-center justify-center gap-1 text-sm">
              <span className={stats.total_revenue_growth >= 0 ? 'text-green-500 font-medium' : 'text-red-500 font-medium'}>
                {stats.total_revenue_growth >= 0 ? '↑' : '↓'} {Math.abs(stats.total_revenue_growth)}%
              </span>
              <span className="text-gray-400">so với tháng trước</span>
            </div>
          </div>


          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="bg-red-50 text-red-600 p-3 rounded-lg h-14 w-14 flex items-center justify-center">
              <Utensils size={28} />
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Tổng món</div>
              <div className="text-3xl font-bold text-red-600">{stats.total_items || 0}</div>
              <div className="text-xs text-gray-400 mt-1">Món trong thực đơn</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="bg-red-50 text-red-600 p-3 rounded-lg h-14 w-14 flex items-center justify-center">
              <Armchair size={28} />
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Tổng bàn</div>
              <div className="text-3xl font-bold text-red-600">{stats.active_tables || 0}</div>
              <div className="text-xs text-gray-400 mt-1">Bàn đang hoạt động</div>
            </div>
          </div>

        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Doanh thu 7 ngày qua */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">Doanh thu 7 ngày qua</h3>
              <select className="text-xs border border-gray-200 rounded px-2 py-1 outline-none text-gray-600">
                <option>7 ngày qua</option>
              </select>
            </div>
            <div className="text-xs text-gray-500 mb-2">Doanh thu (VND)</div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.revenue_7_days || []} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="date" tick={{fontSize: 12, fill: '#888'}} axisLine={false} tickLine={false} />
                  <YAxis 
                    tickFormatter={(value) => formatCompactNumber(value)} 
                    tick={{fontSize: 12, fill: '#888'}} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Line type="monotone" dataKey="revenue" stroke="#ef4444" strokeWidth={2} dot={{r: 4, fill: '#ef4444', strokeWidth: 2, stroke: '#fff'}} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Phương thức thanh toán */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="font-bold mb-4">Phương thức thanh toán hôm nay</h3>
            <div className="h-48 w-full relative mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.payment_methods || []}
                    cx="40%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {(charts.payment_methods || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS_PIE_1[index % COLORS_PIE_1.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute top-1/2 left-[40%] transform -translate-x-1/2 -translate-y-1/2 text-center">
                <div className="text-xs text-gray-500">Tổng</div>
                <div className="font-bold text-sm">{formatCurrency(stats.today_revenue || 0)}</div>
                <div className="text-xs font-bold mt-1">100%</div>
              </div>
            </div>
            {/* Legend */}
            <div className="space-y-2 text-xs">
              {(charts.payment_methods || []).map((method, index) => {
                const total = (charts.payment_methods || []).reduce((sum, item) => sum + item.value, 0);
                const percent = total > 0 ? Math.round((method.value / total) * 100) : 0;
                return (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS_PIE_1[index % COLORS_PIE_1.length]}}></div>
                      <span className="text-gray-600">{method.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span>{formatCurrency(method.value)}</span>
                      <span className="font-medium w-8 text-right">{percent}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Doanh thu theo giờ hôm nay */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="font-bold mb-4">Doanh thu theo giờ hôm nay</h3>
            <div className="text-xs text-gray-500 mb-2">Doanh thu (VND)</div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.hourly_revenue || []} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="time" tick={{fontSize: 10, fill: '#888'}} axisLine={false} tickLine={false} interval={1} />
                  <YAxis 
                    tickFormatter={(value) => formatCompactNumber(value)} 
                    tick={{fontSize: 10, fill: '#888'}} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Line type="monotone" dataKey="revenue" stroke="#ef4444" strokeWidth={2} dot={{r: 3, fill: '#ef4444'}} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Món bán chạy hôm nay */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
             <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">Món bán chạy hôm nay</h3>
              <select className="text-xs border border-gray-200 rounded px-2 py-1 outline-none text-gray-600">
                <option>Theo số lượng</option>
              </select>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.top_items_quantity_today || []} layout="vertical" margin={{ top: 5, right: 30, bottom: 20, left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#eee" />
                  <XAxis type="number" tick={{fontSize: 10, fill: '#888'}} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{fontSize: 10, fill: '#555'}} axisLine={false} tickLine={false} width={80} />
                  <Tooltip />
                  <Bar dataKey="quantity" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={12}>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="text-center text-xs text-gray-500 -mt-4">Số lượng (ly/phần)</div>
            </div>
          </div>
        </div>

        {/* Charts Row 3 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Doanh thu theo món Top 10 */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="font-bold mb-4">Doanh thu theo món hôm nay (Top 10)</h3>
            <div className="text-xs text-gray-500 mb-2">Doanh thu (VND)</div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.top_items_revenue || []} margin={{ top: 5, right: 10, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="name" tick={{fontSize: 10, fill: '#555'}} axisLine={false} tickLine={false} interval={0} angle={-30} textAnchor="end" height={60} />
                  <YAxis 
                    tickFormatter={(value) => formatCompactNumber(value)} 
                    tick={{fontSize: 10, fill: '#888'}} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="revenue" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tại bàn vs Mang về */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="font-bold mb-4">Tại bàn vs Mang về</h3>
            <div className="flex items-center justify-center h-full">
              <div className="h-48 w-1/2 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.dine_in_takeaway || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {(charts.dine_in_takeaway || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS_PIE_2[index % COLORS_PIE_2.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                  <div className="text-xs text-gray-500">Tổng</div>
                  <div className="font-bold text-sm">{formatCurrency((charts.dine_in_takeaway || []).reduce((a,b)=>a+b.value,0))}</div>
                  <div className="text-xs font-bold mt-1">100%</div>
                </div>
              </div>
              <div className="w-1/2 space-y-4 pl-4 text-sm">
                {(charts.dine_in_takeaway || []).map((item, index) => {
                  const total = (charts.dine_in_takeaway || []).reduce((sum, x) => sum + x.value, 0);
                  const percent = total > 0 ? Math.round((item.value / total) * 100) : 0;
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS_PIE_2[index % COLORS_PIE_2.length]}}></div>
                        <span className="text-gray-600">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span>{formatCurrency(item.value)}</span>
                        <span className="font-bold">{percent}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
