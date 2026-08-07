<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CatalogController extends Controller
{
    public function index()
    {
        try {
            // 1. Ambil data mentah dari database
            $categoriesRaw = Schema::hasTable('categories') ? DB::table('categories')->get() : collect([]);
            $productsRaw   = Schema::hasTable('products') ? DB::table('products')->get() : collect([]);

            // Helper format produk
            $formattedProducts = $productsRaw->map(function ($p) {
                return [
                    'id'           => $p->id ?? rand(1000, 9999),
                    'category_id'  => $p->category_id ?? null,
                    'category_name'=> $p->category_name ?? $p->kategori ?? null,
                    'name'         => $p->name ?? $p->title ?? $p->nama_produk ?? $p->nama ?? 'Menu Kantin',
                    'price'        => (float) ($p->price ?? $p->harga ?? 0),
                    'image'        => $p->image ?? $p->foto ?? $p->gambar ?? null,
                    'description'  => $p->description ?? $p->deskripsi ?? '',
                    'is_available' => isset($p->is_available) ? (bool)$p->is_available : true,
                ];
            })->values();

            $catalogData = [];

            if ($categoriesRaw->isNotEmpty()) {
                foreach ($categoriesRaw as $cat) {
                    $catId   = (string) $cat->id;
                    $catName = $cat->name ?? 'Kategori';

                    $matchingProducts = $formattedProducts->filter(function ($p) use ($catId, $catName) {
                        $pCatId   = isset($p['category_id']) ? (string) $p['category_id'] : null;
                        $pCatName = isset($p['category_name']) ? (string) $p['category_name'] : null;
                        
                        return ($pCatId !== null && $pCatId === $catId) || 
                               ($pCatName !== null && strtolower($pCatName) === strtolower($catName));
                    })->values()->all();

                    $catalogData[] = [
                        'id'           => $cat->id,
                        'name'         => $catName,
                        'slug'         => $cat->slug ?? '',
                        'shipping_fee' => $cat->shipping_fee ?? 0,
                        'products'     => $matchingProducts,
                    ];
                }
            }

            // Hitung total produk yang berhasil masuk ke dalam kategori
            $totalAssigned = array_reduce($catalogData, function ($sum, $cat) {
                return $sum + count($cat['products']);
            }, 0);

            // PENYELAMAT: JIKA KATEGORI KOSONG ATAU RELASI CATEGORY_ID TIDAK COCOK
            if ($totalAssigned === 0 && $formattedProducts->isNotEmpty()) {
                $catalogData = [
                    [
                        'id'           => 1,
                        'name'         => 'Semua Menu',
                        'slug'         => 'semua-menu',
                        'shipping_fee' => 0,
                        'products'     => $formattedProducts->all(),
                    ]
                ];
            }

            $classRooms = Schema::hasTable('class_rooms') ? DB::table('class_rooms')->get() : [];
            
            // PERBAIKAN UTAMA: Menggunakan key_name sesuai schema tabel settings
            $settings = [];
            if (Schema::hasTable('settings')) {
                try {
                    $settings = DB::table('settings')->pluck('value', 'key_name')->toArray();
                } catch (\Throwable $e) {
                    $settings = DB::table('settings')->pluck('value', 'key')->toArray();
                }
            }

            return response()->json([
                'status'     => 'success',
                'categories' => $catalogData,
                'data'       => $catalogData,
                'products'   => $formattedProducts->all(),
                'classRooms' => $classRooms,
                'settings'   => $settings,
            ], 200, [
                'ngrok-skip-browser-warning' => 'true'
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'status'     => 'error',
                'message'    => 'Error: ' . $e->getMessage(),
                'categories' => [],
                'data'       => [],
                'products'   => [],
            ], 200);
        }
    }
}