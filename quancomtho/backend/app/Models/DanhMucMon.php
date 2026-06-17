<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DanhMucMon extends Model
{
	use HasFactory;

	protected $table = 'DANH_MUC_MON';
	protected $primaryKey = 'MaDanhMuc';
	public $incrementing = false;
	protected $keyType = 'string';
	public $timestamps = false;

	protected $fillable = [
		'MaDanhMuc',
		'TenDanhMuc',
		'TrangThai',
	];

	public function monAns()
	{
		return $this->hasMany(MonAn::class, 'MaDanhMuc', 'MaDanhMuc');
	}
}
