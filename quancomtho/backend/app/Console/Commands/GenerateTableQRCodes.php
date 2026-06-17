<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\BanAn;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Illuminate\Support\Facades\File;

class GenerateTableQRCodes extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'qrcode:generate-tables';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate SVG QR Codes for all tables based on FRONTEND_URL';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Đang khởi tạo mã QR cho tất cả bàn ăn...');

        // Lấy danh sách bàn từ DB
        $tables = BanAn::all();

        if ($tables->isEmpty()) {
            $this->error('Không tìm thấy bàn nào trong cơ sở dữ liệu!');
            return;
        }

        // Lấy FRONTEND_URL từ .env, mặc định là http://localhost:5173 nếu không có
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
        $this->line("URL giao diện sử dụng: <info>{$frontendUrl}</info>");

        // Đường dẫn lưu file
        $path = public_path('qrcodes');

        // Tạo thư mục nếu chưa tồn tại
        if (!File::exists($path)) {
            File::makeDirectory($path, 0755, true);
        }

        $count = 0;

        foreach ($tables as $table) {
            // Xây dựng URL đích
            $url = rtrim($frontendUrl, '/') . '/order/' . $table->MaBan;
            
            // Tên file (Vd: B01.svg)
            $filename = $table->MaBan . '.svg';
            $filepath = $path . '/' . $filename;

            // Generate QR Code
            QrCode::size(300)
                ->margin(2)
                ->generate($url, $filepath);

            $this->line(" - Đã tạo QR cho bàn <comment>{$table->MaBan}</comment> -> {$filename}");
            $count++;
        }

        $this->info("Hoàn tất! Đã tạo thành công {$count} mã QR tại thư mục public/qrcodes.");
    }
}
