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
        $accounts = DB::table('tai_khoan')
            ->join('nhan_vien', 'tai_khoan.MaNV', '=', 'nhan_vien.MaNV')
            ->select(
                'tai_khoan.MaTK',
                'tai_khoan.TenDangNhap',
                'tai_khoan.VaiTro',
                'tai_khoan.TrangThai',
                'nhan_vien.MaNV',
                'nhan_vien.TenNV',
                'nhan_vien.SDT',
                'nhan_vien.Email'
            )
            ->orderBy('tai_khoan.MaTK', 'asc')
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
            'SDT' => 'required|string|max:15|unique:nhan_vien,SDT',
            'Email' => 'nullable|email|max:50|unique:nhan_vien,Email',
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
            $lastNhanVien = DB::table('nhan_vien')->orderByRaw('LENGTH(MaNV) DESC')->orderBy('MaNV', 'desc')->first();
            $nextMaNV = 'NV001';
            if ($lastNhanVien) {
                $lastIdNum = (int) str_replace('NV', '', $lastNhanVien->MaNV);
                $nextMaNV = 'NV' . str_pad($lastIdNum + 1, 3, '0', STR_PAD_LEFT);
            }

            // 2. Tự động sinh MaTK (VD: TK001 -> TK002)
            $lastTaiKhoan = DB::table('tai_khoan')->orderByRaw('LENGTH(MaTK) DESC')->orderBy('MaTK', 'desc')->first();
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
            $countRole = DB::table('tai_khoan')->where('TenDangNhap', 'like', $rolePrefix . '%')->count();
            $nextTenDangNhap = $rolePrefix . str_pad($countRole + 1, 2, '0', STR_PAD_LEFT);

            // 4. Insert vào bảng nhan_vien
            DB::table('nhan_vien')->insert([
                'MaNV' => $nextMaNV,
                'TenNV' => $request->TenNV,
                'SDT' => $request->SDT,
                'Email' => $request->Email,
                'GioiTinh' => null,
                'DiaChi' => null
            ]);

            // 5. Insert vào bảng tai_khoan (Mật khẩu tự động: Staff@123)
            DB::table('tai_khoan')->insert([
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
            
            $taiKhoan = DB::table('tai_khoan')->where('MaTK', $id)->first();
            
            if (!$taiKhoan) {
                return response()->json(['success' => false, 'message' => 'Không tìm thấy tài khoản'], 404);
            }

            // Xóa tài khoản
            DB::table('tai_khoan')->where('MaTK', $id)->delete();
            
            // Tùy chọn: Xóa luôn nhân viên (nếu logic yêu cầu)
            DB::table('nhan_vien')->where('MaNV', $taiKhoan->MaNV)->delete();

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
