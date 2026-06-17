<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MonAn extends Model
{
    use HasFactory;

    protected $table = 'MON_AN';
    protected $primaryKey = 'MaMonAn';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'MaMonAn',
        'MaDanhMuc',
        'TenMonAn',
        'MoTa',
        'DonGia',
        'HinhAnh',
        'TrangThai',
    ];

    public function danhMuc()
    {
        return $this->belongsTo(DanhMucMon::class, 'MaDanhMuc', 'MaDanhMuc');
    }

    public function chiTietDH()
    {
        return $this->hasMany(ChiTietDH::class, 'MaMonAn', 'MaMonAn');
    }
}
