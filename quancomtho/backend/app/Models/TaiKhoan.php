<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TaiKhoan extends Model
{
	use HasFactory;

	protected $table = 'TAI_KHOAN';
	protected $primaryKey = 'MaTK';
	public $incrementing = false;
	protected $keyType = 'string';
	public $timestamps = false;

	protected $fillable = [
		'MaTK',
		'TenDangNhap',
		'MatKhau',
		'VaiTro',
		'TrangThai',
		'LanDangNhapCuoi',
		'MaNV',
	];

	public function nhanVien()
	{
		return $this->belongsTo(NhanVien::class, 'MaNV', 'MaNV');
	}
}
