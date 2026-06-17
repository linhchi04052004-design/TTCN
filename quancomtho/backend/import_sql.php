<?php
$pdo = new PDO('mysql:host=127.0.0.1;dbname=QuanComThoAnhNguyen', 'root', '');
$sql = file_get_contents('d:\PHP\htdocs\quancomtho\quancomtho\backend\database\sql\QuanComThoAnhNguyen_Final.sql');
$pdo->exec($sql);
echo "Import successful!\n";
