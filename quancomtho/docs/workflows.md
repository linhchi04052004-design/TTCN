# Luồng nghiệp vụ (Workflows)

## 1. Luồng đặt món qua QR (Client App)

```
[Khách quét QR trên bàn]
        │  URL: https://client.domain.com/order?ban=Ban01
        ▼
[ScanLanding] -- GET /api/client/tables/Ban01 --> kiểm tra bàn tồn tại
        ▼
[Menu] -- GET /api/client/categories, /api/client/menu --> hiển thị món theo danh mục
        ▼  (khách chọn món, thêm giỏ hàng - lưu state local React, KHÔNG cần backend)
[Cart] -- xem lại giỏ, sửa số lượng/ghi chú
        ▼
[OrderConfirm] -- nhập tên/SĐT (tùy chọn) --> POST /api/client/orders
        ▼
[OrderStatus] -- GET /api/client/orders/{maDH} (polling mỗi 10-15s) --> hiển thị trạng thái
```

### Gán MaNV khi khách tự đặt (không qua nhân viên)
Vì `DON_HANG.MaNV` là NOT NULL nhưng khách hàng quét QR không đăng nhập, đề xuất:
- Tạo 1 "tài khoản hệ thống" / nhân viên đại diện ca trực (ví dụ NV002 mặc định), HOẶC
- Cho phép Admin chọn "nhân viên trực ca hiện tại" lưu trong config/cache, Client API lấy từ đó

**AI Agent**: implement theo cách đơn giản trước — cấu hình `.env` biến `DEFAULT_STAFF_MA_NV=NV002`, dùng làm MaNV cho mọi đơn từ Client App. Ghi rõ TODO để cải tiến sau (cho phép admin đổi nhân viên trực ca qua Admin App).

---

## 2. Luồng xử lý đơn tại Admin App

```
[Đơn hàng mới xuất hiện trong /admin/orders] (poll mỗi 5-10s hoặc dùng Laravel Echo/Pusher nếu mở rộng)
        ▼
[Nhân viên xem chi tiết đơn] -- GET /api/admin/orders/{maDH}
        ▼
[Chế biến & phục vụ] (cập nhật trạng thái nội bộ nếu mở rộng thêm cột TrangThaiXuLy)
        ▼
[Khách yêu cầu thanh toán] -- POST /api/admin/invoices { ma_dh, pttt }
        ▼
   - Tính tổng tiền từ CHI_TIET_DH
   - Tạo HOA_DON
   - Nếu HinhThuc='Tại bàn': update BAN_AN.TrangThai = 'Trống'
        ▼
[In hóa đơn] -- GET /api/admin/invoices/{maHD}/print
```

---

## 3. Luồng Authentication & Phân quyền

### Login
```
POST /api/auth/login { ten_dang_nhap, mat_khau }
  -> tìm TAI_KHOAN WHERE TenDangNhap = ?
  -> kiểm tra TrangThai = 'Hoạt động'
  -> Hash::check(mat_khau, MatKhau)
  -> tạo Sanctum token, cập nhật LanDangNhapCuoi
  -> trả token + thông tin tài khoản + NHAN_VIEN liên kết
```

### Middleware phân quyền `CheckRole`
```php
// app/Http/Middleware/CheckRole.php
public function handle($request, Closure $next, ...$roles) {
    $user = $request->user(); // TaiKhoan instance
    if (!$user || !in_array($user->VaiTro, $roles)) {
        return response()->json(['message' => 'Forbidden'], 403);
    }
    return $next($request);
}
```

Đăng ký trong `routes/api.php`:
```php
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    // employees, accounts, category/menu CUD
});

Route::middleware(['auth:sanctum', 'role:admin,Nhân viên thu ngân'])->group(function () {
    // orders, invoices, tables view
});
```

### Phân quyền tổng hợp

| Chức năng | admin | Nhân viên thu ngân |
|---|---|---|
| Quản lý nhân viên | ✅ | ❌ |
| Quản lý tài khoản | ✅ | ❌ |
| Quản lý danh mục/món ăn | ✅ | xem (read-only) |
| Quản lý bàn (CRUD) | ✅ | xem + xem QR |
| Xem/xử lý đơn hàng | ✅ | ✅ |
| Tạo hóa đơn/thanh toán | ✅ | ✅ |
| Xem báo cáo | ✅ | xem cơ bản (doanh thu ngày) |

---

## 4. Sinh mã tự động (Auto ID generation)

Helper chung trong `app/Helpers/CodeGenerator.php`:
```php
function generateNextCode(string $model, string $column, string $prefix, int $padLength): string
{
    $last = $model::orderByRaw("CAST(SUBSTRING($column, " . (strlen($prefix)+1) . ") AS UNSIGNED) DESC")
        ->first();
    $nextNumber = 1;
    if ($last) {
        $num = (int) substr($last->{$column}, strlen($prefix));
        $nextNumber = $num + 1;
    }
    return $prefix . str_pad($nextNumber, $padLength, '0', STR_PAD_LEFT);
}
```

Ví dụ dùng:
- `generateNextCode(DonHang::class, 'MaDH', 'DH', 3)` → "DH011"
- `generateNextCode(ChiTietDH::class, 'MaCTDH', 'CTDH', 3)` → "CTDH025"
- `generateNextCode(HoaDon::class, 'MaHD', 'HD', 3)` → "HD009"
- `generateNextCode(MonAn::class, 'MaMonAn', 'Mon', 3)` → "Mon026"
- `generateNextCode(BanAn::class, 'MaBan', 'Ban', 2)` → "Ban11"

---

## 5. Tạo hóa đơn (transaction)

```php
DB::transaction(function () use ($maDH, $pttt) {
    $donHang = DonHang::with('chiTietDHs')->findOrFail($maDH);
    $thanhTien = $donHang->chiTietDHs->sum('TongTien');

    $maHD = generateNextCode(HoaDon::class, 'MaHD', 'HD', 3);
    HoaDon::create([
        'MaHD' => $maHD,
        'MaDH' => $maDH,
        'PTTT' => $pttt,
        'NgayThanhToan' => now(),
        'ThanhTien' => $thanhTien,
    ]);

    if ($donHang->HinhThuc === 'Tại bàn' && $donHang->MaBan) {
        BanAn::where('MaBan', $donHang->MaBan)->update(['TrangThai' => 'Trống']);
    }
});
```

---

## 6. QR Code Generation (Admin)

Dùng package `simplesoftwareio/simple-qrcode`:
```php
use SimpleSoftwareIO\QrCode\Facades\QrCode;

// GET /api/admin/tables/{maBan}/qrcode
$url = config('app.client_url') . "/order?ban={$maBan}";
$svg = QrCode::format('svg')->size(300)->generate($url);
return response($svg)->header('Content-Type', 'image/svg+xml');
```

Frontend Admin có thể dùng `qrcode.react` để render trực tiếp nếu muốn (không cần gọi API):
```jsx
import { QRCodeSVG } from 'qrcode.react';
<QRCodeSVG value={`${CLIENT_URL}/order?ban=${maBan}`} size={200} />
```

---

## 7. CORS & Env

`backend/.env`:
```
APP_URL=http://localhost:8000
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=QuanComThoAnhNguyen
DB_USERNAME=root
DB_PASSWORD=

SANCTUM_STATEFUL_DOMAINS=localhost:5173,localhost:5174
SESSION_DOMAIN=localhost

CLIENT_URL=http://localhost:5173
ADMIN_URL=http://localhost:5174

DEFAULT_STAFF_MA_NV=NV002
```

`frontend/.env` (cho cả Client & Admin app, hoặc 2 file riêng nếu tách 2 project React):
```
VITE_API_URL=http://localhost:8000/api
```

`config/cors.php`: cho phép `paths => ['api/*']`, `allowed_origins => [env('CLIENT_URL'), env('ADMIN_URL')]`, `supports_credentials => true` nếu dùng Sanctum SPA cookie, hoặc dùng pure token (Authorization header) thì không cần stateful domains.
