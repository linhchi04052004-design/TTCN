<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
	public function login(Request $request)
	{
		$request->validate([
			'username' => 'required|string',
			'password' => 'required|string',
		]);

		$account = DB::table('tai_khoan')
			->where('TenDangNhap', $request->input('username'))
			->where('TrangThai', 'Hoạt động')
			->first();

		if (!$account || !Hash::check($request->input('password'), $account->MatKhau)) {
			return response()->json([
				'success' => false,
				'message' => 'Tên đăng nhập hoặc mật khẩu không đúng.'
			], 401);
		}

		DB::table('tai_khoan')
			->where('MaTK', $account->MaTK)
			->update(['LanDangNhapCuoi' => now()]);

		$nhanVien = DB::table('nhan_vien')
			->where('MaNV', $account->MaNV)
			->first();

		return response()->json([
			'success' => true,
			'user' => [
				'id'       => $account->MaTK,
				'username' => $account->TenDangNhap,
				'role'     => $account->VaiTro,
				'name'     => $nhanVien ? $nhanVien->TenNV : $account->TenDangNhap,
				'maNV'     => $account->MaNV,
			]
		]);
	}
}
