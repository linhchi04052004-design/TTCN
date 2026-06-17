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
        $query = DB::table('hoa_don')
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
        $invoice = DB::table('hoa_don')
            ->join('don_hang', 'hoa_don.MaDH', '=', 'don_hang.MaDH')
            ->where('hoa_don.MaHD', $id)
            ->select(
                'hoa_don.MaHD', 
                'hoa_don.MaDH', 
                'hoa_don.NgayThanhToan', 
                'hoa_don.ThanhTien', 
                'hoa_don.PTTT',
                'don_hang.TenKhach',
                'don_hang.SDT',
                'don_hang.HinhThuc'
            )
            ->first();

        if (!$invoice) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy hóa đơn'
            ], 404);
        }

        // Lấy danh sách chi tiết món ăn trong đơn hàng này
        $lineItems = DB::table('chi_tiet_dh')
            ->join('mon_an', 'chi_tiet_dh.MaMonAn', '=', 'mon_an.MaMonAn')
            ->where('chi_tiet_dh.MaDH', $invoice->MaDH)
            ->select(
                'mon_an.TenMonAn',
                'chi_tiet_dh.SoLuong',
                'chi_tiet_dh.DonGiaTaiThoiDiemBan as DonGia',
                'chi_tiet_dh.TongTien'
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
