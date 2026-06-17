<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InvoiceController extends Controller
{
    /**
     * Lấy danh sách hóa đơn kèm lọc
     */
    public function index(Request $request)
    {
        $query = DB::table('HOA_DON')
            ->select('MaHD', 'NgayThanhToan', 'ThanhTien', 'PTTT')
            ->orderBy('NgayThanhToan', 'desc');

        // Lọc theo khoảng ngày (nếu có)
        if ($request->has('from_date') && $request->from_date != '') {
            // Bao gồm từ đầu ngày
            $query->where('NgayThanhToan', '>=', $request->from_date . ' 00:00:00');
        }
        
        if ($request->has('to_date') && $request->to_date != '') {
            // Bao gồm đến cuối ngày
            $query->where('NgayThanhToan', '<=', $request->to_date . ' 23:59:59');
        }

        // Lọc theo phương thức thanh toán (nếu có)
        if ($request->has('payment_method') && $request->payment_method != '' && $request->payment_method != 'Tất cả') {
            $query->where('PTTT', $request->payment_method);
        }

        $invoices = $query->get();

        // Tính toán các chỉ số tổng hợp
        $totalInvoices = $invoices->count();
        $totalRevenue = $invoices->sum('ThanhTien');

        return response()->json([
            'success' => true,
            'data' => [
                'invoices' => $invoices,
                'summary' => [
                    'total_invoices' => $totalInvoices,
                    'total_revenue' => $totalRevenue
                ]
            ]
        ]);
    }

    /**
     * Lấy chi tiết một hóa đơn cụ thể để hiển thị và in
     */
    public function show($id)
    {
        // Lấy thông tin hóa đơn và đơn hàng tương ứng
        $invoice = DB::table('HOA_DON')
            ->join('DON_HANG', 'HOA_DON.MaDH', '=', 'DON_HANG.MaDH')
            ->where('HOA_DON.MaHD', $id)
            ->select(
                'HOA_DON.MaHD', 
                'HOA_DON.MaDH', 
                'HOA_DON.NgayThanhToan', 
                'HOA_DON.ThanhTien', 
                'HOA_DON.PTTT',
                'DON_HANG.TenKhach',
                'DON_HANG.SDT',
                'DON_HANG.HinhThuc'
            )
            ->first();

        if (!$invoice) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy hóa đơn'
            ], 404);
        }

        // Lấy danh sách chi tiết món ăn trong đơn hàng này
        $lineItems = DB::table('CHI_TIET_DH')
            ->join('MON_AN', 'CHI_TIET_DH.MaMonAn', '=', 'MON_AN.MaMonAn')
            ->where('CHI_TIET_DH.MaDH', $invoice->MaDH)
            ->select(
                'MON_AN.TenMonAn',
                'CHI_TIET_DH.SoLuong',
                'CHI_TIET_DH.DonGiaTaiThoiDiemBan as DonGia',
                'CHI_TIET_DH.TongTien'
            )
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'invoice' => $invoice,
                'items' => $lineItems
            ]
        ]);
    }
}
