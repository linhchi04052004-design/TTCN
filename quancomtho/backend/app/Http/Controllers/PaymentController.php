<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    /**
     * Tạo URL thanh toán VNPay
     */
    public function createVNPay(Request $request)
    {
        $request->validate([
            'mainOrderId' => 'required|string',
            'mergedOrderIds' => 'array',
            'amount' => 'required|numeric|min:1000',
        ]);

        $vnp_TmnCode = '4FWETVVD';
        $vnp_HashSecret = '51MXM9GJMJJ1YFT01W8U4PKRUQY9M3A0';
        $vnp_Url = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
        $vnp_ReturnUrl = 'http://localhost:5173/admin/orders'; 

        $mainOrderId = $request->input('mainOrderId');
        $mergedOrderIds = $request->input('mergedOrderIds', []);
        $amount = $request->input('amount');

        // Encode order info into txnRef for callback
        $orderInfo = json_encode([
            'mainOrderId' => $mainOrderId,
            'mergedOrderIds' => $mergedOrderIds,
        ]);
        $txnRef = $mainOrderId . '_' . time();

        // Lưu thông tin vào session/cache để callback lấy lại
        cache()->put('vnpay_' . $txnRef, $orderInfo, 1800); // 30 phút

        // Kiểm tra IP
        $vnp_IpAddr = $request->ip();
        if ($vnp_IpAddr === '::1' || $vnp_IpAddr === '127.0.0.1' || $vnp_IpAddr === 'localhost') {
            $vnp_IpAddr = '13.13.13.13'; 
        }

        // Fix múi giờ cho chuẩn VNPay
        date_default_timezone_set('Asia/Ho_Chi_Minh');
        
        // Đảm bảo số lượng là nguyên tuyệt đối, không có dấu chấm thập phân
        $vnp_Amount = intval(round((float)$amount * 100));

        $inputData = [
            "vnp_Version" => "2.1.0",
            "vnp_TmnCode" => $vnp_TmnCode,
            "vnp_Amount" => $vnp_Amount, 
            "vnp_Command" => "pay",
            "vnp_CreateDate" => date('YmdHis'),
            "vnp_CurrCode" => "VND",
            "vnp_IpAddr" => $vnp_IpAddr,
            "vnp_Locale" => "vn",
            "vnp_OrderInfo" => "Thanh_toan_DH_" . $mainOrderId,
            "vnp_OrderType" => "other",
            "vnp_ReturnUrl" => $vnp_ReturnUrl,
            "vnp_TxnRef" => $txnRef,
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

        $vnpSecureHash = hash_hmac('sha512', $hashdata, $vnp_HashSecret);
        $vnp_Url = $vnp_Url . "?" . $query . 'vnp_SecureHash=' . $vnpSecureHash;

        return response()->json([
            'success' => true,
            'payUrl' => $vnp_Url,
            'txnRef' => $txnRef
        ]);
    }

    /**
     * VNPay callback (Return URL)
     */
    public function vnpayReturn(Request $request)
    {
        $vnp_HashSecret = env('VNPAY_HASH_SECRET', 'RAOEXHYVSDDIIENYWSLDIIZTANXUXZFJ');
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');

        $inputData = [];
        foreach ($request->all() as $key => $value) {
            if (substr($key, 0, 4) == "vnp_") {
                $inputData[$key] = $value;
            }
        }

        $vnp_SecureHash = $inputData['vnp_SecureHash'] ?? '';
        unset($inputData['vnp_SecureHash']);
        unset($inputData['vnp_SecureHashType']);
        ksort($inputData);

        $hashData = "";
        $i = 0;
        foreach ($inputData as $key => $value) {
            if ($i == 1) {
                $hashData .= '&' . urlencode($key) . "=" . urlencode($value);
            } else {
                $hashData .= urlencode($key) . "=" . urlencode($value);
                $i = 1;
            }
        }

        $secureHash = hash_hmac('sha512', $hashData, $vnp_HashSecret);

        $txnRef = $inputData['vnp_TxnRef'] ?? '';
        $responseCode = $inputData['vnp_ResponseCode'] ?? '99';

        if ($secureHash === $vnp_SecureHash && $responseCode === '00') {
            // Thanh toán thành công - gọi processPayment
            $orderInfoJson = cache()->get('vnpay_' . $txnRef);
            if ($orderInfoJson) {
                $orderInfo = json_decode($orderInfoJson, true);
                cache()->forget('vnpay_' . $txnRef);

                // Gọi hàm processPayment từ OrderController
                $orderController = app(OrderController::class);
                $fakeRequest = new Request([
                    'mainOrderId' => $orderInfo['mainOrderId'],
                    'mergedOrderIds' => $orderInfo['mergedOrderIds'] ?? [],
                    'paymentMethod' => 'VNPay'
                ]);
                $result = $orderController->processPayment($fakeRequest);
                $resultData = json_decode($result->getContent(), true);

                if ($resultData['success']) {
                    return redirect($frontendUrl . '/admin/payment-success/' . $resultData['data']['MaHD']);
                }
            }
            // Fallback - thông tin đã hết hạn
            return redirect($frontendUrl . '/admin/orders?payment=expired');
        } else {
            // Thanh toán thất bại hoặc bị hủy
            return redirect($frontendUrl . '/admin/orders?payment=failed');
        }
    }

    /**
     * Tạo URL thanh toán MoMo
     */
    public function createMoMo(Request $request)
    {
        $request->validate([
            'mainOrderId' => 'required|string',
            'mergedOrderIds' => 'array',
            'amount' => 'required|numeric|min:1000',
        ]);

        $partnerCode = env('MOMO_PARTNER_CODE', 'MOMO');
        $accessKey = env('MOMO_ACCESS_KEY', 'F8BBA842ECF85');
        $secretKey = env('MOMO_SECRET_KEY', 'K951B6PE1waDMi640xX08PD3vg6EkVlz');
        $endpoint = env('MOMO_ENDPOINT', 'https://test-payment.momo.vn/v2/gateway/api/create');
        $returnUrl = env('MOMO_RETURN_URL', 'http://localhost:5173/admin/payment-success');
        $notifyUrl = env('MOMO_NOTIFY_URL', 'http://localhost:8000/api/payment/momo/notify');

        $mainOrderId = $request->input('mainOrderId');
        $mergedOrderIds = $request->input('mergedOrderIds', []);
        $amount = (int) $request->input('amount');

        $orderId = $mainOrderId . '_' . time();
        $requestId = $orderId;
        $orderInfo = "Thanh toan don hang " . $mainOrderId;
        $requestType = "captureWallet";
        $extraData = base64_encode(json_encode([
            'mainOrderId' => $mainOrderId,
            'mergedOrderIds' => $mergedOrderIds,
        ]));

        // Lưu cache để callback xử lý
        cache()->put('momo_' . $orderId, json_encode([
            'mainOrderId' => $mainOrderId,
            'mergedOrderIds' => $mergedOrderIds,
        ]), 1800);

        // Tạo chữ ký
        $rawHash = "accessKey=" . $accessKey
            . "&amount=" . $amount
            . "&extraData=" . $extraData
            . "&ipnUrl=" . $notifyUrl
            . "&orderId=" . $orderId
            . "&orderInfo=" . $orderInfo
            . "&partnerCode=" . $partnerCode
            . "&redirectUrl=" . $returnUrl
            . "&requestId=" . $requestId
            . "&requestType=" . $requestType;

        $signature = hash_hmac("sha256", $rawHash, $secretKey);

        $data = [
            'partnerCode' => $partnerCode,
            'partnerName' => "Quán Cơm Thớ",
            'storeId' => "QuanComTho",
            'requestId' => $requestId,
            'amount' => $amount,
            'orderId' => $orderId,
            'orderInfo' => $orderInfo,
            'redirectUrl' => $returnUrl,
            'ipnUrl' => $notifyUrl,
            'lang' => 'vi',
            'extraData' => $extraData,
            'requestType' => $requestType,
            'signature' => $signature
        ];

        try {
            $ch = curl_init($endpoint);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            curl_setopt($ch, CURLOPT_TIMEOUT, 10);
            $result = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            $jsonResult = json_decode($result, true);

            if (isset($jsonResult['payUrl'])) {
                return response()->json([
                    'success' => true,
                    'payUrl' => $jsonResult['payUrl'],
                    'orderId' => $orderId
                ]);
            } else {
                Log::error('MoMo error: ' . $result);
                return response()->json([
                    'success' => false,
                    'message' => $jsonResult['message'] ?? 'Lỗi kết nối MoMo',
                    'raw' => $jsonResult
                ], 400);
            }
        } catch (\Exception $e) {
            Log::error('MoMo exception: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Lỗi kết nối tới MoMo: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * MoMo IPN callback (notify)
     */
    public function momoNotify(Request $request)
    {
        Log::info('MoMo IPN:', $request->all());

        $resultCode = $request->input('resultCode');
        $orderId = $request->input('orderId');

        if ($resultCode == 0) {
            // Thanh toán thành công
            $orderInfoJson = cache()->get('momo_' . $orderId);
            if ($orderInfoJson) {
                $orderInfo = json_decode($orderInfoJson, true);
                cache()->forget('momo_' . $orderId);

                $orderController = app(OrderController::class);
                $fakeRequest = new Request([
                    'mainOrderId' => $orderInfo['mainOrderId'],
                    'mergedOrderIds' => $orderInfo['mergedOrderIds'] ?? [],
                    'paymentMethod' => 'MoMo'
                ]);
                $orderController->processPayment($fakeRequest);
            }
        }

        // MoMo cần trả về 204 để xác nhận đã nhận
        return response()->noContent();
    }
}
