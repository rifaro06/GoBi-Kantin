<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Throwable;

class AdminProductController extends Controller
{
    public function index()
    {
        try {
            $products = Product::with('category')->latest()->get();
            $categories = Category::orderBy('sort_order')->get();

            return response()->json([
                'status' => 'success',
                'data' => [
                    'products' => $products,
                    'categories' => $categories
                ]
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengambil data menu: ' . $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            // 1. Ambil daftar semua kolom resmi yang ada di tabel 'products'
            $columns = Schema::getColumnListing('products');

            // 2. Ambil seluruh input request dari frontend
            $inputs = $request->except(['image', '_method', '_token']);

            // Auto-mapping Biaya Kemasan (packaging_fee / handling_fee)
            if (!isset($inputs['handling_fee']) && isset($inputs['packaging_fee'])) {
                $inputs['handling_fee'] = $inputs['packaging_fee'];
            }
            if (!isset($inputs['packaging_fee']) && isset($inputs['handling_fee'])) {
                $inputs['packaging_fee'] = $inputs['handling_fee'];
            }

            // Auto-mapping Status Ketersediaan (TERSEDIA/HABIS <-> is_available/is_active)
            if (isset($inputs['status'])) {
                $isAvail = ($inputs['status'] === 'TERSEDIA' || $inputs['status'] === '1' || $inputs['status'] === true || $inputs['status'] === 1);
                $inputs['is_available'] = $isAvail ? 1 : 0;
                $inputs['is_active']    = $isAvail ? 1 : 0;
            } elseif (isset($inputs['is_available'])) {
                $isAvail = filter_var($inputs['is_available'], FILTER_VALIDATE_BOOLEAN);
                $inputs['status']    = $isAvail ? 'TERSEDIA' : 'HABIS';
                $inputs['is_active'] = $isAvail ? 1 : 0;
            }

            // 3. Masukkan HANYA data yang nama kolomnya benar-benar ada di MySQL
            $data = [];
            foreach ($inputs as $key => $value) {
                if (in_array($key, $columns) && $value !== null) {
                    $data[$key] = $value;
                }
            }

            // 4. Handling Upload Gambar
            if ($request->hasFile('image')) {
                $imagePath = $request->file('image')->store('products', 'public');
                $data['image'] = url('storage/' . $imagePath);
            } elseif ($request->filled('image')) {
                $data['image'] = $request->image;
            }

            $product = Product::create($data);

            return response()->json([
                'status'  => 'success',
                'message' => 'Menu berhasil ditambahkan!',
                'data'    => $product
            ], 201);

        } catch (Throwable $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Error Server: ' . $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $product = Product::findOrFail($id);

            // 1. Ambil daftar semua kolom resmi yang ada di tabel 'products'
            $columns = Schema::getColumnListing('products');

            // 2. Ambil seluruh input request dari frontend
            $inputs = $request->except(['image', '_method', '_token']);

            // Auto-mapping Biaya Kemasan (packaging_fee / handling_fee)
            if (!isset($inputs['handling_fee']) && isset($inputs['packaging_fee'])) {
                $inputs['handling_fee'] = $inputs['packaging_fee'];
            }
            if (!isset($inputs['packaging_fee']) && isset($inputs['handling_fee'])) {
                $inputs['packaging_fee'] = $inputs['handling_fee'];
            }

            // Auto-mapping Status Ketersediaan (TERSEDIA/HABIS <-> is_available/is_active)
            if (isset($inputs['status'])) {
                $isAvail = ($inputs['status'] === 'TERSEDIA' || $inputs['status'] === '1' || $inputs['status'] === true || $inputs['status'] === 1);
                $inputs['is_available'] = $isAvail ? 1 : 0;
                $inputs['is_active']    = $isAvail ? 1 : 0;
            } elseif (isset($inputs['is_available'])) {
                $isAvail = filter_var($inputs['is_available'], FILTER_VALIDATE_BOOLEAN);
                $inputs['status']    = $isAvail ? 'TERSEDIA' : 'HABIS';
                $inputs['is_active'] = $isAvail ? 1 : 0;
            }

            // 3. Masukkan HANYA data yang nama kolomnya benar-benar ada di MySQL
            $data = [];
            foreach ($inputs as $key => $value) {
                if (in_array($key, $columns) && $value !== null) {
                    $data[$key] = $value;
                }
            }

            // 4. Handling Upload Gambar
            if ($request->hasFile('image')) {
                if ($product->image && str_contains($product->image, 'storage/products/')) {
                    $oldPath = str_replace(url('storage/'), '', $product->image);
                    Storage::disk('public')->delete($oldPath);
                }

                $imagePath = $request->file('image')->store('products', 'public');
                $data['image'] = url('storage/' . $imagePath);
            }

            $product->update($data);

            return response()->json([
                'status'  => 'success',
                'message' => 'Menu berhasil diupdate!',
                'data'    => $product
            ]);

        } catch (Throwable $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Error Server: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $product = Product::findOrFail($id);

            if ($product->image && str_contains($product->image, 'storage/products/')) {
                $oldPath = str_replace(url('storage/'), '', $product->image);
                Storage::disk('public')->delete($oldPath);
            }

            DB::statement('SET FOREIGN_KEY_CHECKS=0;'); 
            $product->delete(); 
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');

            return response()->json([
                'status'  => 'success',
                'message' => 'Menu berhasil dihapus!'
            ]);

        } catch (Throwable $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Gagal menghapus menu: ' . $e->getMessage()
            ], 500);
        }
    }
}