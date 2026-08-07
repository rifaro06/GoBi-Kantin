<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClassRoom;
use Illuminate\Http\Request;

class ClassRoomController extends Controller
{
    /**
     * Ambil daftar kelas yang sudah diurutkan secara hierarki sekolah (VII -> XII)
     */
    public function index()
    {
        $classes = ClassRoom::all()->sortBy(function ($item) {
            $name = strtoupper($item->name);
            $weight = 99;

            // Penentuan bobot urutan angka Romawi tingkat kelas
            if (str_contains($name, 'VIII')) {
                $weight = 2; // Kelas 8 / VIII
            } elseif (str_contains($name, 'VII')) {
                $weight = 1; // Kelas 7 / VII
            } elseif (str_contains($name, 'IX')) {
                $weight = 3; // Kelas 9 / IX
            } elseif (str_contains($name, 'XII')) {
                $weight = 6; // Kelas 12 / XII
            } elseif (str_contains($name, 'XI')) {
                $weight = 5; // Kelas 11 / XI
            } elseif (str_contains($name, 'X')) {
                $weight = 4; // Kelas 10 / X
            }

            // Gabungkan Bobot Tingkat + Nama Kelas untuk pengurutan abjad di dalam kelas yang sama (A, B, C)
            return sprintf('%02d-%s', $weight, $name);
        })->values();

        return response()->json([
            'status' => 'success',
            'data'   => $classes
        ]);
    }

    /**
     * Tambah kelas baru
     */
    public function store(Request $request)
    {
        $request->validate([
            'name'  => 'required|string|max:100',
            'level' => 'nullable|string|max:50',
        ]);

        $class = ClassRoom::create([
            'name'      => trim($request->name),
            'level'     => $request->level ? strtoupper(trim($request->level)) : 'UMUM',
            'is_active' => true,
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Kelas berhasil ditambahkan',
            'data'    => $class
        ], 201);
    }

    /**
     * Hapus kelas
     */
    public function destroy($id)
    {
        $class = ClassRoom::findOrFail($id);
        $class->delete();

        return response()->json([
            'status'  => 'success',
            'message' => 'Kelas berhasil dihapus'
        ]);
    }
}