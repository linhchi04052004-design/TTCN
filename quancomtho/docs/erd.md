# ERD – Mô tả chi tiết cơ sở dữ liệu `QuanComThoAnhNguyen`

> Database đã được tạo sẵn bằng file `database/sql/QuanComThoAnhNguyen_Final.sql`. KHÔNG thay đổi cấu trúc bảng/cột. Tất cả Model/Migration phải khớp 100% với schema dưới đây.

---

## 1. NHAN_VIEN
| Cột | Kiểu | Ghi chú |
|---|---|---|
| MaNV | NVARCHAR(10) | PK |
| TenNV | NVARCHAR(50) | NOT NULL |
| SDT | NVARCHAR(15) | UNIQUE, NOT NULL |
| GioiTinh | NVARCHAR(10) | Nam/Nữ |
| DiaChi | NVARCHAR(100) | |
| Email | NVARCHAR(50) | UNIQUE |

**Quan hệ:** 1 NHAN_VIEN – 1 TAI_KHOAN, 1 NHAN_VIEN – n DON_HANG

---

## 2. TAI_KHOAN
| Cột | Kiểu | Ghi chú |
|---|---|---|
| MaTK | NVARCHAR(10) | PK |
| TenDangNhap | NVARCHAR(50) | UNIQUE, NOT NULL |
| MatKhau | NVARCHAR(255) | bcrypt hash |
| VaiTro | NVARCHAR(20) | CHECK IN ('admin', 'Nhân viên thu ngân') |
| TrangThai | NVARCHAR(20) | CHECK IN ('Hoạt động', 'Ngừng hoạt động'), default 'Hoạt động' |
| LanDangNhapCuoi | DATETIME | nullable |
| MaNV | NVARCHAR(10) | FK → NHAN_VIEN.MaNV |

**Dùng làm bảng Authenticatable cho Sanctum** (thay cho `users`).

Tài khoản mẫu:
- `admin` / `admin@123` (VaiTro = admin)
- `staff001`/`staff002` / `staff@123` (VaiTro = Nhân viên thu ngân), `staff003` đang Ngừng hoạt động

---

## 3. BAN_AN
| Cột | Kiểu | Ghi chú |
|---|---|---|
| MaBan | NVARCHAR(10) | PK, ví dụ 'Ban01'..'Ban10' |
| TenBan | NVARCHAR(10) | UNIQUE, ví dụ 'Bàn 01' |
| TrangThai | NVARCHAR(20) | CHECK IN ('Trống', 'Có khách'), default 'Trống' |
| SucChua | INT | > 0, số người tối đa |

**Quan hệ:** 1 BAN_AN – n DON_HANG. Dùng `MaBan` để encode trong QR code.

---

## 4. DANH_MUC_MON
| Cột | Kiểu | Ghi chú |
|---|---|---|
| MaDanhMuc | NVARCHAR(10) | PK, ví dụ 'DM001' |
| TenDanhMuc | NVARCHAR(50) | 'Món chính', 'Món ăn kèm', 'Đồ uống' |
| TrangThai | NVARCHAR(20) | CHECK IN ('Đang bán', 'Ngưng bán'), default 'Đang bán' |

**Quan hệ:** 1 DANH_MUC_MON – n MON_AN

---

## 5. MON_AN
| Cột | Kiểu | Ghi chú |
|---|---|---|
| MaMonAn | NVARCHAR(10) | PK, ví dụ 'Mon001' |
| MaDanhMuc | NVARCHAR(10) | FK → DANH_MUC_MON.MaDanhMuc |
| TenMonAn | NVARCHAR(50) | |
| MoTa | NVARCHAR(255) | nullable |
| DonGia | DECIMAL(10,2) | >= 0 |
| HinhAnh | NVARCHAR(255) | tên file ảnh, lưu ở `storage/app/public/menu/` |
| TrangThai | NVARCHAR(20) | CHECK IN ('Đang bán', 'Ngưng bán'), default 'Đang bán' |

**Quan hệ:** n MON_AN – 1 DANH_MUC_MON; 1 MON_AN – n CHI_TIET_DH

---

## 6. DON_HANG
| Cột | Kiểu | Ghi chú |
|---|---|---|
| MaDH | NVARCHAR(20) | PK, ví dụ 'DH001' |
| TenKhach | NVARCHAR(100) | nullable |
| SDT | NVARCHAR(15) | nullable |
| NgayDat | DATE | default CURRENT_DATE |
| HinhThuc | NVARCHAR(20) | CHECK IN ('Tại bàn', 'Mang về'), default 'Tại bàn' |
| TrangThai | NVARCHAR(20) | CHECK IN ('Hoàn thành', 'Đã hủy'), default 'Hoàn thành' |
| MaNV | NVARCHAR(10) | FK → NHAN_VIEN.MaNV (nhân viên xử lý đơn) |
| MaBan | NVARCHAR(10) | FK → BAN_AN.MaBan, nullable (null nếu Mang về) |

**Lưu ý nghiệp vụ:**
- Khi khách đặt qua QR (Client App, chưa login) → `MaNV` cần gán mặc định (ví dụ nhân viên trực ca, hoặc tài khoản hệ thống) — xem `workflows.md`
- Trạng thái 'Hoàn thành'/'Đã hủy' ở đây có thể cần MỞ RỘNG thêm trạng thái trung gian cho luồng QR thực tế (Chờ xác nhận, Đang chế biến, Đã phục vụ...) — AI Agent có thể đề xuất thêm cột `TrangThaiXuLy` riêng nếu cần, nhưng PHẢI giữ nguyên cột `TrangThai` hiện có cho tương thích hóa đơn. Ghi rõ đề xuất này, không tự ý sửa schema nếu chưa xác nhận.

**Quan hệ:** 1 DON_HANG – n CHI_TIET_DH; 1 DON_HANG – 1 HOA_DON (có thể null nếu chưa thanh toán)

---

## 7. CHI_TIET_DH
| Cột | Kiểu | Ghi chú |
|---|---|---|
| MaCTDH | NVARCHAR(10) | PK, ví dụ 'CTDH001' |
| MaDH | NVARCHAR(20) | FK → DON_HANG.MaDH |
| MaMonAn | NVARCHAR(10) | FK → MON_AN.MaMonAn |
| SoLuong | INT | > 0 |
| DonGiaTaiThoiDiemBan | DECIMAL(10,2) | snapshot giá tại thời điểm bán |
| TongTien | DECIMAL(12,2) | **GENERATED ALWAYS AS (SoLuong * DonGiaTaiThoiDiemBan) STORED** — KHÔNG insert/update cột này trực tiếp |
| GhiChu | NVARCHAR(255) | nullable, ví dụ 'Ít đường' |

---

## 8. HOA_DON
| Cột | Kiểu | Ghi chú |
|---|---|---|
| MaHD | NVARCHAR(20) | PK, ví dụ 'HD001' |
| MaDH | NVARCHAR(20) | FK → DON_HANG.MaDH, UNIQUE (1-1) |
| PTTT | NVARCHAR(30) | CHECK IN ('Momo', 'VNPay', 'Tiền mặt'), default 'Tiền mặt' |
| NgayThanhToan | DATETIME | default CURRENT_TIMESTAMP |
| ThanhTien | DECIMAL(12,2) | >= 0, = tổng TongTien của CHI_TIET_DH theo MaDH |

---

## SƠ ĐỒ QUAN HỆ (TỔNG QUAN)

```
NHAN_VIEN 1───1 TAI_KHOAN
NHAN_VIEN 1───n DON_HANG
BAN_AN    1───n DON_HANG
DANH_MUC_MON 1───n MON_AN
MON_AN    1───n CHI_TIET_DH
DON_HANG  1───n CHI_TIET_DH
DON_HANG  1───1 HOA_DON
```

## QUY TẮC SINH MÃ (ID) MỚI
Tất cả PK là string với prefix + số thứ tự, ví dụ:
- NHAN_VIEN: NV001, NV002...
- TAI_KHOAN: TK001...
- BAN_AN: Ban01...
- DANH_MUC_MON: DM001...
- MON_AN: Mon001...
- DON_HANG: DH001...
- CHI_TIET_DH: CTDH001...
- HOA_DON: HD001...

→ Khi tạo bản ghi mới, Laravel cần logic lấy `MAX(id)` hiện tại, parse số, +1, format lại với padding (xem `workflows.md` mục "Sinh mã tự động").
