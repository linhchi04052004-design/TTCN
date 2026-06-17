<?php
try {
    $pdo = new PDO('mysql:host=127.0.0.1;dbname=QuanComThoAnhNguyen', 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $stmt = $pdo->query('SHOW TABLES');
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    if (empty($tables)) {
        echo "NO TABLES FOUND\n";
    } else {
        foreach($tables as $t) echo "TABLE: $t\n";
    }
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
