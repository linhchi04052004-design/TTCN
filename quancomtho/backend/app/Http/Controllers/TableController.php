<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class TableController extends Controller
{
    /**
     * Lấy danh sách tất cả các bàn và thống kê
     */
    public function index()
    {
        $tables = DB::table('BAN_AN')->orderBy('MaBan', 'asc')->get();

        $totalTables = $tables->count();
        $emptyTables = $tables->where('TrangThai', 'Trống')->count();
        $occupiedTables = $tables->where('TrangThai', 'Có khách')->count();

        return response()->json([
            'success' => true,
            'data' => [
                'tables' => $tables,
                'stats' => [
                    'total' => $totalTables,
                    'empty' => $emptyTables,
                    'occupied' => $occupiedTables
                ]
            ]
        ]);
    }

    /**
     * Cập nhật sức chứa của một bàn
     */
    public function updateCapacity(Request $request, $maBan)
    {
        // Validation: Sức chứa phải là số nguyên và lớn hơn 0
        $validator = Validator::make($request->all(), [
            'SucChua' => 'required|integer|min:1|max:50',
        ], [
            'SucChua.required' => 'Sức chứa không được để trống.',
            'SucChua.integer' => 'Sức chứa phải là một số nguyên.',
            'SucChua.min' => 'Sức chứa phải lớn hơn 0.',
            'SucChua.max' => 'Sức chứa không được vượt quá 50.'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first('SucChua')
            ], 422);
        }

        $table = DB::table('BAN_AN')->where('MaBan', $maBan)->first();

        if (!$table) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy bàn này.'
            ], 404);
        }

        DB::table('BAN_AN')->where('MaBan', $maBan)->update([
            'SucChua' => $request->input('SucChua')
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật sức chứa thành công!'
        ]);
    }
}
