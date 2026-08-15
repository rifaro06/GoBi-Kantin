<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    // Ambil semua daftar akun (Admin & Driver)
    public function index()
    {
        // 1. Tambahin 'role' di sini biar bisa dibaca sama tabel frontend
        $users = User::select('id', 'name', 'email', 'role', 'created_at')->latest()->get();
        return response()->json(['status' => 'success', 'data' => $users]);
    }

    // Tambah akun baru
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
            'role' => 'required|in:admin,driver', // 2. Validasi biar role cuma bisa admin atau driver
        ]);

        User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role, // 3. Simpan role ke database
        ]);

        return response()->json(['status' => 'success', 'message' => 'Akun baru berhasil ditambahkan!']);
    }

    // Hapus akun
    public function destroy(Request $request, $id)
    {
        // Fitur keamanan: Cegah user menghapus akunnya sendiri yang sedang dipakai
        if ($request->user()->id == $id) {
            return response()->json(['status' => 'error', 'message' => 'Kamu tidak bisa menghapus akunmu sendiri!'], 400);
        }

        User::destroy($id);
        return response()->json(['status' => 'success', 'message' => 'Akun berhasil dihapus!']);
    }
}