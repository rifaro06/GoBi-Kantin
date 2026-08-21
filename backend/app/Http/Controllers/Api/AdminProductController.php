<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
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
            // 1. Auto mapping nama field jika frontend mengirim 'packaging_fee'
            if (!$request->has('handling_fee') && $request->has('packaging_fee')) {
                $request->merge(['handling_fee' => $request->packaging_fee]);
            }

            // 2. Validasi Input
            $request->validate([
                'name'         => 'required|string|max:255',
                'price'        => 'required|numeric',
                'category_id'  => 'nullable',
                'handling_fee' => 'nullable|numeric|min:0',
                'description'  => 'nullable|string',
                'variants'     => 'nullable|string',
                'image'        => 'nullable',
            ]);

            // 3. Susun data spesifik saja (mencegah SQL Error Mass Assignment)
            $data = [
                'name'         => $request->name,
                'price'        => $request->price,
                'handling_fee' => $request->handling_fee ?? 0,
                'description'  => $request->description,
                'variants'     => $request->variants,
            ];

            if ($request->filled('category_id')) {
                $data['category_id'] = $request->category_id;
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
            // Menampilkan error detail jika terjadi kesalahan server/SQL
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

            // Auto mapping nama field jika frontend mengirim 'packaging_fee'
            if (!$request->has('handling_fee') && $request->has('packaging_fee')) {
                $request->merge(['handling_fee' => $request->packaging_fee]);
            }

            $request->validate([
                'name'         => 'required|string|max:255',
                'price'        => 'required|numeric',
                'category_id'  => 'nullable',
                'handling_fee' => 'nullable|numeric|min:0',
                'description'  => 'nullable|string',
                'variants'     => 'nullable|string',
                'image'        => 'nullable',
            ]);

            $data = [
                'name'         => $request->name,
                'price'        => $request->price,
                'handling_fee' => $request->handling_fee ?? 0,
                'description'  => $request->description,
                'variants'     => $request->variants,
            ];

            if ($request->filled('category_id')) {
                $data['category_id'] = $request->category_id;
            }

            // Upload Gambar baru jika ada file yang diunggah
            if ($request->hasFile('image')) {
                // Hapus gambar lama dari storage jika bukan berupa URL luar
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
                'message' => 'Menu berhasil dihapus paksa!'
            ]);

        } catch (Throwable $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Gagal menghapus menu: ' . $e->getMessage()
            ], 500);
        }
    }
}