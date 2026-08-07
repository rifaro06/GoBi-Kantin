<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    /**
     * Tampilkan semua kategori beserta biaya ongkir dan tipe ongkirnya
     */
    public function index()
    {
        try {
            $categories = Category::orderBy('sort_order', 'asc')->orderBy('name', 'asc')->get();
        } catch (\Exception $e) {
            $categories = Category::orderBy('name', 'asc')->get();
        }

        return response()->json([
            'status' => 'success',
            'data'   => $categories
        ]);
    }

    /**
     * Tambah kategori baru
     */
    public function store(Request $request)
    {
        $request->validate([
            'name'         => 'required|string|max:100|unique:categories,name',
            'shipping_fee' => 'nullable|numeric|min:0',
            'fee_type'     => 'nullable|string|in:flat,tier_qty,threshold_nominal',
        ]);

        try {
            $maxOrder = Category::max('sort_order') ?? 0;
            $name = trim($request->name);

            $category = Category::create([
                'name'         => $name,
                'slug'         => Str::slug($name),
                'shipping_fee' => $request->shipping_fee ?? 0,
                'fee_type'     => $request->fee_type ?? 'flat',
                'sort_order'   => $maxOrder + 1,
            ]);

            return response()->json([
                'status'  => 'success',
                'message' => 'Kategori dan ongkir berhasil ditambahkan',
                'data'    => $category
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Gagal menyimpan kategori: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update nama kategori, biaya ongkir, dan tipe ongkir
     */
    public function update(Request $request, $id)
    {
        $category = Category::find($id);

        if (!$category) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Kategori tidak ditemukan'
            ], 404);
        }

        $request->validate([
            'name'         => 'sometimes|string|max:100|unique:categories,name,' . $id,
            'shipping_fee' => 'sometimes|numeric|min:0',
            'fee_type'     => 'sometimes|nullable|string|in:flat,tier_qty,threshold_nominal',
            'sort_order'   => 'sometimes|integer',
        ]);

        try {
            $updateData = [];

            if ($request->has('name')) {
                $updateData['name'] = trim($request->name);
                $updateData['slug'] = Str::slug($request->name);
            }

            if ($request->has('shipping_fee')) {
                $updateData['shipping_fee'] = $request->shipping_fee;
            }

            if ($request->has('fee_type')) {
                $updateData['fee_type'] = $request->fee_type;
            }

            if ($request->has('sort_order')) {
                $updateData['sort_order'] = $request->sort_order;
            }

            $category->update($updateData);

            return response()->json([
                'status'  => 'success',
                'message' => 'Aturan ongkir kategori berhasil diperbarui',
                'data'    => $category
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Gagal memperbarui kategori: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Hapus kategori
     */
    public function destroy($id)
    {
        $category = Category::find($id);

        if (!$category) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Kategori tidak ditemukan'
            ], 404);
        }

        if (method_exists($category, 'products') && $category->products()->count() > 0) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Gagal menghapus: Kategori ini masih memiliki produk terkait.'
            ], 422);
        }

        $category->delete();

        return response()->json([
            'status'  => 'success',
            'message' => 'Kategori berhasil dihapus'
        ]);
    }
}