<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        $today = Carbon::today();

        // 1. Total Pesanan Hari Ini
        $totalOrdersToday = Order::whereDate('created_at', $today)->count();

        // 2. Pendapatan Hari Ini (Hanya pesanan yang sudah PAID)
        $revenueToday = Order::whereDate('created_at', $today)
                             ->where('payment_status', 'PAID')
                             ->sum('total_amount');

        // 3. Pesanan Menunggu Proses (Status PENDING)
        $pendingOrders = Order::where('status', 'PENDING')->count();

        // 4. Menu Terlaris (Top 5)
        // Menghitung dari tabel order_items, di-group berdasarkan product_id
        $topMenus = DB::table('order_items')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->select('products.name', 'products.image', 'products.price', DB::raw('SUM(order_items.qty) as total_sold'))
            ->groupBy('order_items.product_id', 'products.name', 'products.image', 'products.price')
            ->orderByDesc('total_sold')
            ->limit(5)
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'metrics' => [
                    'total_orders_today' => $totalOrdersToday,
                    'revenue_today' => (int) $revenueToday,
                    'pending_orders' => $pendingOrders,
                ],
                'top_menus' => $topMenus,
            ]
        ]);
    }
}