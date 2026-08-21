<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class AdminProductController extends Controller
{
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

    public function store(Request $request)
    {
        $request->validate([
            'name'         => 'required|string|max:255',
            'category_id'  => 'required|exists:categories,id',
            'price'        => 'required|numeric',
            'handling_fee' => 'nullable|numeric|min:0',
            'description'  => 'nullable|string',
            'variants'     => 'nullable|string', // <-- TAMBAHAN VARIAN
            'image'        => 'nullable',
        ]);

        $data = $request->except('image');

        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('products', 'public');
            $data['image'] = url('storage/' . $imagePath);
        } elseif ($request->filled('image')) {
            $data['image'] = $request->image;
        }

        Product::create($data);

        return response()->json(['status' => 'success', 'message' => 'Menu berhasil ditambahkan!']);
    }

    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        $request->validate([
            'name'         => 'required|string|max:255',
            'price'        => 'required|numeric',
            'handling_fee' => 'nullable|numeric|min:0',
            'description'  => 'nullable|string',
            'variants'     => 'nullable|string', // <-- TAMBAHAN VARIAN
            'image'        => 'nullable',
        ]);

        $data = $request->except('image');

        if ($request->hasFile('image')) {
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

    public function destroy($id)
    {
        $product = Product::findOrFail($id);

        if ($product->image && str_contains($product->image, 'storage/products/')) {
            $oldPath = str_replace(url('storage/'), '', $product->image);
            Storage::disk('public')->delete($oldPath);
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=0;'); 
        $product->delete(); 
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        return response()->json(['status' => 'success', 'message' => 'Menu berhasil dihapus paksa!']);
    }
}