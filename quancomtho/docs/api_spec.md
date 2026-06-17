# API Specification

Base URL: `/api`

Auth: Laravel Sanctum (Bearer token). Header: `Authorization: Bearer {token}`

---

## A. AUTH (`/api/auth`)

| Method | Path | Mô tả | Quyền |
|---|---|---|---|
| POST | `/auth/login` | Đăng nhập (TenDangNhap, MatKhau) → trả token + thông tin tài khoản | public |
| POST | `/auth/logout` | Đăng xuất, revoke token hiện tại | auth |
| GET | `/auth/me` | Lấy thông tin tài khoản đang đăng nhập | auth |

**Request login:**
```json
{ "ten_dang_nhap": "admin", "mat_khau": "admin@123" }
```
**Response login:**
```json
{
  "token": "...",
  "tai_khoan": {
    "MaTK": "TK001", "TenDangNhap": "admin", "VaiTro": "admin",
    "nhan_vien": { "MaNV": "NV001", "TenNV": "Nguyễn An Minh" }
  }
}
```
Validate: `TrangThai = 'Hoạt động'` mới cho login. Cập nhật `LanDangNhapCuoi = now()` khi login thành công.

---

## B. CLIENT API – `/api/client` (KHÔNG cần auth, dùng cho App khách hàng qua QR)

| Method | Path | Mô tả |
|---|---|---|
| GET | `/client/categories` | Danh sách danh mục đang bán (TrangThai='Đang bán') |
| GET | `/client/menu` | Danh sách món đang bán, kèm danh mục. Query param `?danh_muc=DM001` để filter |
| GET | `/client/menu/{maMonAn}` | Chi tiết 1 món |
| GET | `/client/tables/{maBan}` | Kiểm tra thông tin bàn (tồn tại + trạng thái) — dùng khi load trang sau khi quét QR |
| POST | `/client/orders` | Tạo đơn hàng mới từ giỏ hàng |
| GET | `/client/orders/{maDH}` | Xem trạng thái đơn hàng (để khách theo dõi) |
| GET | `/client/orders/track?sdt=...&ma_ban=...` | Tra cứu đơn hàng gần nhất theo SĐT/bàn |

**POST `/client/orders` request:**
```json
{
  "ma_ban": "Ban01",
  "ten_khach": "Nguyễn Văn A",
  "sdt": "0901111111",
  "hinh_thuc": "Tại bàn",
  "items": [
    { "ma_mon_an": "Mon001", "so_luong": 2, "ghi_chu": "Không cay" },
    { "ma_mon_an": "Mon018", "so_luong": 2 }
  ]
}
```
**Xử lý (transaction):**
1. Validate `ma_ban` tồn tại trong BAN_AN (nếu HinhThuc='Tại bàn')
2. Validate từng `ma_mon_an` đang 'Đang bán'
3. Sinh `MaDH` mới (DH00X)
4. Tạo `DON_HANG` (MaNV = nhân viên trực/mặc định — xem `workflows.md`), `TrangThai` ban đầu cần xem xét = 'Hoàn thành' theo schema hiện tại nhưng về luồng QR thực tế nên thêm trạng thái xử lý riêng (đề xuất, không tự sửa schema)
5. Với mỗi item: sinh `MaCTDH`, lấy `DonGia` hiện tại của món làm `DonGiaTaiThoiDiemBan`, insert `CHI_TIET_DH`
6. Nếu `HinhThuc='Tại bàn'` → update `BAN_AN.TrangThai = 'Có khách'`
7. Trả về đơn hàng đầy đủ (kèm chi tiết, tổng tiền)

**Response:**
```json
{
  "ma_dh": "DH011",
  "trang_thai": "Hoàn thành",
  "tong_tien": 170000,
  "chi_tiet": [ { "ten_mon": "Cơm thố xá xíu", "so_luong": 2, "don_gia": 55000, "tong": 110000 } ]
}
```

---

## C. ADMIN API – `/api/admin` (auth:sanctum, middleware role)

### C1. Quản lý Bàn — `/api/admin/tables` (admin + thu ngân: xem; admin: sửa)
| Method | Path | Mô tả | Quyền |
|---|---|---|---|
| GET | `/admin/tables` | Danh sách bàn + trạng thái | admin, thu ngân |
| POST | `/admin/tables` | Thêm bàn mới | admin |
| PUT | `/admin/tables/{maBan}` | Cập nhật bàn (tên, sức chứa, trạng thái) | admin |
| DELETE | `/admin/tables/{maBan}` | Xóa bàn | admin |
| GET | `/admin/tables/{maBan}/qrcode` | Sinh QR code (trả base64/SVG) cho bàn | admin, thu ngân |

### C2. Danh mục món — `/api/admin/categories`
| Method | Path | Quyền |
|---|---|---|
| GET | `/admin/categories` | admin, thu ngân |
| POST | `/admin/categories` | admin |
| PUT | `/admin/categories/{maDanhMuc}` | admin |
| DELETE | `/admin/categories/{maDanhMuc}` | admin |

### C3. Món ăn — `/api/admin/menu-items`
| Method | Path | Quyền |
|---|---|---|
| GET | `/admin/menu-items` (filter `?danh_muc=`, `?trang_thai=`) | admin, thu ngân |
| POST | `/admin/menu-items` (multipart, có HinhAnh upload) | admin |
| PUT | `/admin/menu-items/{maMonAn}` | admin |
| DELETE | `/admin/menu-items/{maMonAn}` | admin |
| PATCH | `/admin/menu-items/{maMonAn}/toggle-status` | admin |

### C4. Đơn hàng — `/api/admin/orders`
| Method | Path | Mô tả | Quyền |
|---|---|---|---|
| GET | `/admin/orders` (filter `?trang_thai=`, `?ngay=`, `?ma_ban=`) | Danh sách đơn | admin, thu ngân |
| GET | `/admin/orders/{maDH}` | Chi tiết đơn hàng (kèm CHI_TIET_DH, HOA_DON nếu có) | admin, thu ngân |
| PUT | `/admin/orders/{maDH}/status` | Cập nhật trạng thái (Hoàn thành/Đã hủy) | admin, thu ngân |
| POST | `/admin/orders` | Tạo đơn tại quầy (thu ngân tạo trực tiếp) | admin, thu ngân |
| PUT | `/admin/orders/{maDH}/items` | Sửa/thêm/xóa món trong đơn (chưa thanh toán) | admin, thu ngân |

### C5. Hóa đơn — `/api/admin/invoices`
| Method | Path | Mô tả | Quyền |
|---|---|---|---|
| GET | `/admin/invoices` (filter theo ngày, PTTT) | Danh sách hóa đơn | admin, thu ngân |
| GET | `/admin/invoices/{maHD}` | Chi tiết hóa đơn | admin, thu ngân |
| POST | `/admin/invoices` | Tạo hóa đơn cho 1 đơn hàng (thanh toán) | admin, thu ngân |
| GET | `/admin/invoices/{maHD}/print` | Xuất PDF hóa đơn | admin, thu ngân |

**POST `/admin/invoices` request:**
```json
{ "ma_dh": "DH011", "pttt": "Tiền mặt" }
```
**Xử lý:** Tính `ThanhTien` = SUM(CHI_TIET_DH.TongTien WHERE MaDH=...). Sinh `MaHD`. Insert HOA_DON. Nếu đơn 'Tại bàn' → update `BAN_AN.TrangThai = 'Trống'`.

### C6. Nhân viên — `/api/admin/employees` (admin only)
| Method | Path |
|---|---|
| GET/POST | `/admin/employees` |
| PUT/DELETE | `/admin/employees/{maNV}` |

### C7. Tài khoản — `/api/admin/accounts` (admin only)
| Method | Path |
|---|---|
| GET/POST | `/admin/accounts` |
| PUT | `/admin/accounts/{maTK}` (đổi VaiTro, TrangThai, reset password) |
| DELETE | `/admin/accounts/{maTK}` |

### C8. Báo cáo — `/api/admin/reports`
| Method | Path | Mô tả |
|---|---|---|
| GET | `/admin/reports/revenue?from=&to=` | Doanh thu theo khoảng ngày |
| GET | `/admin/reports/top-items?from=&to=&limit=10` | Top món bán chạy |
| GET | `/admin/reports/dashboard` | Tổng quan: doanh thu hôm nay, số đơn, số bàn đang dùng |

---

## QUY ƯỚC CHUNG
- Mọi response lỗi: `{ "message": "...", "errors": {...} }` với HTTP status phù hợp (422 validation, 401 unauth, 403 forbidden, 404 not found)
- Pagination: dùng Laravel paginate, query `?page=`, `?per_page=`
- Tất cả input tiếng Việt cần validate đúng theo CHECK constraint trong DB (ví dụ VaiTro chỉ nhận 'admin' hoặc 'Nhân viên thu ngân')
