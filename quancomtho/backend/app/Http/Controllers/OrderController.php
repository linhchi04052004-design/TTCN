<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\DonHang;
use App\Models\BanAn;
use App\Models\HoaDon;
use App\Models\MonAn;
use App\Models\ChiTietDH;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class OrderController extends Controller
{
    /**
     * Lấy danh sách đơn hàng chưa thanh toán
     */
    public function index(Request $request)
    {
        $query = DonHang::where('TrangThai', 'Hoàn thành')
            ->doesntHave('hoaDon')
            ->with(['chiTiet.monAn', 'nhanVien', 'banAn'])
            ->orderBy('NgayDat', 'desc')
            ->orderBy('MaDH', 'desc');

        // Lọc theo bàn nếu có
        if ($request->has('maBan') && !empty($request->maBan)) {
            $query->where('MaBan', $request->maBan);
        }

        $orders = $query->get();

        return response()->json([
            'success' => true,
            'data' => $orders
        ]);
    }

    /**
     * Lấy chi tiết 1 đơn hàng
     */
    public function show($maDH)
    {
        $order = DonHang::with(['chiTiet.monAn', 'nhanVien', 'banAn', 'hoaDon'])
            ->where('MaDH', $maDH)
            ->first();

        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy đơn hàng'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $order
        ]);
    }

    /**
     * Helper tạo mã đơn hàng mới
     */
    private function generateOrderCode()
    {
        $lastOrder = DonHang::orderBy('MaDH', 'desc')->first();
        if (!$lastOrder) return 'DH001';

        $lastNumber = intval(substr($lastOrder->MaDH, 2));
        $newNumber = $lastNumber + 1;
        return 'DH' . str_pad($newNumber, 3, '0', STR_PAD_LEFT);
    }
    
    /**
     * Helper tạo mã hóa đơn mới
     */
    private function generateInvoiceCode()
    {
        $lastInvoice = HoaDon::orderBy('MaHD', 'desc')->first();
        if (!$lastInvoice) return 'HD001';

        $lastNumber = intval(substr($lastInvoice->MaHD, 2));
        $newNumber = $lastNumber + 1;
        return 'HD' . str_pad($newNumber, 3, '0', STR_PAD_LEFT);
    }

    /**
     * Helper tạo mã CTDH mới
     */
    private function generateCTDHCode()
    {
        $last = ChiTietDH::orderBy('MaCTDH', 'desc')->first();
        if (!$last) return 'CTDH001';

        $lastNumber = intval(substr($last->MaCTDH, 4));
        $newNumber = $lastNumber + 1;
        return 'CTDH' . str_pad($newNumber, 3, '0', STR_PAD_LEFT);
    }

    /**
     * Tạo đơn mang về
     */
    public function storeTakeaway(Request $request)
    {
        $request->validate([
            'TenKhach' => 'nullable|string',
        ]);

        $maDH = $this->generateOrderCode();
        // Giả lập nhân viên tạo là NV002 do chưa có auth toàn diện
        $maNV = 'NV002'; 

        $order = DonHang::create([
            'MaDH' => $maDH,
            'TenKhach' => $request->input('TenKhach', 'Khách vãng lai'),
            'HinhThuc' => 'Mang về',
            'TrangThai' => 'Hoàn thành', // Trạng thái mặc định khi tạo mới
            'MaNV' => $maNV,
            'NgayDat' => date('Y-m-d')
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Tạo đơn mang về thành công',
            'data' => $order
        ]);
    }

    /**
     * Tạo đơn tại bàn
     */
    public function storeTableOrder(Request $request, $maBan)
    {
        $ban = BanAn::find($maBan);
        if (!$ban || $ban->TrangThai !== 'Trống') {
            return response()->json(['success' => false, 'message' => 'Bàn không trống hoặc không tồn tại'], 400);
        }

        DB::beginTransaction();
        try {
            $maDH = $this->generateOrderCode();
            $maNV = 'NV002'; // Giả lập

            $order = DonHang::create([
                'MaDH' => $maDH,
                'HinhThuc' => 'Tại bàn',
                'TrangThai' => 'Hoàn thành',
                'MaNV' => $maNV,
                'MaBan' => $maBan,
                'NgayDat' => date('Y-m-d')
            ]);

            // Cập nhật trạng thái bàn
            $ban->update(['TrangThai' => 'Có khách']);

            DB::commit();
            return response()->json([
                'success' => true,
                'message' => 'Tạo đơn tại bàn thành công',
                'data' => $order
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Thanh toán đơn hàng
     */
    public function pay(Request $request, $maDH)
    {
        $order = DonHang::where('MaDH', $maDH)->where('TrangThai', 'Hoàn thành')->first();
        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy đơn hàng cần thanh toán'], 404);
        }

        DB::beginTransaction();
        try {
            $maHD = $this->generateInvoiceCode();
            $tongTien = 0; // Trong thực tế tính từ chi tiết, tạm thời gán 0 hoặc tính query sum
            $chiTiet = $order->chiTiet;
            foreach ($chiTiet as $ct) {
                // Computed attribute TongTien if possible, or manual calculate
                $tongTien += ($ct->SoLuong * $ct->DonGiaTaiThoiDiemBan);
            }

            HoaDon::create([
                'MaHD' => $maHD,
                'MaDH' => $maDH,
                'PTTT' => 'Tiền mặt', // Mặc định tiền mặt
                'ThanhTien' => $tongTien,
                'NgayThanhToan' => Carbon::now()
            ]);

            // Cập nhật bàn trống nếu là đơn tại bàn và không còn đơn nào khác chưa thanh toán
            if ($order->MaBan) {
                $unpaidOrders = DonHang::where('MaBan', $order->MaBan)
                    ->where('TrangThai', 'Hoàn thành')
                    ->doesntHave('hoaDon')
                    ->count();
                if ($unpaidOrders == 0) {
                    BanAn::where('MaBan', $order->MaBan)->update(['TrangThai' => 'Trống']);
                }
            }

            DB::commit();
            return response()->json(['success' => true, 'message' => 'Thanh toán thành công']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Hủy đơn hàng
     */
    public function cancel($maDH)
    {
        $order = DonHang::where('MaDH', $maDH)->where('TrangThai', 'Hoàn thành')->first();
        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy đơn hàng hợp lệ'], 404);
        }

        DB::beginTransaction();
        try {
            $order->update(['TrangThai' => 'Đã hủy']);

            // Cập nhật bàn trống nếu là đơn tại bàn và không còn đơn nào khác chưa thanh toán
            if ($order->MaBan) {
                $unpaidOrders = DonHang::where('MaBan', $order->MaBan)
                    ->where('TrangThai', 'Hoàn thành')
                    ->doesntHave('hoaDon')
                    ->count();
                if ($unpaidOrders == 0) {
                    BanAn::where('MaBan', $order->MaBan)->update(['TrangThai' => 'Trống']);
                }
            }

            DB::commit();
            return response()->json(['success' => true, 'message' => 'Hủy đơn thành công']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Xử lý thanh toán có gộp đơn
     */
    public function processPayment(Request $request)
    {
        $request->validate([
            'mainOrderId' => 'required|string',
            'mergedOrderIds' => 'array',
            'paymentMethod' => 'required|string'
        ]);

        $mainOrderId = $request->input('mainOrderId');
        $mergedOrderIds = $request->input('mergedOrderIds') ?? [];
        $paymentMethod = $request->input('paymentMethod');

        $mainOrder = DonHang::where('MaDH', $mainOrderId)->where('TrangThai', 'Hoàn thành')->first();
        if (!$mainOrder) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy đơn hàng chính hợp lệ'], 404);
        }

        DB::beginTransaction();
        try {
            // Danh sách các bàn cần kiểm tra trạng thái sau khi gộp và thanh toán
            $tablesToCheck = [];
            if ($mainOrder->MaBan) {
                $tablesToCheck[] = $mainOrder->MaBan;
            }

            // Xử lý gộp đơn
            if (!empty($mergedOrderIds)) {
                foreach ($mergedOrderIds as $mergedId) {
                    $mergedOrder = DonHang::where('MaDH', $mergedId)->where('TrangThai', 'Hoàn thành')->first();
                    if ($mergedOrder) {
                        if ($mergedOrder->MaBan && !in_array($mergedOrder->MaBan, $tablesToCheck)) {
                            $tablesToCheck[] = $mergedOrder->MaBan;
                        }

                        // Chuyển chi tiết đơn hàng sang đơn chính
                        $chiTietPhu = ChiTietDH::where('MaDH', $mergedId)->get();
                        foreach ($chiTietPhu as $ctp) {
                            // Kiểm tra xem món này đã có trong đơn chính chưa
                            $existCT = ChiTietDH::where('MaDH', $mainOrderId)
                                ->where('MaMonAn', $ctp->MaMonAn)
                                ->first();

                            if ($existCT) {
                                $existCT->SoLuong += $ctp->SoLuong;
                                $existCT->save();
                            } else {
                                // Đổi MaDH cho chi tiết phụ (vì MaCTDH là duy nhất)
                                $ctp->MaDH = $mainOrderId;
                                $ctp->save();
                            }
                        }

                        // Xóa các chi tiết cũ của đơn phụ (để dọn dẹp phòng trường hợp còn sót)
                        ChiTietDH::where('MaDH', $mergedId)->delete();
                        // Xóa đơn phụ
                        $mergedOrder->delete();
                    }
                }
            }

            // Tính tổng tiền của đơn chính (sau khi đã gộp)
            $tongTien = 0;
            $chiTietChinh = ChiTietDH::where('MaDH', $mainOrderId)->get();
            foreach ($chiTietChinh as $ct) {
                $tongTien += ($ct->SoLuong * $ct->DonGiaTaiThoiDiemBan);
            }

            $maHD = $this->generateInvoiceCode();
            HoaDon::create([
                'MaHD' => $maHD,
                'MaDH' => $mainOrderId,
                'PTTT' => $paymentMethod,
                'ThanhTien' => $tongTien,
                'NgayThanhToan' => Carbon::now()
            ]);

            // Cập nhật trạng thái các bàn
            foreach ($tablesToCheck as $maBan) {
                // Kiểm tra xem bàn này còn đơn hàng nào chưa thanh toán không
                $unpaidOrders = DonHang::where('MaBan', $maBan)
                    ->where('TrangThai', 'Hoàn thành')
                    ->doesntHave('hoaDon')
                    ->count();

                if ($unpaidOrders == 0) {
                    BanAn::where('MaBan', $maBan)->update(['TrangThai' => 'Trống']);
                }
            }

            DB::commit();
            return response()->json([
                'success' => true, 
                'message' => 'Thanh toán thành công',
                'data' => [
                    'MaHD' => $maHD
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Tạo đơn hàng chi tiết (có chọn món)
     */
    public function storeFullOrder(Request $request)
    {
        $request->validate([
            'TenKhach' => 'nullable|string',
            'SDT' => 'nullable|string',
            'MaBan' => 'nullable|string',
            'HinhThuc' => 'required|string',
            'items' => 'required|array',
            'items.*.MaMonAn' => 'required|string',
            'items.*.SoLuong' => 'required|integer|min:1'
        ]);

        $maBan = $request->input('MaBan');
        if ($maBan) {
            $ban = BanAn::find($maBan);
            if (!$ban) {
                return response()->json(['success' => false, 'message' => 'Bàn không tồn tại'], 400);
            }
        }

        DB::beginTransaction();
        try {
            $maDH = $this->generateOrderCode();
            $maNV = 'NV002'; // Giả lập

            $order = DonHang::create([
                'MaDH' => $maDH,
                'TenKhach' => $request->input('TenKhach'),
                'SDT' => $request->input('SDT'),
                'HinhThuc' => $request->input('HinhThuc'),
                'TrangThai' => 'Hoàn thành',
                'MaNV' => $maNV,
                'MaBan' => $maBan,
                'NgayDat' => date('Y-m-d')
            ]);

            foreach ($request->input('items') as $item) {
                $monAn = MonAn::find($item['MaMonAn']);
                if ($monAn) {
                    ChiTietDH::create([
                        'MaCTDH' => $this->generateCTDHCode(),
                        'MaDH' => $maDH,
                        'MaMonAn' => $monAn->MaMonAn,
                        'SoLuong' => $item['SoLuong'],
                        'DonGiaTaiThoiDiemBan' => $monAn->DonGia,
                    ]);
                }
            }

            if ($maBan) {
                BanAn::where('MaBan', $maBan)->update(['TrangThai' => 'Có khách']);
            }

            DB::commit();
            return response()->json([
                'success' => true,
                'message' => 'Tạo đơn thành công & Đã in phiếu bếp!',
                'data' => $order
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Khách đặt món qua QR (TH2)
     */
    public function qrOrder(Request $request)
    {
        $request->validate([
            'MaBan' => 'required|string',
            'items' => 'required|array',
        ]);

        $maBan = $request->input('MaBan');
        $ban = BanAn::find($maBan);
        if (!$ban) {
            return response()->json(['success' => false, 'message' => 'Bàn không tồn tại'], 400);
        }

        DB::beginTransaction();
        try {
            $maDH = $this->generateOrderCode();
            $maNV = 'NV002'; // Gán tạm

            $order = DonHang::create([
                'MaDH' => $maDH,
                'TenKhach' => 'Khách tự đặt qua QR',
                'HinhThuc' => 'Tại bàn',
                'TrangThai' => 'Hoàn thành',
                'MaNV' => $maNV,
                'MaBan' => $maBan,
                'NgayDat' => date('Y-m-d')
            ]);

            foreach ($request->input('items') as $item) {
                $monAn = MonAn::find($item['MaMonAn']);
                if ($monAn) {
                    ChiTietDH::create([
                        'MaCTDH' => $this->generateCTDHCode(),
                        'MaDH' => $maDH,
                        'MaMonAn' => $monAn->MaMonAn,
                        'SoLuong' => $item['SoLuong'],
                        'DonGiaTaiThoiDiemBan' => $monAn->DonGia,
                    ]);
                }
            }

            BanAn::where('MaBan', $maBan)->update(['TrangThai' => 'Có khách']);

            DB::commit();
            return response()->json([
                'success' => true,
                'message' => 'Đặt món qua QR thành công! Bếp đang chuẩn bị...',
                'data' => $order
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
