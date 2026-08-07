<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $period = $request->query('period', 'today');
        $date = $request->query('date', Carbon::today()->toDateString());

        $startDate = Carbon::today()->startOfDay();
        $endDate = Carbon::today()->endOfDay();
        $periodLabel = 'Hari Ini';

        if ($period === '7days') {
            $startDate = Carbon::now()->subDays(6)->startOfDay();
            $endDate = Carbon::now()->endOfDay();
            $periodLabel = '7 Hari Terakhir';
        } elseif ($period === '30days') {
            $startDate = Carbon::now()->subDays(29)->startOfDay();
            $endDate = Carbon::now()->endOfDay();
            $periodLabel = '30 Hari Terakhir';
        } elseif ($period === 'custom' && $date) {
            $startDate = Carbon::parse($date)->startOfDay();
            $endDate = Carbon::parse($date)->endOfDay();
            $periodLabel = Carbon::parse($date)->translatedFormat('d M Y');
        }

        // 1. Total Pesanan Masuk
        $totalOrders = Order::whereBetween('created_at', [$startDate, $endDate])->count();

        // 2. Total Pendapatan (Hanya pesanan yang sudah PAID)
        $revenue = Order::whereBetween('created_at', [$startDate, $endDate])
            ->where('payment_status', 'PAID')
            ->sum('total_amount');

        // 3. Pesanan Menunggu Diproses (Status PENDING)
        $pendingOrders = Order::whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'PENDING')
            ->count();

        // 4. Pesanan Selesai
        $completedOrders = Order::whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'SELESAI')
            ->count();

        // 5. Menu Terlaris (Top 5) berdasarkan periode terfilter
        $topMenus = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->whereBetween('orders.created_at', [$startDate, $endDate])
            ->select(
                'products.id',
                'products.name',
                'products.image',
                'products.price',
                DB::raw('SUM(order_items.qty) as total_sold')
            )
            ->groupBy('products.id', 'products.name', 'products.image', 'products.price')
            ->orderByDesc('total_sold')
            ->limit(5)
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'period_label' => strtoupper($periodLabel),
                'metrics' => [
                    'total_orders' => $totalOrders,
                    'revenue' => (int) $revenue,
                    'pending_orders' => $pendingOrders,
                    'completed_orders' => $completedOrders,
                ],
                'top_menus' => $topMenus,
            ]
        ]);
    }
}