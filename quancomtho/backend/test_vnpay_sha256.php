<?php
date_default_timezone_set('Asia/Ho_Chi_Minh');
$vnp_TmnCode = '4FWETVVD';
$vnp_HashSecret = '51MXM9GJMJJ1YFT01W8U4PKRUQY9M3A0';
$vnp_Url = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
$vnp_ReturnUrl = 'http://localhost:5173/admin/orders';

$inputData = [
    "vnp_Version" => "2.1.0",
    "vnp_TmnCode" => $vnp_TmnCode,
    "vnp_Amount" => 10000000,
    "vnp_Command" => "pay",
    "vnp_CreateDate" => date('YmdHis'),
    "vnp_CurrCode" => "VND",
    "vnp_IpAddr" => "13.13.13.13",
    "vnp_Locale" => "vn",
    "vnp_OrderInfo" => "Test_DH_123",
    "vnp_OrderType" => "other",
    "vnp_ReturnUrl" => $vnp_ReturnUrl,
    "vnp_TxnRef" => "TEST_" . time(),
];

ksort($inputData);
$query = "";
$i = 0;
$hashdata = "";
foreach ($inputData as $key => $value) {
    if ($i == 1) {
        $hashdata .= '&' . urlencode($key) . "=" . urlencode($value);
    } else {
        $hashdata .= urlencode($key) . "=" . urlencode($value);
        $i = 1;
    }
    $query .= urlencode($key) . "=" . urlencode($value) . '&';
}

$vnpSecureHash = hash('sha256', $vnp_HashSecret . $hashdata);
$vnp_Url = $vnp_Url . "?" . $query . 'vnp_SecureHash=' . $vnpSecureHash;

echo $vnp_Url;
