<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class EmployeeController extends Controller
{
    /**
     * Lấy danh sách tài khoản
     */
    public function index()
    {
        $accounts = DB::table('TAI_KHOAN')
            ->join('NHAN_VIEN', 'TAI_KHOAN.MaNV', '=', 'NHAN_VIEN.MaNV')
            ->select(
                'TAI_KHOAN.MaTK',
                'TAI_KHOAN.TenDangNhap',
                'TAI_KHOAN.VaiTro',
                'TAI_KHOAN.TrangThai',
                'NHAN_VIEN.MaNV',
                'NHAN_VIEN.TenNV',
                'NHAN_VIEN.SDT',
                'NHAN_VIEN.Email'
            )
            ->orderBy('TAI_KHOAN.MaTK', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $accounts
        ]);
    }

    /**
     * Tạo tài khoản nhân viên mới
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'TenNV' => 'required|string|max:50',
            'SDT' => 'required|string|max:15|unique:NHAN_VIEN,SDT',
            'Email' => 'nullable|email|max:50|unique:NHAN_VIEN,Email',
            'VaiTro' => 'required|string|max:20'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first()
            ], 422);
        }

        try {
            DB::beginTransaction();

            // 1. Tự động sinh MaNV (VD: NV001 -> NV002)
            $lastNhanVien = DB::table('NHAN_VIEN')->orderByRaw('LENGTH(MaNV) DESC')->orderBy('MaNV', 'desc')->first();
            $nextMaNV = 'NV001';
            if ($lastNhanVien) {
                $lastIdNum = (int) str_replace('NV', '', $lastNhanVien->MaNV);
                $nextMaNV = 'NV' . str_pad($lastIdNum + 1, 3, '0', STR_PAD_LEFT);
            }

            // 2. Tự động sinh MaTK (VD: TK001 -> TK002)
            $lastTaiKhoan = DB::table('TAI_KHOAN')->orderByRaw('LENGTH(MaTK) DESC')->orderBy('MaTK', 'desc')->first();
            $nextMaTK = 'TK001';
            if ($lastTaiKhoan) {
                $lastIdNum = (int) str_replace('TK', '', $lastTaiKhoan->MaTK);
                $nextMaTK = 'TK' . str_pad($lastIdNum + 1, 3, '0', STR_PAD_LEFT);
            }

            // 3. Tự động sinh TenDangNhap dựa trên VaiTro
            $rolePrefix = '';
            switch ($request->VaiTro) {
                case 'admin':
                    $rolePrefix = 'admin';
                    break;
                case 'Nhân viên thu ngân':
                    $rolePrefix = 'staff';
                    break;
                default:
                    $rolePrefix = 'user';
            }

            // Tìm số thứ tự tiếp theo cho tên đăng nhập này
            $countRole = DB::table('TAI_KHOAN')->where('TenDangNhap', 'like', $rolePrefix . '%')->count();
            $nextTenDangNhap = $rolePrefix . str_pad($countRole + 1, 2, '0', STR_PAD_LEFT);

            // 4. Insert vào bảng nhan_vien
            DB::table('NHAN_VIEN')->insert([
                'MaNV' => $nextMaNV,
                'TenNV' => $request->TenNV,
                'SDT' => $request->SDT,
                'Email' => $request->Email,
                'GioiTinh' => null,
                'DiaChi' => null
            ]);

            // 5. Insert vào bảng tai_khoan (Mật khẩu tự động: Staff@123)
            DB::table('TAI_KHOAN')->insert([
                'MaTK' => $nextMaTK,
                'TenDangNhap' => $nextTenDangNhap,
                'MatKhau' => Hash::make('Staff@123'),
                'VaiTro' => $request->VaiTro,
                'TrangThai' => 'Hoạt động', // 'Đang dùng' equivalent
                'MaNV' => $nextMaNV
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Tạo tài khoản thành công',
                'data' => [
                    'TenDangNhap' => $nextTenDangNhap,
                    'MatKhau' => 'Staff@123'
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Lỗi hệ thống khi tạo tài khoản: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Xóa tài khoản
     */
    public function destroy($id)
    {
        try {
            DB::beginTransaction();
            
            $taiKhoan = DB::table('TAI_KHOAN')->where('MaTK', $id)->first();
            
            if (!$taiKhoan) {
                return response()->json(['success' => false, 'message' => 'Không tìm thấy tài khoản'], 404);
            }

            // Xóa tài khoản
            DB::table('TAI_KHOAN')->where('MaTK', $id)->delete();
            
            // Tùy chọn: Xóa luôn nhân viên (nếu logic yêu cầu)
            DB::table('NHAN_VIEN')->where('MaNV', $taiKhoan->MaNV)->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Xóa tài khoản thành công'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Lỗi hệ thống: ' . $e->getMessage()
            ], 500);
        }
    }
}
