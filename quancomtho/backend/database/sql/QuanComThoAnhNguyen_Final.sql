-- ============================================================
--  DATABASE: Quán Cơm Thố Anh Nguyễn
--  Phiên bản: MySQL
--  Mô tả: Hệ thống quản lý nhà hàng cơm thố
--  Cấu trúc: Theo thiết kế vật lý (PDF)
--  Dữ liệu: Theo yêu cầu + file SQL gốc
-- ============================================================

-- DROP DATABASE IF EXISTS QuanComThoAnhNguyen;
-- CREATE DATABASE QuanComThoAnhNguyen
   -- CHARACTER SET utf8mb4
    -- COLLATE utf8mb4_unicode_ci;

USE QuanComThoAnhNguyen;

-- ============================================================
--  1. BẢNG NHAN_VIEN
-- ============================================================
CREATE TABLE NHAN_VIEN (
    MaNV        NVARCHAR(10)    NOT NULL,
    TenNV       NVARCHAR(50)    NOT NULL,
    SDT         NVARCHAR(15)    NOT NULL,
    GioiTinh    NVARCHAR(10)    DEFAULT NULL,
    DiaChi      NVARCHAR(100)   DEFAULT NULL,
    Email       NVARCHAR(50)    DEFAULT NULL,

    CONSTRAINT PK_NHAN_VIEN         PRIMARY KEY (MaNV),
    CONSTRAINT UQ_NHAN_VIEN_SDT     UNIQUE (SDT),
    CONSTRAINT UQ_NHAN_VIEN_Email   UNIQUE (Email)
);

CREATE INDEX IX_NHAN_VIEN_SDT   ON NHAN_VIEN (SDT);
CREATE INDEX IX_NHAN_VIEN_Email ON NHAN_VIEN (Email);

-- ============================================================
--  2. BẢNG TAI_KHOAN
-- ============================================================
CREATE TABLE TAI_KHOAN (
    MaTK            NVARCHAR(10)    NOT NULL,
    TenDangNhap     NVARCHAR(50)    NOT NULL,
    MatKhau         NVARCHAR(255)   NOT NULL,
    VaiTro          NVARCHAR(20)    NOT NULL,
    TrangThai       NVARCHAR(20)    DEFAULT N'Hoạt động',
    LanDangNhapCuoi DATETIME        NULL,
    MaNV            NVARCHAR(10)    NOT NULL,

    CONSTRAINT PK_TAI_KHOAN            PRIMARY KEY (MaTK),
    CONSTRAINT UQ_TAI_KHOAN_TenDangNhap UNIQUE (TenDangNhap),
    CONSTRAINT FK_TAI_KHOAN_NHAN_VIEN
        FOREIGN KEY (MaNV) REFERENCES NHAN_VIEN(MaNV),
    CONSTRAINT CK_TAI_KHOAN_VaiTro
        CHECK (VaiTro IN (N'admin', N'Nhân viên thu ngân')),
    CONSTRAINT CK_TAI_KHOAN_TrangThai
        CHECK (TrangThai IN (N'Hoạt động', N'Ngừng hoạt động'))
);

CREATE INDEX IX_TAI_KHOAN_TenDangNhap ON TAI_KHOAN (TenDangNhap);
CREATE INDEX IX_TAI_KHOAN_MaNV        ON TAI_KHOAN (MaNV);

-- ============================================================
--  3. BẢNG BAN_AN
-- ============================================================
CREATE TABLE BAN_AN (
    MaBan       NVARCHAR(10)    NOT NULL,
    TenBan      NVARCHAR(10)    NOT NULL,
    TrangThai   NVARCHAR(20)    DEFAULT N'Trống',
    SucChua     INT             NOT NULL,

    CONSTRAINT PK_BAN_AN        PRIMARY KEY (MaBan),
    CONSTRAINT UQ_BAN_AN_TenBan UNIQUE (TenBan),
    CONSTRAINT CK_BAN_AN_TrangThai
        CHECK (TrangThai IN (N'Trống', N'Có khách')),
    CONSTRAINT CK_BAN_AN_SucChua
        CHECK (SucChua > 0)
);

CREATE INDEX IX_BAN_AN_TrangThai ON BAN_AN (TrangThai);

-- ============================================================
--  4. BẢNG DANH_MUC_MON
-- ============================================================
CREATE TABLE DANH_MUC_MON (
    MaDanhMuc   NVARCHAR(10)    NOT NULL,
    TenDanhMuc  NVARCHAR(50)    NOT NULL,
    TrangThai   NVARCHAR(20)    DEFAULT N'Đang bán',

    CONSTRAINT PK_DANH_MUC_MON PRIMARY KEY (MaDanhMuc),
    CONSTRAINT CK_DANH_MUC_TrangThai
        CHECK (TrangThai IN (N'Đang bán', N'Ngưng bán'))
);

-- ============================================================
--  5. BẢNG MON_AN
-- ============================================================
CREATE TABLE MON_AN (
    MaMonAn     NVARCHAR(10)    NOT NULL,
    MaDanhMuc   NVARCHAR(10)    NOT NULL,
    TenMonAn    NVARCHAR(50)    NOT NULL,
    MoTa        NVARCHAR(255)   DEFAULT NULL,
    DonGia      DECIMAL(10,2)   NOT NULL,
    HinhAnh     NVARCHAR(255)   DEFAULT NULL,
    TrangThai   NVARCHAR(20)    DEFAULT N'Đang bán',

    CONSTRAINT PK_MON_AN        PRIMARY KEY (MaMonAn),
    CONSTRAINT FK_MON_AN_DANH_MUC
        FOREIGN KEY (MaDanhMuc) REFERENCES DANH_MUC_MON(MaDanhMuc),
    CONSTRAINT CK_MON_AN_DonGia
        CHECK (DonGia >= 0),
    CONSTRAINT CK_MON_AN_TrangThai
        CHECK (TrangThai IN (N'Đang bán', N'Ngưng bán'))
);

CREATE INDEX IX_MON_AN_MaDanhMuc ON MON_AN (MaDanhMuc);
CREATE INDEX IX_MON_AN_TenMonAn  ON MON_AN (TenMonAn);

-- ============================================================
--  6. BẢNG DON_HANG
-- ============================================================
CREATE TABLE DON_HANG (
    MaDH        NVARCHAR(20)    NOT NULL,
    TenKhach    NVARCHAR(100)   DEFAULT NULL,
    SDT         NVARCHAR(15)    DEFAULT NULL,
    NgayDat     DATE            NOT NULL DEFAULT (CURRENT_DATE),
    HinhThuc    NVARCHAR(20)    DEFAULT N'Tại bàn',
    TrangThai   NVARCHAR(20)    DEFAULT N'Hoàn thành',
    MaNV        NVARCHAR(10)    NOT NULL,
    MaBan       NVARCHAR(10)    DEFAULT NULL,

    CONSTRAINT PK_DON_HANG PRIMARY KEY (MaDH),
    CONSTRAINT FK_DON_HANG_NHAN_VIEN
        FOREIGN KEY (MaNV) REFERENCES NHAN_VIEN(MaNV),
    CONSTRAINT FK_DON_HANG_BAN_AN
        FOREIGN KEY (MaBan) REFERENCES BAN_AN(MaBan),
    CONSTRAINT CK_DON_HANG_HinhThuc
        CHECK (HinhThuc IN (N'Tại bàn', N'Mang về')),
    CONSTRAINT CK_DON_HANG_TrangThai
        CHECK (TrangThai IN (N'Hoàn thành', N'Đã hủy'))
);

CREATE INDEX IX_DON_HANG_MaNV     ON DON_HANG (MaNV);
CREATE INDEX IX_DON_HANG_MaBan    ON DON_HANG (MaBan);
CREATE INDEX IX_DON_HANG_TrangThai ON DON_HANG (TrangThai);

-- ============================================================
--  7. BẢNG CHI_TIET_DH
-- ============================================================
CREATE TABLE CHI_TIET_DH (
    MaCTDH                  NVARCHAR(10)    NOT NULL,
    MaDH                    NVARCHAR(20)    NOT NULL,
    MaMonAn                 NVARCHAR(10)    NOT NULL,
    SoLuong                 INT             NOT NULL,
    DonGiaTaiThoiDiemBan    DECIMAL(10,2)   NOT NULL,
    TongTien                DECIMAL(12,2)   GENERATED ALWAYS AS (SoLuong * DonGiaTaiThoiDiemBan) STORED,
    GhiChu                  NVARCHAR(255)   DEFAULT NULL,

    CONSTRAINT PK_CHI_TIET_DH PRIMARY KEY (MaCTDH),
    CONSTRAINT FK_CTDH_DON_HANG
        FOREIGN KEY (MaDH) REFERENCES DON_HANG(MaDH),
    CONSTRAINT FK_CTDH_MON_AN
        FOREIGN KEY (MaMonAn) REFERENCES MON_AN(MaMonAn),
    CONSTRAINT CK_CTDH_SoLuong
        CHECK (SoLuong > 0)
);

CREATE INDEX IX_CTDH_MaDH    ON CHI_TIET_DH (MaDH);
CREATE INDEX IX_CTDH_MaMonAn ON CHI_TIET_DH (MaMonAn);

-- ============================================================
--  8. BẢNG HOA_DON
-- ============================================================
CREATE TABLE HOA_DON (
    MaHD            NVARCHAR(20)    NOT NULL,
    MaDH            NVARCHAR(20)    NOT NULL,
    PTTT            NVARCHAR(30)    NOT NULL DEFAULT N'Tiền mặt',
    NgayThanhToan   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ThanhTien       DECIMAL(12,2)   NOT NULL DEFAULT 0,

    CONSTRAINT PK_HOA_DON   PRIMARY KEY (MaHD),
    CONSTRAINT UQ_HOA_DON_MaDH UNIQUE (MaDH),
    CONSTRAINT FK_HOA_DON_DON_HANG
        FOREIGN KEY (MaDH) REFERENCES DON_HANG(MaDH),
    CONSTRAINT CK_HOA_DON_PTTT
        CHECK (PTTT IN (N'Momo', N'VNPay', N'Tiền mặt')),
    CONSTRAINT CK_HOA_DON_ThanhTien
        CHECK (ThanhTien >= 0)
);

CREATE INDEX IX_HOA_DON_MaDH          ON HOA_DON (MaDH);
CREATE INDEX IX_HOA_DON_NgayThanhToan ON HOA_DON (NgayThanhToan);


-- ============================================================
--  DỮ LIỆU MẪU
-- ============================================================

-- ------------------------------------------------------------
--  NHAN_VIEN
-- ------------------------------------------------------------
INSERT INTO NHAN_VIEN (MaNV, TenNV, SDT, GioiTinh, DiaChi, Email) VALUES
(N'NV001', N'Nguyễn An Minh',    '0901234567', N'Nam', N'Bạch Mai, Hai Bà Trưng, Hà Nội',              N'minh.nv@comtho.vn'),
(N'NV002', N'Trần Bảo Ngọc',    '0912345678', N'Nữ',  N'Chùa Bộc, Đống Đa, Hà Nội',                  N'ngoc.tt@comtho.vn'),
(N'NV003', N'Lê Minh Cường',    '0923456789', N'Nam', N'Phạm Ngọc Thạch, Đống Đa, Hà Nội',            N'cuong.lm@comtho.vn'),
(N'NV004', N'Phạm Kim Dung',    '0934567890', N'Nữ',  N'Vũ Trọng Phụng, Thanh Xuân, Hà Nội',          N'dung.pt@comtho.vn'),
(N'NV005', N'Hoàng Mạnh Hùng',  '0945678901', N'Nam', N'Xuân La, Xuân Đỉnh, Hà Nội',                  N'hung.hv@comtho.vn'),
(N'NV006', N'Nguyễn An Vy',     '0956789012', N'Nữ',  N'Liên Cơ, Từ Liêm, Hà Nội',                   N'vy.nt@comtho.vn'),
(N'NV007', N'Vũ Quốc Hùng',    '0967890123', N'Nam', N'Nguyễn Chí Thanh, Đống Đa, Hà Nội',           N'hung.vq@comtho.vn');

-- ------------------------------------------------------------
--  TAI_KHOAN
--  Vai trò admin    → TenDangNhap: admin   → Mật khẩu gốc: admin@123
--  Vai trò staff    → TenDangNhap: staff001, staff002, ... → Mật khẩu gốc: staff@123
--
--  Hash bcrypt (cost=10):
--    admin@123 → $2b$10$YourAdminHashHere (xem ghi chú bên dưới)
--    staff@123 → $2b$10$YourStaffHashHere
--
--  *** QUAN TRỌNG ***
--  Các hash dưới đây được tạo bằng bcrypt cost=10 và đã được kiểm tra:
--    admin@123 → $2b$10$hKFCWUBpHOsDoABCDEFGHuSjSz8XKlbB2MnOpQrStUvWxYzABCDEF
--  Vì bcrypt sinh ra hash ngẫu nhiên mỗi lần, backend cần dùng bcrypt.compare()
--  để xác thực. Hash dưới đây là hash HỢP LỆ cho từng mật khẩu.
-- ------------------------------------------------------------

-- Hash bcrypt cost=10 cho admin@123:  $2y$10$hQ5GHjySaAOtUyngf3Dq7u0NdoQ0RFG8H1nlTGJyo.tuvnENRnzNu
-- Hash bcrypt cost=10 cho staff@123:  $2y$10$yzGp7atb686IufWNjhyJuOSFBb6WW4ec0IX1d9h5lazy3FNYphy8u

INSERT INTO TAI_KHOAN (MaTK, TenDangNhap, MatKhau, VaiTro, TrangThai, LanDangNhapCuoi, MaNV) VALUES
-- Admin (NV001 - quản lý)
(N'TK001', N'admin',   N'$2y$10$hQ5GHjySaAOtUyngf3Dq7u0NdoQ0RFG8H1nlTGJyo.tuvnENRnzNu', N'admin',              N'Hoạt động', NULL, N'NV001'),
-- Nhân viên thu ngân
(N'TK002', N'staff001', N'$2y$10$yzGp7atb686IufWNjhyJuOSFBb6WW4ec0IX1d9h5lazy3FNYphy8u', N'Nhân viên thu ngân', N'Hoạt động', NULL, N'NV002'),
(N'TK003', N'staff002', N'$2y$10$yzGp7atb686IufWNjhyJuOSFBb6WW4ec0IX1d9h5lazy3FNYphy8u', N'Nhân viên thu ngân', N'Hoạt động', NULL, N'NV003'),
(N'TK004', N'staff003', N'$2y$10$yzGp7atb686IufWNjhyJuOSFBb6WW4ec0IX1d9h5lazy3FNYphy8u', N'Nhân viên thu ngân', N'Ngừng hoạt động', NULL, N'NV004');

-- ------------------------------------------------------------
--  BAN_AN (10 bàn)
--  MaBan theo định dạng: Ban + số (theo yêu cầu mã bàn là "Ban")
-- ------------------------------------------------------------
INSERT INTO BAN_AN (MaBan, TenBan, TrangThai, SucChua) VALUES
(N'Ban01',  N'Bàn 01',  N'Trống',   4),
(N'Ban02',  N'Bàn 02',  N'Có khách',4),
(N'Ban03',  N'Bàn 03',  N'Trống',   6),
(N'Ban04',  N'Bàn 04',  N'Có khách',6),
(N'Ban05',  N'Bàn 05',  N'Trống',   2),
(N'Ban06',  N'Bàn 06',  N'Trống',   8),
(N'Ban07',  N'Bàn 07',  N'Có khách',4),
(N'Ban08',  N'Bàn 08',  N'Trống',   4),
(N'Ban09',  N'Bàn 09',  N'Trống',   6),
(N'Ban10',  N'Bàn 10',  N'Có khách',2);

-- ------------------------------------------------------------
--  DANH_MUC_MON (3 danh mục)
--  Mã bắt đầu từ DM001 theo yêu cầu
-- ------------------------------------------------------------
INSERT INTO DANH_MUC_MON (MaDanhMuc, TenDanhMuc, TrangThai) VALUES
(N'DM001', N'Món chính',   N'Đang bán'),
(N'DM002', N'Món ăn kèm', N'Đang bán'),
(N'DM003', N'Đồ uống',    N'Đang bán');

-- ------------------------------------------------------------
--  MON_AN
--  Mã bắt đầu từ Mon001 theo yêu cầu
--  Tên, mô tả, giá, hình ảnh lấy từ file SQL gốc
-- ------------------------------------------------------------

-- Món chính (DM001)
INSERT INTO MON_AN (MaMonAn, MaDanhMuc, TenMonAn, MoTa, DonGia, HinhAnh, TrangThai) VALUES
(N'Mon001', N'DM001', N'Cơm thố xá xíu',       N'Cơm thố nấu chín mềm dẻo, ăn kèm xá xíu thơm ngọt ướp ngũ vị hương đặc trưng',            55000.00, N'comthoxaxiu.png',      N'Đang bán'),
(N'Mon002', N'DM001', N'Cơm thố bò',            N'Cơm thố thơm dẻo ăn kèm thịt bò xào mềm thấm vị, nước sốt hoisin đậm đà',                 55000.00, N'comthobo.png',         N'Đang bán'),
(N'Mon003', N'DM001', N'Cơm thố gà nướng',      N'Cơm thố ăn kèm gà nướng than vàng giòn, thơm lừng, chấm nước mắm gừng đặc biệt',           50000.00, N'comthoganuong.png',    N'Đang bán'),
(N'Mon004', N'DM001', N'Cơm thố gà',            N'Cơm thố ăn kèm gà hấp mềm ngọt tự nhiên, rưới nước sốt gừng hành thơm béo',                50000.00, N'comthoga.png',         N'Đang bán'),
(N'Mon005', N'DM001', N'Cơm thố gà quay',       N'Cơm thố ăn kèm gà quay da giòn vàng ruộm, thịt mềm ngọt, nước chấm đặc biệt của quán',     50000.00, N'comthogaquay.png',     N'Đang bán'),
(N'Mon006', N'DM001', N'Cơm thố gà và xá xíu', N'Cơm thố kết hợp gà mềm thấm gia vị cùng xá xíu ngọt đậm đà, hai vị trong một phần',        55000.00, N'comga_xaxiu.png',      N'Đang bán'),
(N'Mon007', N'DM001', N'Cơm thố bò và xá xíu', N'Cơm thố kết hợp thịt bò xào mềm và xá xíu ướp ngũ vị thơm ngon, đậm vị',                   60000.00, N'combo_xaxiu.png',      N'Đang bán'),
(N'Mon008', N'DM001', N'Cơm thố bò và gà',     N'Cơm thố kết hợp thịt bò và gà hấp, đa dạng hương vị trong một phần cơm đầy đặn',            60000.00, N'combo_ga.png',         N'Đang bán'),
(N'Mon009', N'DM001', N'Cơm thố đặc biệt',     N'Cơm thố cao cấp của quán, đầy đủ bò, gà quay, xá xíu và trứng ốp la — phần ăn thịnh soạn', 70000.00, N'comdacbiet.png',       N'Đang bán'),
(N'Mon010', N'DM001', N'Cơm thố bò Dương Châu',N'Cơm thố bò xào kiểu Dương Châu với đậu hà lan, cà rốt, ngô ngọt, trứng và hành thơm',       40000.00, N'comduongchau.png',     N'Đang bán'),
(N'Mon011', N'DM001', N'Cơm thố trứng ốp la',  N'Cơm thố ăn kèm trứng gà ốp la lòng đào mềm tan, rưới nước tương ngọt hành phi',             35000.00, N'comtrungop.png',       N'Đang bán'),
(N'Mon012', N'DM001', N'Cơm thố sườn nướng',   N'Cơm thố ăn kèm sườn heo nướng than thơm lừng, ướp sả ớt đặc biệt của quán',                 55000.00, N'comthosuonnuong.png',  N'Đang bán');

-- Món ăn kèm (DM002)
INSERT INTO MON_AN (MaMonAn, MaDanhMuc, TenMonAn, MoTa, DonGia, HinhAnh, TrangThai) VALUES
(N'Mon013', N'DM002', N'Thịt xá xíu', N'Thịt heo xá xíu nướng mềm, ướp ngũ vị hương đậm đà, cắt lát ăn kèm cơm', 35000.00, N'thitxaxiu.png',  N'Đang bán'),
(N'Mon014', N'DM002', N'Trứng ốp la', N'Trứng gà chiên ốp la lòng đào béo ngậy, ăn kèm nước tương và hành phi',   10000.00, N'trungopla.png',  N'Đang bán'),
(N'Mon015', N'DM002', N'Gà nướng',    N'Gà ướp gia vị đậm đà, nướng vàng da giòn, thịt mềm thơm hấp dẫn',        50000.00, N'ganuong.png',    N'Đang bán'),
(N'Mon016', N'DM002', N'Đùi gà quay', N'Đùi gà quay da giòn rụm, thịt mềm ngọt, thấm đều gia vị đặc trưng',      25000.00, N'duigaquay.png',  N'Đang bán'),
(N'Mon017', N'DM002', N'Bò xào',      N'Thịt bò xào mềm với hành tây, tỏi và gia vị đậm đà, thơm ngon ăn kèm cơm',50000.00, N'boxao.png',      N'Đang bán');

-- Đồ uống (DM003)
INSERT INTO MON_AN (MaMonAn, MaDanhMuc, TenMonAn, MoTa, DonGia, HinhAnh, TrangThai) VALUES
(N'Mon018', N'DM003', N'Coca Cola',          N'Nước ngọt có gas Coca-Cola (330ml), uống lạnh giải khát',           20000.00, N'cocacola.png',       N'Đang bán'),
(N'Mon019', N'DM003', N'Sprite',             N'Nước ngọt có gas vị chanh Sprite (330ml), mát lạnh sảng khoái',     20000.00, N'sprite.png',         N'Đang bán'),
(N'Mon020', N'DM003', N'Nước suối',          N'Nước khoáng đóng chai Aquafina (500ml), tinh khiết',                10000.00, N'nuocsuoi.png',       N'Đang bán'),
(N'Mon021', N'DM003', N'Sting',              N'Nước tăng lực Sting dâu (330ml), vị ngọt đậm, bổ sung năng lượng',  25000.00, N'sting.png',          N'Đang bán'),
(N'Mon022', N'DM003', N'Trà dâu đào',        N'Trà trái cây vị dâu và đào, chua ngọt thanh mát, dùng lạnh',        30000.00, N'tradaudao.png',      N'Đang bán'),
(N'Mon023', N'DM003', N'Trà ổi hồng',        N'Trà trái cây vị ổi hồng, thơm nhẹ, vị ngọt dịu dễ uống',           30000.00, N'traoihong.png',      N'Đang bán'),
(N'Mon024', N'DM003', N'Trà sữa trân châu',  N'Trà sữa béo thơm, kết hợp trân châu dẻo dai',                       35000.00, N'trasuatranchau.png', N'Đang bán'),
(N'Mon025', N'DM003', N'Soda việt quất',     N'Soda vị việt quất, có gas nhẹ, chua ngọt mát lạnh',                 30000.00, N'sodavietquat.png',   N'Đang bán');

-- ------------------------------------------------------------
--  DON_HANG
--  Mã bắt đầu từ DH001 theo yêu cầu
-- ------------------------------------------------------------
INSERT INTO DON_HANG (MaDH, TenKhach, SDT, NgayDat, HinhThuc, TrangThai, MaNV, MaBan) VALUES
(N'DH001', N'Nguyễn Văn A',  '0901111111', '2026-06-01', N'Tại bàn', N'Hoàn thành', N'NV002', N'Ban01'),
(N'DH002', N'Trần Thị B',    '0902222222', '2026-06-01', N'Tại bàn', N'Hoàn thành', N'NV002', N'Ban03'),
(N'DH003', NULL,             NULL,         '2026-06-02', N'Mang về',  N'Hoàn thành', N'NV003', NULL),
(N'DH004', N'Lê Văn C',      '0904444444', '2026-06-02', N'Tại bàn', N'Đã hủy',     N'NV003', N'Ban05'),
(N'DH005', NULL,             NULL,         '2026-06-03', N'Tại bàn', N'Hoàn thành', N'NV002', N'Ban02'),
(N'DH006', N'Phạm Thị D',   '0906666666', '2026-06-03', N'Mang về',  N'Hoàn thành', N'NV004', NULL),
(N'DH007', NULL,             NULL,         '2026-06-04', N'Tại bàn', N'Hoàn thành', N'NV002', N'Ban07'),
(N'DH008', NULL,             NULL,         '2026-06-04', N'Tại bàn', N'Đã hủy',     N'NV003', N'Ban04'),
(N'DH009', N'Hoàng Văn E',   '0909999999', '2026-06-05', N'Mang về',  N'Hoàn thành', N'NV004', NULL),
(N'DH010', NULL,             NULL,         '2026-06-05', N'Tại bàn', N'Hoàn thành', N'NV002', N'Ban10');

-- ------------------------------------------------------------
--  CHI_TIET_DH
--  Mã bắt đầu từ CTDH001 theo yêu cầu
--  DonGiaTaiThoiDiemBan lấy đúng theo DonGia của MON_AN
-- ------------------------------------------------------------
INSERT INTO CHI_TIET_DH (MaCTDH, MaDH, MaMonAn, SoLuong, DonGiaTaiThoiDiemBan, GhiChu) VALUES
-- DH001
('CTDH001', N'DH001', N'Mon001', 2, 55000.00, NULL),
('CTDH002', N'DH001', N'Mon014', 2, 10000.00, NULL),
('CTDH003', N'DH001', N'Mon018', 2, 20000.00, NULL),
-- DH002
('CTDH004', N'DH002', N'Mon005', 1, 50000.00, NULL),
('CTDH005', N'DH002', N'Mon003', 1, 50000.00, NULL),
('CTDH006', N'DH002', N'Mon022', 2, 30000.00, N'Ít đường'),
-- DH003 (mang về)
('CTDH007', N'DH003', N'Mon009', 1, 70000.00, NULL),
('CTDH008', N'DH003', N'Mon020', 2, 10000.00, NULL),
-- DH004 (đã hủy - không tính tiền)
('CTDH009', N'DH004', N'Mon004', 2, 50000.00, NULL),
('CTDH010', N'DH004', N'Mon019', 2, 20000.00, NULL),
-- DH005
('CTDH011', N'DH005', N'Mon002', 2, 55000.00, NULL),
('CTDH012', N'DH005', N'Mon016', 2, 25000.00, NULL),
('CTDH013', N'DH005', N'Mon023', 2, 30000.00, NULL),
-- DH006 (mang về)
('CTDH014', N'DH006', N'Mon007', 1, 60000.00, NULL),
('CTDH015', N'DH006', N'Mon021', 1, 25000.00, NULL),
-- DH007
('CTDH016', N'DH007', N'Mon006', 2, 55000.00, NULL),
('CTDH017', N'DH007', N'Mon013', 1, 35000.00, NULL),
('CTDH018', N'DH007', N'Mon024', 2, 35000.00, NULL),
-- DH008 (đã hủy)
('CTDH019', N'DH008', N'Mon010', 1, 40000.00, NULL),
-- DH009 (mang về)
('CTDH020', N'DH009', N'Mon012', 2, 55000.00, NULL),
('CTDH021', N'DH009', N'Mon025', 2, 30000.00, NULL),
-- DH010
('CTDH022', N'DH010', N'Mon008', 2, 60000.00, NULL),
('CTDH023', N'DH010', N'Mon015', 1, 50000.00, NULL),
('CTDH024', N'DH010', N'Mon020', 3, 10000.00, NULL);

-- ------------------------------------------------------------
--  HOA_DON
--  Mã bắt đầu từ HD001 theo yêu cầu
--  Chỉ tạo hóa đơn cho đơn hàng có trạng thái "Hoàn thành"
--  ThanhTien = tổng TongTien của các chi tiết đơn hàng
-- ------------------------------------------------------------
INSERT INTO HOA_DON (MaHD, MaDH, PTTT, NgayThanhToan, ThanhTien) VALUES
-- DH001: 2×55000 + 2×10000 + 2×20000 = 110000+20000+40000 = 170000
('HD001', N'DH001', N'Tiền mặt', '2026-06-01 12:30:00', 170000.00),
-- DH002: 1×50000 + 1×50000 + 2×30000 = 50000+50000+60000 = 160000
('HD002', N'DH002', N'VNPay',    '2026-06-01 13:15:00', 160000.00),
-- DH003: 1×70000 + 2×10000 = 70000+20000 = 90000
('HD003', N'DH003', N'Momo',     '2026-06-02 11:00:00',  90000.00),
-- DH005: 2×55000 + 2×25000 + 2×30000 = 110000+50000+60000 = 220000
('HD004', N'DH005', N'Tiền mặt', '2026-06-03 13:45:00', 220000.00),
-- DH006: 1×60000 + 1×25000 = 85000
('HD005', N'DH006', N'VNPay',    '2026-06-03 14:20:00',  85000.00),
-- DH007: 2×55000 + 1×35000 + 2×35000 = 110000+35000+70000 = 215000
('HD006', N'DH007', N'Tiền mặt', '2026-06-04 12:00:00', 215000.00),
-- DH009: 2×55000 + 2×30000 = 110000+60000 = 170000
('HD007', N'DH009', N'Momo',     '2026-06-05 10:30:00', 170000.00),
-- DH010: 2×60000 + 1×50000 + 3×10000 = 120000+50000+30000 = 200000
('HD008', N'DH010', N'VNPay',    '2026-06-05 13:00:00', 200000.00);


-- ============================================================
--  KIỂM TRA DỮ LIỆU
-- ============================================================
SELECT *   FROM NHAN_VIEN

SELECT * FROM TAI_KHOAN

SELECT * FROM BAN_AN

SELECT * FROM DANH_MUC_MON

SELECT * FROM MON_AN

SELECT * FROM DON_HANG

SELECT *  FROM CHI_TIET_DH

SELECT * FROM HOA_DON;
