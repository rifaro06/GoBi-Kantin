<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Setting;
use Illuminate\Support\Facades\Storage;

class SettingController extends Controller
{
    // GET /api/settings
    public function index()
    {
        try {
            $settings = Setting::pluck('value', 'key_name')->toArray();

            // Bersihkan URL lama jika masih menyimpan domain 127.0.0.1 / localhost
            if (isset($settings['qris_image_url']) && $settings['qris_image_url']) {
                $path = parse_url($settings['qris_image_url'], PHP_URL_PATH);
                if (!str_starts_with($path, '/storage/')) {
                    $path = '/storage/' . ltrim($path, '/');
                }
                // Kembalikan path relatif agar otomatis menyesuaikan HTTPS Ngrok / Localhost
                $settings['qris_image_url'] = $path;
            }

            return response()->json([
                'status' => 'success',
                'data' => $settings
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // POST /api/settings
    public function update(Request $request)
    {
        try {
            $qrisUrl = null;

            // 1. Tangani Upload Gambar QRIS jika ada file yang dikirim
            if ($request->hasFile('qris_image')) {
                $file = $request->file('qris_image');
                
                // Simpan gambar ke folder storage/app/public/qris
                $path = $file->store('qris', 'public');
                
                // Simpan path relatif ke database
                $qrisUrl = '/storage/' . $path;

                Setting::updateOrCreate(
                    ['key_name' => 'qris_image_url'],
                    ['value' => $qrisUrl]
                );
            }

            // 2. Simpan semua setting teks/angka biasa
            $inputs = $request->except(['qris_image']);
            foreach ($inputs as $key => $value) {
                if ($key === 'qris_image_url' && $qrisUrl) {
                    continue;
                }

                if (!is_array($value) && !is_object($value)) {
                    Setting::updateOrCreate(
                        ['key_name' => $key],
                        ['value' => (string) $value]
                    );
                }
            }

            // Ambil path QRIS terbaru
            $finalQrisUrl = $qrisUrl ?? Setting::get('qris_image_url');
            if ($finalQrisUrl) {
                $finalQrisUrl = parse_url($finalQrisUrl, PHP_URL_PATH);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Pengaturan berhasil disimpan!',
                'qris_image_url' => $finalQrisUrl
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}