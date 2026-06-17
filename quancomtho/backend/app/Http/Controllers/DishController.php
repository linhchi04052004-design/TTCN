<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\File;

class DishController extends Controller
{
    /**
     * Lấy danh sách món ăn
     */
    public function index(Request $request)
    {
        $query = DB::table('mon_an')
            ->leftJoin('danh_muc_mon', 'mon_an.MaDanhMuc', '=', 'danh_muc_mon.MaDanhMuc')
            ->select('mon_an.*', 'danh_muc_mon.TenDanhMuc');

        if ($request->has('search') && !empty($request->search)) {
            $query->where('mon_an.TenMonAn', 'like', '%' . $request->search . '%');
        }

        if ($request->has('status') && $request->status !== 'Tất cả trạng thái' && !empty($request->status)) {
            $query->where('mon_an.TrangThai', $request->status);
        }

        if ($request->has('category') && !empty($request->category)) {
            $query->where('mon_an.MaDanhMuc', $request->category);
        }

        $dishes = $query->orderBy('mon_an.MaMonAn', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $dishes
        ]);
    }

    /**
     * Lấy chi tiết một món ăn
     */
    public function show($id)
    {
        $dish = DB::table('mon_an')->where('MaMonAn', $id)->first();

        if (!$dish) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy món ăn'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $dish
        ]);
    }

    /**
     * Tạo món ăn mới
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'TenMonAn' => 'required|string|max:50',
            'MaDanhMuc' => 'required|string|exists:danh_muc_mon,MaDanhMuc',
            'TrangThai' => 'required|string|in:Đang bán,Ngưng bán',
            'DonGia' => 'required|numeric|min:0',
            'MoTa' => 'nullable|string|max:255',
            'HinhAnh' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:4096'
        ], [
            'TenMonAn.required' => 'Tên món ăn không được để trống.',
            'MaDanhMuc.required' => 'Vui lòng chọn danh mục.',
            'MaDanhMuc.exists' => 'Danh mục không hợp lệ.',
            'TrangThai.required' => 'Trạng thái không được để trống.',
            'DonGia.required' => 'Đơn giá không được để trống.',
            'DonGia.numeric' => 'Đơn giá phải là số.',
            'HinhAnh.image' => 'File tải lên phải là hình ảnh.',
            'HinhAnh.max' => 'Kích thước ảnh tối đa 4MB.'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first()
            ], 422);
        }

        try {
            // Sinh mã món tự động (VD: MA001 -> MA002)
            $lastDish = DB::table('mon_an')
                ->orderByRaw('LENGTH(MaMonAn) DESC')
                ->orderBy('MaMonAn', 'desc')
                ->first();
                
            $nextMaMon = 'MA001';
            if ($lastDish) {
                $lastIdNum = (int) str_replace('MA', '', $lastDish->MaMonAn);
                $nextMaMon = 'MA' . str_pad($lastIdNum + 1, 3, '0', STR_PAD_LEFT);
            }

            // Xử lý upload ảnh
            $hinhAnhPath = null;
            if ($request->hasFile('HinhAnh')) {
                $file = $request->file('HinhAnh');
                $filename = time() . '_' . $file->getClientOriginalName();
                $destinationPath = public_path('images/dishes');
                if (!File::exists($destinationPath)) {
                    File::makeDirectory($destinationPath, 0755, true);
                }
                $file->move($destinationPath, $filename);
                $hinhAnhPath = '/images/dishes/' . $filename;
            }

            DB::table('mon_an')->insert([
                'MaMonAn' => $nextMaMon,
                'MaDanhMuc' => $request->MaDanhMuc,
                'TenMonAn' => $request->TenMonAn,
                'MoTa' => $request->MoTa,
                'DonGia' => $request->DonGia,
                'HinhAnh' => $hinhAnhPath,
                'TrangThai' => $request->TrangThai
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Thêm món ăn thành công',
                'data' => ['MaMonAn' => $nextMaMon]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi hệ thống: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cập nhật thông tin món ăn
     * Lưu ý: Cần dùng phương thức POST gửi kèm _method=PUT hoặc PUT form-data từ React để lấy được File.
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'TenMonAn' => 'required|string|max:50',
            'MaDanhMuc' => 'required|string|exists:danh_muc_mon,MaDanhMuc',
            'TrangThai' => 'required|string|in:Đang bán,Ngưng bán',
            'DonGia' => 'required|numeric|min:0',
            'MoTa' => 'nullable|string|max:255',
            'HinhAnh' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:4096'
        ], [
            'TenMonAn.required' => 'Tên món ăn không được để trống.',
            'MaDanhMuc.required' => 'Vui lòng chọn danh mục.',
            'TrangThai.required' => 'Trạng thái không được để trống.',
            'DonGia.required' => 'Đơn giá không được để trống.',
            'HinhAnh.image' => 'File tải lên phải là hình ảnh.',
            'HinhAnh.max' => 'Kích thước ảnh tối đa 4MB.'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first()
            ], 422);
        }

        try {
            $dish = DB::table('mon_an')->where('MaMonAn', $id)->first();
            if (!$dish) {
                return response()->json(['success' => false, 'message' => 'Không tìm thấy món ăn'], 404);
            }

            $updateData = [
                'MaDanhMuc' => $request->MaDanhMuc,
                'TenMonAn' => $request->TenMonAn,
                'MoTa' => $request->MoTa,
                'DonGia' => $request->DonGia,
                'TrangThai' => $request->TrangThai
            ];

            // Nếu user cố tình bỏ ảnh (xóa ảnh) thì frontend sẽ truyền null hoặc rỗng vào field xóa (tùy logic).
            // Ở đây tạm hiểu: Nếu có up file mới thì thay ảnh, nếu không up thì giữ nguyên ảnh cũ.
            // Nếu muốn xóa ảnh, frontend gửi remove_image = true
            if ($request->hasFile('HinhAnh')) {
                $file = $request->file('HinhAnh');
                $filename = time() . '_' . $file->getClientOriginalName();
                $destinationPath = public_path('images/dishes');
                if (!File::exists($destinationPath)) {
                    File::makeDirectory($destinationPath, 0755, true);
                }
                $file->move($destinationPath, $filename);
                $updateData['HinhAnh'] = '/images/dishes/' . $filename;
                
                // Xóa ảnh cũ nếu có
                if ($dish->HinhAnh && file_exists(public_path($dish->HinhAnh))) {
                    @unlink(public_path($dish->HinhAnh));
                }
            } else if ($request->has('remove_image') && $request->remove_image == 'true') {
                $updateData['HinhAnh'] = null;
                if ($dish->HinhAnh && file_exists(public_path($dish->HinhAnh))) {
                    @unlink(public_path($dish->HinhAnh));
                }
            }

            DB::table('mon_an')->where('MaMonAn', $id)->update($updateData);

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật món ăn thành công'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi hệ thống: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Xóa món ăn ("Xóa mềm" -> chuyển trạng thái thành Ngưng bán)
     */
    public function destroy($id)
    {
        try {
            $dish = DB::table('mon_an')->where('MaMonAn', $id)->first();
            if (!$dish) {
                return response()->json(['success' => false, 'message' => 'Không tìm thấy món ăn'], 404);
            }

            // Theo yêu cầu: Xóa sẽ chuyển sang Ngưng bán chứ không xóa thật
            DB::table('mon_an')->where('MaMonAn', $id)->update([
                'TrangThai' => 'Ngưng bán'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Đã chuyển món ăn sang Ngưng bán'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi hệ thống: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lấy danh sách món ngưng bán
     */
    public function getSuspended(Request $request)
    {
        $query = DB::table('mon_an')
            ->leftJoin('danh_muc_mon', 'mon_an.MaDanhMuc', '=', 'danh_muc_mon.MaDanhMuc')
            ->where('mon_an.TrangThai', 'Ngưng bán')
            ->select('mon_an.*', 'danh_muc_mon.TenDanhMuc');

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('mon_an.TenMonAn', 'like', '%' . $search . '%')
                  ->orWhere('danh_muc_mon.TenDanhMuc', 'like', '%' . $search . '%');
            });
        }

        $dishes = $query->orderBy('mon_an.MaMonAn', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $dishes
        ]);
    }

    /**
     * Khôi phục một món (từ Ngưng bán -> Đang bán)
     */
    public function restore($id)
    {
        try {
            $dish = DB::table('mon_an')->where('MaMonAn', $id)->first();
            if (!$dish) {
                return response()->json(['success' => false, 'message' => 'Không tìm thấy món ăn'], 404);
            }

            DB::table('mon_an')->where('MaMonAn', $id)->update([
                'TrangThai' => 'Đang bán'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Đã khôi phục món ăn'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi hệ thống: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Khôi phục nhiều món cùng lúc
     */
    public function bulkRestore(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'ids' => 'required|array',
            'ids.*' => 'string|exists:mon_an,MaMonAn'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Danh sách mã món không hợp lệ.'
            ], 422);
        }

        try {
            DB::table('mon_an')
                ->whereIn('MaMonAn', $request->ids)
                ->update(['TrangThai' => 'Đang bán']);

            return response()->json([
                'success' => true,
                'message' => 'Khôi phục thành công ' . count($request->ids) . ' món ăn'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi hệ thống: ' . $e->getMessage()
            ], 500);
        }
    }
}
