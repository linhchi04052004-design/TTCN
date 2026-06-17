<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $today = Carbon::today();
        $yesterday = Carbon::yesterday();
        $startOfMonth = Carbon::now()->startOfMonth();
        $startOfLastMonth = Carbon::now()->subMonth()->startOfMonth();
        $endOfLastMonth = Carbon::now()->subMonth()->endOfMonth();

        // 1. Doanh thu hôm nay
        $todayRevenue = DB::table('HOA_DON')
            ->whereDate('NgayThanhToan', $today)
            ->sum('ThanhTien');

        $yesterdayRevenue = DB::table('HOA_DON')
            ->whereDate('NgayThanhToan', $yesterday)
            ->sum('ThanhTien');
            
        $todayRevenueGrowth = $yesterdayRevenue > 0 
            ? round((($todayRevenue - $yesterdayRevenue) / $yesterdayRevenue) * 100, 1) 
            : ($todayRevenue > 0 ? 100 : 0);

        // 2. Tổng doanh thu
        $totalRevenue = DB::table('HOA_DON')->sum('ThanhTien');

        $thisMonthRevenue = DB::table('HOA_DON')
            ->whereBetween('NgayThanhToan', [$startOfMonth, Carbon::now()])
            ->sum('ThanhTien');
            
        $lastMonthRevenue = DB::table('HOA_DON')
            ->whereBetween('NgayThanhToan', [$startOfLastMonth, $endOfLastMonth])
            ->sum('ThanhTien');

        $totalRevenueGrowth = $lastMonthRevenue > 0 
            ? round((($thisMonthRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100, 1) 
            : ($thisMonthRevenue > 0 ? 100 : 0);

        // 3. Tổng danh mục, tổng món
        $totalCategories = DB::table('DANH_MUC_MON')->where('TrangThai', 'Đang bán')->count();
        $totalItems = DB::table('MON_AN')->where('TrangThai', 'Đang bán')->count();

        // 4. Tổng bàn đang hoạt động
        $activeTables = DB::table('BAN_AN')->where('TrangThai', 'Có khách')->count();

        // 5. Nhân viên đang hoạt động
        $activeEmployees = DB::table('TAI_KHOAN')->where('TrangThai', 'Hoạt động')->count();

        // 6. Doanh thu 7 ngày qua
        $sevenDaysAgo = Carbon::today()->subDays(6);
        $revenue7DaysData = DB::table('HOA_DON')
            ->select(DB::raw('DATE(NgayThanhToan) as date'), DB::raw('SUM(ThanhTien) as revenue'))
            ->whereDate('NgayThanhToan', '>=', $sevenDaysAgo)
            ->groupBy(DB::raw('DATE(NgayThanhToan)'))
            ->orderBy(DB::raw('DATE(NgayThanhToan)'))
            ->get()
            ->keyBy('date');

        $revenue7Days = [];
        for ($i = 6; $i >= 0; $i--) {
            $dateStr = Carbon::today()->subDays($i)->format('Y-m-d');
            $displayDate = Carbon::today()->subDays($i)->format('d/m');
            $revenue7Days[] = [
                'date' => $displayDate,
                'revenue' => isset($revenue7DaysData[$dateStr]) ? (float) $revenue7DaysData[$dateStr]->revenue : 0
            ];
        }

        // 7. Phương thức thanh toán hôm nay
        $paymentMethodsData = DB::table('HOA_DON')
            ->select('PTTT', DB::raw('SUM(ThanhTien) as total_revenue'))
            ->whereDate('NgayThanhToan', $today)
            ->groupBy('PTTT')
            ->get();
            
        $paymentMethods = $paymentMethodsData->map(function ($item) {
            return [
                'name' => $item->PTTT,
                'value' => (float) $item->total_revenue
            ];
        });

        // 8. Doanh thu theo giờ hôm nay (từ 06:00 đến 23:00)
        $hourlyRevenueData = DB::table('HOA_DON')
            ->select(DB::raw('HOUR(NgayThanhToan) as hour'), DB::raw('SUM(ThanhTien) as revenue'))
            ->whereDate('NgayThanhToan', $today)
            ->groupBy(DB::raw('HOUR(NgayThanhToan)'))
            ->get()
            ->keyBy('hour');

        $hourlyRevenue = [];
        for ($h = 6; $h <= 23; $h++) {
            $hourStr = sprintf("%02d:00", $h);
            $hourlyRevenue[] = [
                'time' => $hourStr,
                'revenue' => isset($hourlyRevenueData[$h]) ? (float) $hourlyRevenueData[$h]->revenue : 0
            ];
        }

        // 9. Doanh thu theo món hôm nay (Top 10)
        $topItems = DB::table('CHI_TIET_DH')
            ->join('DON_HANG', 'CHI_TIET_DH.MaDH', '=', 'DON_HANG.MaDH')
            ->join('MON_AN', 'CHI_TIET_DH.MaMonAn', '=', 'MON_AN.MaMonAn')
            ->where('DON_HANG.TrangThai', 'Hoàn thành')
            ->whereDate('DON_HANG.NgayDat', $today)
            ->select('MON_AN.TenMonAn', DB::raw('SUM(CHI_TIET_DH.TongTien) as revenue'))
            ->groupBy('MON_AN.TenMonAn', 'MON_AN.MaMonAn')
            ->orderByDesc('revenue')
            ->limit(10)
            ->get()
            ->map(function($item) {
                return [
                    'name' => $item->TenMonAn,
                    'revenue' => (float) $item->revenue
                ];
            });

        // Món bán chạy hôm nay theo số lượng (tuỳ chọn thêm)
        $topItemsQtyToday = DB::table('CHI_TIET_DH')
            ->join('DON_HANG', 'CHI_TIET_DH.MaDH', '=', 'DON_HANG.MaDH')
            ->join('MON_AN', 'CHI_TIET_DH.MaMonAn', '=', 'MON_AN.MaMonAn')
            ->where('DON_HANG.TrangThai', 'Hoàn thành')
            ->whereDate('DON_HANG.NgayDat', $today)
            ->select('MON_AN.TenMonAn', DB::raw('SUM(CHI_TIET_DH.SoLuong) as quantity'))
            ->groupBy('MON_AN.TenMonAn', 'MON_AN.MaMonAn')
            ->orderByDesc('quantity')
            ->limit(10)
            ->get()
            ->map(function($item) {
                return [
                    'name' => $item->TenMonAn,
                    'quantity' => (int) $item->quantity
                ];
            });

        // 10. Tại bàn vs Mang về
        $dineInTakeawayData = DB::table('DON_HANG')
            ->join('HOA_DON', 'DON_HANG.MaDH', '=', 'HOA_DON.MaDH')
            ->where('DON_HANG.TrangThai', 'Hoàn thành')
            ->select('DON_HANG.HinhThuc', DB::raw('SUM(HOA_DON.ThanhTien) as revenue'))
            ->groupBy('DON_HANG.HinhThuc')
            ->get();
            
        $dineInTakeaway = $dineInTakeawayData->map(function($item) {
            return [
                'name' => $item->HinhThuc,
                'value' => (float) $item->revenue
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'stats' => [
                    'today_revenue' => $todayRevenue,
                    'today_revenue_growth' => $todayRevenueGrowth,
                    'total_revenue' => $totalRevenue,
                    'total_revenue_growth' => $totalRevenueGrowth,
                    'total_categories' => $totalCategories,
                    'total_items' => $totalItems,
                    'active_tables' => $activeTables,
                    'active_employees' => $activeEmployees
                ],
                'charts' => [
                    'revenue_7_days' => $revenue7Days,
                    'payment_methods' => $paymentMethods,
                    'hourly_revenue' => $hourlyRevenue,
                    'top_items_revenue' => $topItems,
                    'top_items_quantity_today' => $topItemsQtyToday,
                    'dine_in_takeaway' => $dineInTakeaway
                ]
            ]
        ]);
    }
}
