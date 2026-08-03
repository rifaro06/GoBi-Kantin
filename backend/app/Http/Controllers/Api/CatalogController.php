<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\ClassRoom;
use App\Models\Setting;
use Illuminate\Http\Request;

class CatalogController extends Controller
{
    public function index()
    {
        // 1. Ambil status kantin
        $canteenStatus = Setting::where('key_name', 'is_canteen_open')->first();
        $isCanteenOpen = $canteenStatus ? $canteenStatus->value === '1' : false;

        // 2. Ambil kategori beserta produk di dalamnya
        $categories = Category::with('products')->orderBy('sort_order')->get();

        // 3. Ambil daftar kelas yang aktif dan urutkan berdasarkan ID
        $classRooms = ClassRoom::where('is_active', true)
            ->orderBy('id', 'asc')
            ->get();

        // Return dalam bentuk JSON
        return response()->json([
            'isCanteenOpen' => $isCanteenOpen,
            'categories'    => $categories,
            'classRooms'    => $classRooms,
        ]);
    }
}