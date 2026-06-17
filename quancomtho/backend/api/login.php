<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Database configuration
$host    = '127.0.0.1';
$port    = '3306';           // Đổi thành 3306
$db      = 'comtho';          
$user    = 'root';
$pass    = '';               // Xóa trắng 
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;port=$port;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    http_response_code(500);
    $errorMsg = $e->getMessage();
    // Convert to UTF-8 to prevent json_encode from failing on Windows MySQL errors
    if (!mb_check_encoding($errorMsg, 'UTF-8')) {
        $errorMsg = mb_convert_encoding($errorMsg, 'UTF-8', 'Windows-1252');
    }
    echo json_encode(['success' => false, 'message' => 'Lỗi kết nối cơ sở dữ liệu: ' . $errorMsg]);
    exit;
}

// Get JSON POST body
$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!isset($data['username']) || !isset($data['password'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Vui lòng cung cấp tên đăng nhập và mật khẩu.']);
    exit;
}

$username = $data['username'];
$password = $data['password'];

// Query user by username
$stmt = $pdo->prepare('SELECT * FROM TAI_KHOAN WHERE TenDangNhap = ?');
$stmt->execute([$username]);
$user = $stmt->fetch();

if ($user) {
    // Check if account is active
    if ($user['TrangThai'] !== 'Hoạt động') {
        echo json_encode(['success' => false, 'message' => 'Tài khoản đã bị vô hiệu hóa.']);
        exit;
    }

    // Verify password hash
    if (password_verify($password, $user['MatKhau'])) {
        // Update last login
        $updateStmt = $pdo->prepare('UPDATE TAI_KHOAN SET LanDangNhapCuoi = NOW() WHERE MaTK = ?');
        $updateStmt->execute([$user['MaTK']]);

        // Success
        echo json_encode([
            'success' => true,
            'message' => 'Đăng nhập thành công',
            'user' => [
                'username' => $user['TenDangNhap'],
                'role' => $user['VaiTro']
            ]
        ]);
    } else {
        // Invalid password
        echo json_encode(['success' => false, 'message' => 'Tên đăng nhập hoặc mật khẩu không chính xác.']);
    }
} else {
    // Invalid username
    echo json_encode(['success' => false, 'message' => 'Tên đăng nhập hoặc mật khẩu không chính xác.']);
}
?>
