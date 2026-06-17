# Spec Eloquent Models

Tất cả model đặt trong `app/Models/`. Vì PK là string không tự tăng, mỗi model cần:

```php
protected $table = 'TEN_BANG';
protected $primaryKey = 'MaXxx';
public $incrementing = false;
protected $keyType = 'string';
public $timestamps = false; // các bảng này không có created_at/updated_at
```

---

## 1. NhanVien
- table: `NHAN_VIEN`, PK: `MaNV`
- fillable: MaNV, TenNV, SDT, GioiTinh, DiaChi, Email
- Relationships:
  - `taiKhoan()` → hasOne(TaiKhoan::class, 'MaNV', 'MaNV')
  - `donHangs()` → hasMany(DonHang::class, 'MaNV', 'MaNV')

## 2. TaiKhoan (Authenticatable cho Sanctum)
- table: `TAI_KHOAN`, PK: `MaTK`
- implements `Authenticatable`, dùng trait `HasApiTokens` (Sanctum), `Notifiable`
- fillable: MaTK, TenDangNhap, MatKhau, VaiTro, TrangThai, LanDangNhapCuoi, MaNV
- hidden: ['MatKhau']
- Override:
  - `getAuthPassword()` return `$this->MatKhau`
  - `getAuthIdentifierName()` return 'MaTK'
- Relationships:
  - `nhanVien()` → belongsTo(NhanVien::class, 'MaNV', 'MaNV')
- Helper: `isAdmin()` → `$this->VaiTro === 'admin'`

## 3. BanAn
- table: `BAN_AN`, PK: `MaBan`
- fillable: MaBan, TenBan, TrangThai, SucChua
- Relationships:
  - `donHangs()` → hasMany(DonHang::class, 'MaBan', 'MaBan')

## 4. DanhMucMon
- table: `DANH_MUC_MON`, PK: `MaDanhMuc`
- fillable: MaDanhMuc, TenDanhMuc, TrangThai
- Relationships:
  - `monAns()` → hasMany(MonAn::class, 'MaDanhMuc', 'MaDanhMuc')

## 5. MonAn
- table: `MON_AN`, PK: `MaMonAn`
- fillable: MaMonAn, MaDanhMuc, TenMonAn, MoTa, DonGia, HinhAnh, TrangThai
- casts: DonGia → decimal:2
- Relationships:
  - `danhMuc()` → belongsTo(DanhMucMon::class, 'MaDanhMuc', 'MaDanhMuc')
  - `chiTietDHs()` → hasMany(ChiTietDH::class, 'MaMonAn', 'MaMonAn')
- Append attribute `HinhAnhUrl` → trả về full URL ảnh (asset/storage)

## 6. DonHang
- table: `DON_HANG`, PK: `MaDH`
- fillable: MaDH, TenKhach, SDT, NgayDat, HinhThuc, TrangThai, MaNV, MaBan
- casts: NgayDat → date
- Relationships:
  - `nhanVien()` → belongsTo(NhanVien::class, 'MaNV', 'MaNV')
  - `banAn()` → belongsTo(BanAn::class, 'MaBan', 'MaBan')
  - `chiTietDHs()` → hasMany(ChiTietDH::class, 'MaDH', 'MaDH')
  - `hoaDon()` → hasOne(HoaDon::class, 'MaDH', 'MaDH')
- Accessor: `getTongTienAttribute()` → sum(chiTietDHs.TongTien)

## 7. ChiTietDH
- table: `CHI_TIET_DH`, PK: `MaCTDH`
- fillable: MaCTDH, MaDH, MaMonAn, SoLuong, DonGiaTaiThoiDiemBan, GhiChu
  - **KHÔNG fillable `TongTien`** (generated column, MySQL tự tính)
- casts: DonGiaTaiThoiDiemBan → decimal:2, TongTien → decimal:2
- Relationships:
  - `donHang()` → belongsTo(DonHang::class, 'MaDH', 'MaDH')
  - `monAn()` → belongsTo(MonAn::class, 'MaMonAn', 'MaMonAn')

## 8. HoaDon
- table: `HOA_DON`, PK: `MaHD`
- fillable: MaHD, MaDH, PTTT, NgayThanhToan, ThanhTien
- casts: NgayThanhToan → datetime, ThanhTien → decimal:2
- Relationships:
  - `donHang()` → belongsTo(DonHang::class, 'MaDH', 'MaDH')

---

## GHI CHÚ QUAN TRỌNG
- Vì `$incrementing = false`, khi tạo record mới PHẢI tự set giá trị PK trước khi `save()`. Dùng helper sinh mã (xem `workflows.md`).
- Khi insert vào `CHI_TIET_DH`, sau khi save, gọi `refresh()` để lấy giá trị `TongTien` đã được MySQL tính.
- Sanctum config: trong `config/auth.php`, set `'provider' => 'taikhoans'` và thêm provider tương ứng dùng model `TaiKhoan`.
