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
            // Mapping nama field biaya kemasan jika dikirim sebagai packaging_fee
            $handlingFee = $request->handling_fee ?? $request->packaging_fee ?? 0;

            // Daftar data calon simpan
            $inputData = [
                'name'         => $request->name,
                'price'        => $request->price,
                'handling_fee' => $handlingFee,
                'packaging_fee'=> $handlingFee,
                'description'  => $request->description,
                'variants'     => $request->variants,
                'category_id'  => $request->category_id,
            ];

            // FILTER: Hanya ambil data yang nama kolomnya BENAR-BENAR ADA di tabel 'products'
            $data = [];
            foreach ($inputData as $column => $value) {
                if (Schema::hasColumn('products', $column) && $value !== null) {
                    $data[$column] = $value;
                }
            }

            // Handling Upload Gambar
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

            $handlingFee = $request->handling_fee ?? $request->packaging_fee ?? 0;

            $inputData = [
                'name'         => $request->name,
                'price'        => $request->price,
                'handling_fee' => $handlingFee,
                'packaging_fee'=> $handlingFee,
                'description'  => $request->description,
                'variants'     => $request->variants,
                'category_id'  => $request->category_id,
            ];

            $data = [];
            foreach ($inputData as $column => $value) {
                if (Schema::hasColumn('products', $column) && $value !== null) {
                    $data[$column] = $value;
                }
            }

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