<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AdminProductController extends Controller
{
    // Mengambil semua produk dan daftar kategori
    public function index()
    {
        $products = Product::with('category')->latest()->get();
        $categories = Category::orderBy('sort_order')->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'products' => $products,
                'categories' => $categories
            ]
        ]);
    }

    // Menambah menu baru
    public function store(Request $request)
    {
        // Validasi data masukan
        $request->validate([
            'name'        => 'required|string|max:255',
            'price'       => 'required|numeric',
            'description' => 'nullable|string',
            'image'       => 'nullable',
        ]);

        $data = $request->except('image');

        // Cek apakah ada file gambar yang diupload
        if ($request->hasFile('image')) {
            // Simpan ke storage/app/public/products
            $imagePath = $request->file('image')->store('products', 'public');
            $data['image'] = url('storage/' . $imagePath);
        } elseif ($request->filled('image')) {
            // Jika dikirim berupa string URL gambar
            $data['image'] = $request->image;
        }

        Product::create($data);

        return response()->json(['status' => 'success', 'message' => 'Menu berhasil ditambahkan!']);
    }

    // Mengubah data menu
    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        // Validasi data masukan
        $request->validate([
            'name'        => 'required|string|max:255',
            'price'       => 'required|numeric',
            'description' => 'nullable|string',
            'image'       => 'nullable',
        ]);

        $data = $request->except('image');

        // Jika mengupload gambar baru
        if ($request->hasFile('image')) {
            // Hapus gambar lama dari storage jika bukan berupa URL eksternal
            if ($product->image && str_contains($product->image, 'storage/products/')) {
                $oldPath = str_replace(url('storage/'), '', $product->image);
                Storage::disk('public')->delete($oldPath);
            }

            $imagePath = $request->file('image')->store('products', 'public');
            $data['image'] = url('storage/' . $imagePath);
        }

        $product->update($data);

        return response()->json(['status' => 'success', 'message' => 'Menu berhasil diupdate!']);
    }

    // Menghapus menu
    public function destroy($id)
    {
        $product = Product::findOrFail($id);

        // Hapus file gambar dari storage jika ada
        if ($product->image && str_contains($product->image, 'storage/products/')) {
            $oldPath = str_replace(url('storage/'), '', $product->image);
            Storage::disk('public')->delete($oldPath);
        }

        $product->delete();

        return response()->json(['status' => 'success', 'message' => 'Menu berhasil dihapus!']);
    }
}