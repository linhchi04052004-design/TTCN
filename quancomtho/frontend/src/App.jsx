import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import CashierDashboard from './pages/CashierDashboard';
import Orders from './pages/Orders';
import CreateOrder from './pages/CreateOrder';
import OrderDetail from './pages/OrderDetail';
import Invoices from './pages/Invoices';
import InvoiceDetail from './pages/InvoiceDetail';
import InvoicePrint from './pages/InvoicePrint';
import Tables from './pages/Tables';
import Employees from './pages/Employees';
import Categories from './pages/Categories';
import CategoryForm from './pages/CategoryForm';
import Dishes from './pages/Dishes';
import DishForm from './pages/DishForm';
import SuspendedDishes from './pages/SuspendedDishes';
import Payment from './pages/Payment';
import PaymentSuccess from './pages/PaymentSuccess';
import MockQRPayment from './pages/MockQRPayment';

import CustomerLayout from './layouts/CustomerLayout';
import Welcome from './pages/customer/Welcome';
import Menu from './pages/customer/Menu';
import Checkout from './pages/customer/Checkout';

const Placeholder = ({ title }) => (
  <div className="flex h-screen flex-col items-center justify-center bg-gray-50 text-gray-800">
    <div className="text-6xl mb-4">🚧</div>
    <h1 className="text-2xl font-bold mb-2">Trang {title}</h1>
    <p className="text-gray-500 mb-6">Chức năng này đang được phát triển, vui lòng quay lại sau.</p>
    <Link to="/admin" className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition">
      Quay lại Tổng quan
    </Link>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/orders" element={<Orders />} />
        <Route path="/admin/orders/create" element={<CreateOrder />} />
        <Route path="/admin/orders/create/:maBan" element={<CreateOrder />} />
        <Route path="/admin/orders/:maDH" element={<OrderDetail />} />
        <Route path="/admin/payment/:maDH" element={<Payment />} />
        <Route path="/admin/payment-success/:maHD" element={<PaymentSuccess />} />
        <Route path="/payment/qr/:method/:amount/:orderId" element={<MockQRPayment />} />
        <Route path="/admin/invoices" element={<Invoices />} />
        <Route path="/admin/invoices/:id" element={<InvoiceDetail />} />
        <Route path="/admin/invoices/:id/print" element={<InvoicePrint />} />
        <Route path="/admin/categories" element={<Categories />} />
        <Route path="/admin/categories/create" element={<CategoryForm />} />
        <Route path="/admin/categories/:id/edit" element={<CategoryForm />} />
        <Route path="/admin/dishes" element={<Dishes />} />
        <Route path="/admin/dishes/create" element={<DishForm />} />
        <Route path="/admin/dishes/suspended" element={<SuspendedDishes />} />
        <Route path="/admin/dishes/:id/edit" element={<DishForm />} />
        <Route path="/admin/tables" element={<Tables />} />
        <Route path="/admin/employees" element={<Employees />} />
        <Route path="/cashier" element={<CashierDashboard />} />

        {/* Customer Routes - QR scan: /order/:maBan */}
        <Route path="/order" element={<CustomerLayout />}>
          <Route index element={<Welcome />} />
          <Route path=":maBan" element={<Welcome />} />
          <Route path=":maBan/menu" element={<Menu />} />
          <Route path=":maBan/checkout" element={<Checkout />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
