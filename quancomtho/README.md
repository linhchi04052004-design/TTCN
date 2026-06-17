# Hệ thống Quản lý Đơn hàng bằng QR Code – Quán Cơm Thố Anh Nguyễn

> File này là **PROMPT GỐC** dành cho AI Agent (Antigravity) để generate đầy đủ code dựa trên khung sườn đã dựng sẵn trong repo này.

## 1. TỔNG QUAN HỆ THỐNG

Hệ thống gồm 2 phần:

| Phần | Công nghệ | Đối tượng dùng | Vai trò |
|---|---|---|---|
| **Client App** | React.js + Vite + Tailwind CSS | Khách hàng (mobile, quét QR trên bàn) | Xem menu, đặt món, gọi món, theo dõi đơn hàng |
| **Admin App** | Laravel (Blade hoặc API + React Admin SPA) chạy desktop | Admin / Nhân viên thu ngân | Quản lý menu, bàn, đơn hàng, hóa đơn, nhân viên, báo cáo |
| **Backend API** | Laravel 11 (PHP 8.2+) | Cả 2 phía gọi qua REST API | Auth, CRUD, business logic |
| **Database** | MySQL (`QuanComThoAnhNguyen_Final.sql`) | - | Đã có sẵn, KHÔNG thay đổi cấu trúc bảng |

**Luồng đặt món qua QR:**
1. Khách quét mã QR dán trên bàn → mã QR encode `MaBan` (ví dụ: `https://domain.com/order?ban=Ban01`)
2. Client App load menu (từ `DANH_MUC_MON` + `MON_AN`), khách chọn món, thêm vào giỏ
3. Khách xác nhận đặt → tạo `DON_HANG` (HinhThuc = "Tại bàn", MaBan = bàn quét được) + nhiều `CHI_TIET_DH`
4. Đơn hàng được gửi realtime/poll tới Admin App (màn hình bếp/thu ngân)
5. Nhân viên xác nhận, chế biến, phục vụ
6. Khi thanh toán → tạo `HOA_DON` gắn với `DON_HANG`, cập nhật trạng thái bàn về "Trống"

## 2. CƠ SỞ DỮ LIỆU

File gốc: `database/QuanComThoAnhNguyen_Final.sql` (đã có ở `backend/database/sql/`)

**KHÔNG sửa cấu trúc bảng.** Laravel migrations phải **map đúng tên bảng/cột tiếng Việt** đã có (dùng `Schema::create` với tên bảng/cột giữ nguyên, hoặc tạo migration "import" chạy raw SQL). Khuyến nghị: dùng raw SQL import (xem `backend/database/sql/import_instructions.md`) thay vì viết lại migration từ đầu, để đảm bảo giữ đúng GENERATED COLUMN, CHECK CONSTRAINT, INDEX.

### Danh sách bảng & quan hệ chính
- `NHAN_VIEN` (1) ── (1) `TAI_KHOAN`
- `NHAN_VIEN` (1) ── (n) `DON_HANG`
- `BAN_AN` (1) ── (n) `DON_HANG`
- `DANH_MUC_MON` (1) ── (n) `MON_AN`
- `DON_HANG` (1) ── (n) `CHI_TIET_DH` ── (n) ── (1) `MON_AN`
- `DON_HANG` (1) ── (1) `HOA_DON`

Chi tiết field xem `docs/erd.md`.

## 3. THỨ TỰ THỰC HIỆN (BẮT BUỘC THEO ĐÚNG TRÌNH TỰ)

### Bước 1: Cấu trúc project Laravel + React
- [ ] Khởi tạo Laravel project trong `backend/` (composer create-project laravel/laravel .)
- [ ] Khởi tạo React + Vite + Tailwind trong `frontend/` (npm create vite@latest . -- --template react)
- [ ] Cấu hình CORS Laravel cho phép frontend gọi API (`config/cors.php`)
- [ ] Cấu hình `.env` cho cả 2 (xem mẫu `.env.example` đã tạo sẵn)

### Bước 2: Kết nối MySQL
- [ ] Import `database/QuanComThoAnhNguyen_Final.sql` vào MySQL (database đã được tạo sẵn bởi file SQL, tên DB = `QuanComThoAnhNguyen`)
- [ ] Cấu hình `backend/.env`: DB_DATABASE=QuanComThoAnhNguyen
- [ ] Tạo Eloquent Models tương ứng 8 bảng (xem `docs/models_spec.md`), set đúng `$table`, `$primaryKey` (string, không auto-increment), `$keyType = 'string'`, `$incrementing = false`

### Bước 3: Authentication + Phân quyền
- [ ] Dùng Laravel Sanctum cho API token authentication
- [ ] Bảng `TAI_KHOAN` đóng vai trò bảng user (KHÔNG dùng bảng `users` mặc định của Laravel) → custom Authenticatable model `TaiKhoan`
- [ ] 2 vai trò: `admin` và `Nhân viên thu ngân` (cột `VaiTro`)
- [ ] Middleware phân quyền: `CheckRole` — admin full quyền, thu ngân hạn chế (không sửa menu/nhân viên)
- [ ] Client App (khách hàng) KHÔNG cần đăng nhập — public endpoints riêng (`/api/client/*`)
- [ ] Admin App cần login (`/api/admin/*`, bảo vệ bởi `auth:sanctum` + `CheckRole`)

### Bước 4: Xây dựng API Laravel
- Chi tiết toàn bộ danh sách endpoint: `docs/api_spec.md`
- Nhóm theo Controller đã scaffold trong `backend/app/Http/Controllers/Api/`

## 4. GIAO DIỆN (FRONTEND)

### Client App (Mobile - React)
Trang chính (đã tạo placeholder trong `frontend/src/pages/Client/`):
- `ScanLanding.jsx` – Landing khi quét QR, đọc `MaBan` từ query string
- `Menu.jsx` – Danh sách món theo danh mục (tab DM001/DM002/DM003), tìm kiếm
- `Cart.jsx` – Giỏ hàng, chỉnh số lượng, ghi chú món
- `OrderConfirm.jsx` – Xác nhận thông tin (tên, SĐT tuỳ chọn), gửi đơn
- `OrderStatus.jsx` – Theo dõi trạng thái đơn hàng vừa đặt
- `OrderHistory.jsx` (optional) – Lịch sử đơn theo SĐT

### Admin App (Desktop - React SPA gọi Laravel API, hoặc Laravel Blade)
Trang chính (đã tạo placeholder trong `frontend/src/pages/Admin/`):
- `Login.jsx`
- `Dashboard.jsx` – Tổng quan doanh thu, số đơn hôm nay, bàn đang dùng
- `Tables.jsx` – Quản lý bàn (trạng thái Trống/Có khách), in QR mỗi bàn
- `Categories.jsx` – CRUD danh mục món
- `MenuItems.jsx` – CRUD món ăn (giá, hình ảnh, trạng thái)
- `Orders.jsx` – Danh sách đơn hàng realtime, xác nhận/hủy, xem chi tiết
- `OrderDetail.jsx` – Chi tiết đơn + tạo hóa đơn (chọn PTTT)
- `Invoices.jsx` – Danh sách hóa đơn, doanh thu theo ngày
- `Employees.jsx` – CRUD nhân viên (chỉ admin)
- `Accounts.jsx` – CRUD tài khoản đăng nhập (chỉ admin)
- `Reports.jsx` – Báo cáo doanh thu theo ngày/tháng, món bán chạy

## 5. QR CODE

- Mỗi bàn (`BAN_AN.MaBan`) có 1 QR code tĩnh, encode URL: `https://<client-domain>/order?ban={MaBan}`
- Sinh QR bằng thư viện `qrcode.react` (frontend admin, để in) hoặc `simple-qrcode` (Laravel, để xuất PDF)
- Khi khách scan → mở Client App với `ban` param → toàn bộ luồng đặt món gắn với `MaBan` này

## 6. CÁC FILE QUAN TRỌNG ĐÃ SCAFFOLD

```
quancomtho/
├── README.md                     <- File này (PROMPT chính)
├── backend/                       Laravel
│   ├── .env.example
│   ├── database/sql/QuanComThoAnhNguyen_Final.sql
│   ├── database/sql/import_instructions.md
│   ├── app/Models/*.php           (8 models, đã có thuộc tính + relationships)
│   ├── app/Http/Controllers/Api/Admin/*.php   (controller rỗng + TODO)
│   ├── app/Http/Controllers/Api/Client/*.php
│   ├── app/Http/Middleware/CheckRole.php
│   └── routes/api.php             (route list đầy đủ, comment TODO)
├── frontend/                       React + Vite + Tailwind
│   ├── .env.example
│   ├── src/services/api.js        (axios instance)
│   ├── src/context/AuthContext.jsx
│   ├── src/pages/Client/*.jsx
│   └── src/pages/Admin/*.jsx
└── docs/
    ├── erd.md                      Mô tả ERD chi tiết từng bảng/cột
    ├── models_spec.md              Spec Eloquent Models + relationships
    ├── api_spec.md                 Toàn bộ endpoint API (method, path, request, response)
    └── workflows.md                Luồng nghiệp vụ chi tiết (đặt món, thanh toán, phân quyền)
```

## 7. HƯỚNG DẪN CHO AI AGENT

Khi generate code, hãy:
1. Đọc `docs/erd.md` để hiểu chính xác tên bảng/cột (giữ nguyên, KHÔNG đổi sang snake_case chuẩn Laravel)
2. Đọc `docs/models_spec.md` để tạo Models với đúng `$table`, `$primaryKey`, `$keyType='string'`, `$incrementing=false`, relationships
3. Đọc `docs/api_spec.md` để implement từng method trong Controllers theo đúng route đã khai báo ở `routes/api.php`
4. Đọc `docs/workflows.md` để hiểu business logic (transaction khi tạo đơn hàng, cập nhật trạng thái bàn, tạo hóa đơn...)
5. Generate Migrations dựa trên `database/sql/QuanComThoAnhNguyen_Final.sql` (giữ nguyên CHECK, GENERATED COLUMN, FK)
6. Hoàn thiện các trang React còn đang là placeholder, dùng Tailwind, mobile-first cho Client, desktop layout cho Admin
7. Đảm bảo Sanctum auth hoạt động đúng với bảng `TAI_KHOAN` (không dùng bảng `users`)
