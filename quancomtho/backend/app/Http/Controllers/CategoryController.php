<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class CategoryController extends Controller
{
    /**
     * Lấy danh sách danh mục
     */
    public function index(Request $request)
    {
        $query = DB::table('danh_muc_mon');

        if ($request->has('search') && !empty($request->search)) {
            $query->where('TenDanhMuc', 'like', '%' . $request->search . '%');
        }

        if ($request->has('status') && $request->status !== 'Tất cả' && !empty($request->status)) {
            $query->where('TrangThai', $request->status);
        }

        $categories = $query->orderBy('MaDanhMuc', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $categories
        ]);
    }

    /**
     * Lấy chi tiết một danh mục
     */
    public function show($id)
    {
        $category = DB::table('danh_muc_mon')->where('MaDanhMuc', $id)->first();

        if (!$category) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy danh mục'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $category
        ]);
    }

    /**
     * Tạo danh mục mới
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'TenDanhMuc' => 'required|string|max:50|unique:danh_muc_mon,TenDanhMuc',
            'TrangThai' => 'required|string|in:Đang bán,Ngưng bán'
        ], [
            'TenDanhMuc.required' => 'Tên danh mục không được để trống.',
            'TenDanhMuc.unique' => 'Tên danh mục đã tồn tại.',
            'TrangThai.required' => 'Trạng thái không được để trống.'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first()
            ], 422);
        }

        try {
            // Sinh mã danh mục tự động (VD: DM001 -> DM002)
            $lastCategory = DB::table('danh_muc_mon')
                ->orderByRaw('LENGTH(MaDanhMuc) DESC')
                ->orderBy('MaDanhMuc', 'desc')
                ->first();
                
            $nextMaDM = 'DM001';
            if ($lastCategory) {
                $lastIdNum = (int) str_replace('DM', '', $lastCategory->MaDanhMuc);
                $nextMaDM = 'DM' . str_pad($lastIdNum + 1, 3, '0', STR_PAD_LEFT);
            }

            DB::table('danh_muc_mon')->insert([
                'MaDanhMuc' => $nextMaDM,
                'TenDanhMuc' => $request->TenDanhMuc,
                'TrangThai' => $request->TrangThai
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Thêm danh mục thành công'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi hệ thống: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cập nhật danh mục
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'TenDanhMuc' => 'required|string|max:50|unique:danh_muc_mon,TenDanhMuc,' . $id . ',MaDanhMuc',
            'TrangThai' => 'required|string|in:Đang bán,Ngưng bán'
        ], [
            'TenDanhMuc.required' => 'Tên danh mục không được để trống.',
            'TenDanhMuc.unique' => 'Tên danh mục đã tồn tại.',
            'TrangThai.required' => 'Trạng thái không được để trống.'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first()
            ], 422);
        }

        try {
            $category = DB::table('danh_muc_mon')->where('MaDanhMuc', $id)->first();
            if (!$category) {
                return response()->json(['success' => false, 'message' => 'Không tìm thấy danh mục'], 404);
            }

            DB::table('danh_muc_mon')->where('MaDanhMuc', $id)->update([
                'TenDanhMuc' => $request->TenDanhMuc,
                'TrangThai' => $request->TrangThai
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật danh mục thành công'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi hệ thống: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Xóa danh mục
     */
    public function destroy($id)
    {
        try {
            $category = DB::table('danh_muc_mon')->where('MaDanhMuc', $id)->first();
            if (!$category) {
                return response()->json(['success' => false, 'message' => 'Không tìm thấy danh mục'], 404);
            }

            // Kiểm tra xem danh mục có chứa món ăn không
            $hasItems = DB::table('mon_an')->where('MaDanhMuc', $id)->exists();
            if ($hasItems) {
                return response()->json([
                    'success' => false,
                    'message' => 'Danh mục có chứa món ăn và không được phép xóa.'
                ], 400); // 400 Bad Request
            }

            // Xóa danh mục
            DB::table('danh_muc_mon')->where('MaDanhMuc', $id)->delete();

            return response()->json([
                'success' => true,
                'message' => 'Xóa danh mục thành công'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi hệ thống: ' . $e->getMessage()
            ], 500);
        }
    }
}
