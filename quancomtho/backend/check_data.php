<?php
try {
    $pdo = new PDO('mysql:host=127.0.0.1;dbname=QuanComThoAnhNguyen', 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $stmt = $pdo->query('SELECT COUNT(*) FROM hoa_don');
    echo "hoa_don count: " . $stmt->fetchColumn() . "\n";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
