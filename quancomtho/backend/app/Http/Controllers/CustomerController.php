<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use App\Models\DonHang;
use App\Models\BanAn;
use App\Models\MonAn;
use App\Models\ChiTietDH;

class CustomerController extends Controller
{
    /**
     * Lấy danh sách danh mục đang hoạt động (cho khách hàng)
     */
    public function getCategories()
    {
        $categories = DB::table('DANH_MUC_MON')
            ->where('TrangThai', 'Đang bán')
            ->orderBy('MaDanhMuc', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $categories
        ]);
    }

    /**
     * Lấy danh sách món ăn đang bán (cho khách hàng), có thể lọc theo danh mục
     */
    public function getDishes(Request $request)
    {
        $query = DB::table('MON_AN')
            ->leftJoin('DANH_MUC_MON', 'MON_AN.MaDanhMuc', '=', 'DANH_MUC_MON.MaDanhMuc')
            ->where('MON_AN.TrangThai', 'Đang bán')
            ->select('MON_AN.*', 'DANH_MUC_MON.TenDanhMuc');

        if ($request->has('maDanhMuc') && !empty($request->maDanhMuc)) {
            $query->where('MON_AN.MaDanhMuc', $request->maDanhMuc);
        }

        $dishes = $query->orderBy('MON_AN.MaDanhMuc', 'asc')->orderBy('MON_AN.MaMonAn', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $dishes
        ]);
    }

    /**
     * Kiểm tra thông tin bàn ăn
     */
    public function getTable($maBan)
    {
        $ban = BanAn::find($maBan);

        if (!$ban) {
            return response()->json([
                'success' => false,
                'message' => 'Bàn không tồn tại'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $ban
        ]);
    }

    /**
     * Helper: Tạo mã đơn hàng mới
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
     * Helper: Tạo mã chi tiết đơn hàng mới
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
     * Khách hàng gửi đơn hàng qua QR
     */
    public function placeOrder(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'TenKhach'      => 'required|string|max:100',
            'SDT'           => 'nullable|string|max:15',
            'MaBan'         => 'required|string|exists:BAN_AN,MaBan',
            'items'         => 'required|array|min:1',
            'items.*.MaMonAn' => 'required|string|exists:MON_AN,MaMonAn',
            'items.*.SoLuong' => 'required|integer|min:1',
            'items.*.GhiChu'  => 'nullable|string|max:255',
        ], [
            'TenKhach.required'   => 'Vui lòng nhập tên của bạn.',
            'MaBan.required'      => 'Không xác định được bàn.',
            'MaBan.exists'        => 'Bàn không tồn tại.',
            'items.required'      => 'Giỏ hàng không có món nào.',
            'items.min'           => 'Giỏ hàng phải có ít nhất 1 món.',
            'items.*.MaMonAn.exists' => 'Có món ăn không hợp lệ.',
            'items.*.SoLuong.min' => 'Số lượng mỗi món tối thiểu là 1.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first()
            ], 422);
        }

        $maBan = $request->input('MaBan');
        $ban = BanAn::find($maBan);

        DB::beginTransaction();
        try {
            $maDH = $this->generateOrderCode();

            // Dùng NV001 làm mặc định (đặt qua QR, không cần nhân viên chọn)
            $maNV = DB::table('NHAN_VIEN')->orderBy('MaNV', 'asc')->value('MaNV') ?? 'NV001';

            $order = DonHang::create([
                'MaDH'      => $maDH,
                'TenKhach'  => $request->input('TenKhach'),
                'SDT'       => $request->input('SDT'),
                'HinhThuc'  => 'Tại bàn',
                'TrangThai' => 'Hoàn thành',
                'MaNV'      => $maNV,
                'MaBan'     => $maBan,
                'NgayDat'   => date('Y-m-d'),
            ]);

            // Tạo chi tiết đơn hàng
            foreach ($request->input('items') as $item) {
                $monAn = MonAn::find($item['MaMonAn']);
                if ($monAn) {
                    ChiTietDH::create([
                        'MaCTDH'               => $this->generateCTDHCode(),
                        'MaDH'                 => $maDH,
                        'MaMonAn'              => $monAn->MaMonAn,
                        'SoLuong'              => $item['SoLuong'],
                        'DonGiaTaiThoiDiemBan' => $monAn->DonGia,
                        'GhiChu'               => $item['GhiChu'] ?? null,
                    ]);
                }
            }

            // Cập nhật trạng thái bàn sang "Có khách"
            $ban->update(['TrangThai' => 'Có khách']);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Đặt món thành công! Nhân viên sẽ mang món đến cho bạn.',
                'data'    => [
                    'MaDH'    => $maDH,
                    'TenBan'  => $ban->TenBan,
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra: ' . $e->getMessage()
            ], 500);
        }
    }
    public function getOrderStatus($maDH)
    {
        $order = DonHang::with(['chiTiet.monAn'])
            ->where('MaDH', $maDH)
            ->first();

        if (!$order) {
            return response()->json(['success' => false, 'status' => 'not_found']);
        }

        return response()->json([
            'success' => true,
            'status' => $order->TrangThai,
            'order' => [
                'MaDH' => $order->MaDH,
                'MaBan' => $order->MaBan,
                'TenKhach' => $order->TenKhach,
                'TrangThai' => $order->TrangThai,
                'items' => $order->chiTiet->map(function ($item) {
                    return [
                        'MaMonAn' => $item->MaMonAn,
                        'TenMonAn' => optional($item->monAn)->TenMonAn ?? $item->MaMonAn,
                        'SoLuong' => $item->SoLuong,
                        'DonGia' => $item->DonGiaTaiThoiDiemBan,
                        'GhiChu' => $item->GhiChu,
                    ];
                })->values(),
            ],
        ]);
    }
}
