<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Setting;

class SettingController extends Controller
{
    // GET /api/settings
    public function index()
    {
        try {
            $settings = Setting::pluck('value', 'key_name')->toArray();
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
            foreach ($request->all() as $key => $value) {
                Setting::updateOrCreate(
                    ['key_name' => $key],
                    ['value' => (string) $value]
                );
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Pengaturan berhasil disimpan!'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}