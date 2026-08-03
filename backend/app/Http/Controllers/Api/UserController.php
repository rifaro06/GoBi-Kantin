<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    // Ambil semua daftar admin
    public function index()
    {
        $users = User::select('id', 'name', 'email', 'created_at')->latest()->get();
        return response()->json(['status' => 'success', 'data' => $users]);
    }

    // Tambah admin baru
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
        ]);

        User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        return response()->json(['status' => 'success', 'message' => 'Admin baru berhasil ditambahkan!']);
    }

    // Hapus admin
    public function destroy(Request $request, $id)
    {
        // Fitur keamanan: Cegah admin menghapus akunnya sendiri yang sedang dipakai
        if ($request->user()->id == $id) {
            return response()->json(['status' => 'error', 'message' => 'Kamu tidak bisa menghapus akunmu sendiri!'], 400);
        }

        User::destroy($id);
        return response()->json(['status' => 'success', 'message' => 'Admin berhasil dihapus!']);
    }
}