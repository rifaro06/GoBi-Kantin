<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class OrderController extends Controller
{
    /**
     * Membuat pesanan baru dari Checkout
     */
    public function store(Request $request)
    {
        $request->validate([
            'customer_name'  => 'required|string',
            'customer_phone' => 'required|string',
            'class_room_id'  => 'required|exists:class_rooms,id',
            'payment_method' => 'required|in:CASH,QRIS',
            'items'          => 'required|array|min:1',
            'items.*.id'     => 'required|exists:products,id',
            'items.*.qty'    => 'required|integer|min:1',
            'items.*.price'  => 'required|numeric',
            'items.*.note'   => 'nullable|string',
            'delivery_fee'   => 'nullable|numeric',
            'handling_fee'   => 'nullable|numeric', // Validasi handling fee
        ]);

        DB::beginTransaction();
        try {
            $subtotal = 0;
            foreach ($request->items as $item) {
                $subtotal += $item['price'] * $item['qty'];
            }

            $deliveryFee = $request->delivery_fee ?? 0;
            $handlingFee = $request->handling_fee ?? 0;
            
            // Total bayar = subtotal produk + ongkir pengiriman + total biaya penanganan
            $finalTotalAmount = $subtotal + $deliveryFee + $handlingFee;

            $cashAmount = $request->payment_method === 'CASH' ? ($request->cash_amount ?? 0) : 0;
            $changeAmount = $request->payment_method === 'CASH' ? ($cashAmount - $finalTotalAmount) : 0;

            $orderNumber = 'GB-' . strtoupper(Str::random(5));

            $order = Order::create([
                'order_number'   => $orderNumber,
                'customer_name'  => $request->customer_name,
                'customer_phone' => $request->customer_phone,
                'class_room_id'  => $request->class_room_id,
                'total_amount'   => $finalTotalAmount,
                'payment_method' => $request->payment_method,
                'cash_amount'    => $cashAmount,
                'change_amount'  => $changeAmount > 0 ? $changeAmount : 0,
                'status'         => 'PENDING'
            ]);

            foreach ($request->items as $item) {
                OrderItem::create([
                    'order_id'   => $order->id,
                    'product_id' => $item['id'],
                    'qty'        => $item['qty'],
                    'price'      => $item['price'],
                    'note'       => $item['note'] ?? null,
                ]);
            }

            DB::commit();

            $order->load(['items.product', 'classRoom']);

            return response()->json([
                'message' => 'Pesanan berhasil dibuat!',
                'data'    => $order
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Gagal membuat pesanan',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Melacak pesanan berdasarkan No. HP atau Nomor Pesanan
     */
    public function track(Request $request)
    {
        $query = $request->query('query');

        if (!$query) {
            return response()->json([
                'status' => 'error',
                'message' => 'Masukkan nomor HP atau nomor pesanan.'
            ], 400);
        }

        $orders = Order::with(['classRoom', 'items.product'])
            ->where('order_number', $query)
            ->orWhere('customer_phone', $query)
            ->orderBy('created_at', 'desc')
            ->get();

        if ($orders->isEmpty()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Data pesanan tidak ditemukan.'
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => $orders
        ]);
    }

    /**
     * Fetch semua pesanan untuk halaman Admin (dengan Filter Periode)
     */
    public function indexAdmin(Request $request)
    {
        $period = $request->query('period', 'today');
        $date = $request->query('date', Carbon::today()->toDateString());

        $startDate = Carbon::today()->startOfDay();
        $endDate = Carbon::today()->endOfDay();

        if ($period === '7days') {
            $startDate = Carbon::now()->subDays(6)->startOfDay();
            $endDate = Carbon::now()->endOfDay();
        } elseif ($period === '30days') {
            $startDate = Carbon::now()->subDays(29)->startOfDay();
            $endDate = Carbon::now()->endOfDay();
        } elseif ($period === 'custom' && $date) {
            $startDate = Carbon::parse($date)->startOfDay();
            $endDate = Carbon::parse($date)->endOfDay();
        }

        $orders = Order::with(['classRoom', 'items.product'])
            ->whereBetween('created_at', [$startDate, $endDate])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'status' => 'success', 
            'data' => $orders
        ]);
    }

    /**
     * Update status pesanan
     */
    public function updateStatus(Request $request, $id)
    {
        try {
            $order = Order::findOrFail($id);

            if ($request->has('status')) {
                $order->status = $request->status;
            }

            if ($request->has('payment_status')) {
                $order->payment_status = $request->payment_status;
            }

            $order->save();

            return response()->json([
                'status' => 'success',
                'message' => 'Status berhasil diubah!'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error dari Server: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Hapus pesanan (Fitur percobaan/cleaning data)
     */
    public function destroy($id)
    {
        try {
            $order = Order::findOrFail($id);
            
            // Hapus order_items terkait dulu
            $order->items()->delete();
            
            // Hapus order utama
            $order->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Pesanan berhasil dihapus!'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menghapus pesanan: ' . $e->getMessage()
            ], 500);
        }
    }
}