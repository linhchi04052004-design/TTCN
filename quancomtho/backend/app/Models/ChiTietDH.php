<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChiTietDH extends Model
{
    use HasFactory;

    protected $table = 'chi_tiet_dh';
    protected $primaryKey = 'MaCTDH';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'MaCTDH',
        'MaDH',
        'MaMonAn',
        'SoLuong',
        'DonGiaTaiThoiDiemBan',
        'GhiChu'
        // TongTien is generated
    ];

    public function donHang()
    {
        return $this->belongsTo(DonHang::class, 'MaDH', 'MaDH');
    }

    public function monAn()
    {
        return $this->belongsTo(MonAn::class, 'MaMonAn', 'MaMonAn');
    }
}
