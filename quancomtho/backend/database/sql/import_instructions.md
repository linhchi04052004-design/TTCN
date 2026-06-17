# Hướng dẫn import database

File `QuanComThoAnhNguyen_Final.sql` đã chứa đầy đủ:
- `CREATE DATABASE QuanComThoAnhNguyen`
- 8 bảng với đầy đủ PK/FK/CHECK/INDEX/GENERATED COLUMN
- Dữ liệu mẫu

## Cách import

```bash
mysql -u root -p < database/sql/QuanComThoAnhNguyen_Final.sql
```

Hoặc qua phpMyAdmin/HeidiSQL/DBeaver: import file `.sql` trực tiếp.

## Sau khi import

1. Cập nhật `backend/.env`:
```
DB_DATABASE=QuanComThoAnhNguyen
```

2. **KHÔNG** chạy `php artisan migrate` để tạo bảng từ đầu (sẽ xung đột vì bảng đã tồn tại).
   - Nếu cần migrations để version-control schema, tạo migration "no-op" kiểu `Schema::hasTable()` check, hoặc dùng `php artisan schema:dump` sau khi import để sinh `database/schema/mysql-schema.sql` cho mục đích tracking.
   - Khuyến nghị: tạo các migration "documentation only" (không thực thi DDL thật) tương ứng từng bảng để Eloquent + AI Agent dễ tham chiếu, đặt comment rõ "Bảng này đã được tạo qua file SQL gốc, migration này chỉ mang tính mô tả".

3. Vẫn cần `php artisan migrate` cho các bảng phụ trợ của Laravel (nếu dùng):
   - `personal_access_tokens` (Sanctum) — bảng này KHÔNG có trong file SQL gốc, cần migrate riêng:
     ```bash
     php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
     php artisan migrate
     ```
   - `cache`, `jobs`, `sessions` nếu dùng (optional, tùy nhu cầu)

## Lưu ý về `CHI_TIET_DH.TongTien`
Đây là `GENERATED ALWAYS AS (SoLuong * DonGiaTaiThoiDiemBan) STORED`. Khi tạo Eloquent model:
- KHÔNG đưa `TongTien` vào `$fillable`
- Sau khi `create()`, gọi `->refresh()` hoặc query lại để lấy giá trị đã tính
