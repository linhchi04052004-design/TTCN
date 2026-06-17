<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BanAn extends Model
{
    use HasFactory;

    protected $table = 'ban_an';
    protected $primaryKey = 'MaBan';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'MaBan',
        'TenBan',
        'TrangThai',
        'SucChua'
    ];

    public function donHangs()
    {
        return $this->hasMany(DonHang::class, 'MaBan', 'MaBan');
    }
}
