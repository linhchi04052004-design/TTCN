<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DonHang extends Model
{
    use HasFactory;

    protected $table = 'DON_HANG';
    protected $primaryKey = 'MaDH';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'MaDH',
        'TenKhach',
        'SDT',
        'NgayDat',
        'HinhThuc',
        'TrangThai',
        'MaNV',
        'MaBan'
    ];

    public function chiTiet()
    {
        return $this->hasMany(ChiTietDH::class, 'MaDH', 'MaDH');
    }

    public function banAn()
    {
        return $this->belongsTo(BanAn::class, 'MaBan', 'MaBan');
    }

    public function nhanVien()
    {
        return $this->belongsTo(NhanVien::class, 'MaNV', 'MaNV');
    }

    public function hoaDon()
    {
        return $this->hasOne(HoaDon::class, 'MaDH', 'MaDH');
    }
}
