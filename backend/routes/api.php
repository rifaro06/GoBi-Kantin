<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\AdminProductController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\ClassRoomController;
use App\Http\Controllers\Api\CategoryController;

/*
|--------------------------------------------------------------------------
| PUBLIC ROUTES (Bisa Diakses Tanpa Token Login)
|--------------------------------------------------------------------------
*/

// Katalog & Pemesanan Pembeli
Route::get('/catalog', [CatalogController::class, 'index']);
Route::post('/orders', [OrderController::class, 'store']);
Route::get('/orders/track', [OrderController::class, 'track']);

// Kelola Kelas (GET dibuka untuk umum agar dropdown Checkout bisa dibaca)
Route::get('/classes', [ClassRoomController::class, 'index']);

// Kelola Kategori (GET dibuka untuk umum agar Checkout bisa menghitung ongkir)
Route::get('/categories', [CategoryController::class, 'index']);

// Pengaturan Ongkir (Bisa dibaca publik agar Checkout tidak error)
Route::get('/settings', [SettingController::class, 'index']);
Route::post('/settings', [SettingController::class, 'update']);

// Auth Login Admin
Route::post('/login', [AuthController::class, 'login']);


/*
|--------------------------------------------------------------------------
| PROTECTED ADMIN ROUTES (Wajib Pakai Token Sanctum)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    // Auth Logout
    Route::post('/logout', [AuthController::class, 'logout']);

    // Endpoint Kelola Kelas
    Route::post('/classes', [ClassRoomController::class, 'store']);
    Route::delete('/classes/{id}', [ClassRoomController::class, 'destroy']);

    // Endpoint Kelola Kategori & Ongkir Dynamic
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::put('/categories/{id}', [CategoryController::class, 'update']);
    Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

    // Prefix /api/admin/...
    Route::prefix('admin')->group(function () {

        // Ringkasan Dashboard
        Route::get('/dashboard', [DashboardController::class, 'index']);

        // Kelola Pesanan
        Route::get('/orders', [OrderController::class, 'indexAdmin']);
        Route::patch('/orders/{id}/status', [OrderController::class, 'updateStatus']);
        Route::delete('/orders/{id}', [OrderController::class, 'destroy']);

        // Kelola Produk / Menu
        Route::apiResource('/products', AdminProductController::class);

        // Kelola Kategori Admin
        Route::apiResource('/categories', CategoryController::class)->except(['create', 'edit']);

        // Kelola Akun Admin / User
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::delete('/users/{id}', [UserController::class, 'destroy']);

        // Kelola Pengaturan (Alias jika dipanggil via route admin)
        Route::get('/settings', [SettingController::class, 'index']);
        Route::post('/settings', [SettingController::class, 'update']);
    });

});