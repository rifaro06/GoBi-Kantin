<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Throwable;

class OrderController extends Controller
{
    /**
     * Membuat pesanan baru dari Checkout
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_name'  => 'required|string|max:255',
            'customer_phone' => 'required|string|max:20',
            'class_room_id'  => 'required|exists:class_rooms,id',
            'payment_method' => 'required|in:CASH,QRIS',
            'cash_amount'    => 'required_if:payment_method,CASH|nullable|numeric|min:0',
            'items'          => 'required|array|min:1',
            'items.*.id'     => 'required|exists:products,id',
            'items.*.qty'    => 'required|integer|min:1',
            'items.*.price'  => 'required|numeric|min:0',
            'items.*.note'   => 'nullable|string',
            'items.*.variant'=> 'nullable|string',
            'delivery_fee'   => 'nullable|numeric|min:0',
            'handling_fee'   => 'nullable|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            $subtotal = 0;
            foreach ($validated['items'] as $item) {
                $subtotal += $item['price'] * $item['qty'];
            }

            $deliveryFee = $validated['delivery_fee'] ?? 0;
            $handlingFee = $validated['handling_fee'] ?? 0;
            $finalTotalAmount = $subtotal + $deliveryFee + $handlingFee;

            $cashAmount = ($validated['payment_method'] === 'CASH') ? ($validated['cash_amount'] ?? 0) : 0;
            $changeAmount = ($validated['payment_method'] === 'CASH') ? max(0, $cashAmount - $finalTotalAmount) : 0;

            $orderNumber = 'GB-' . strtoupper(Str::random(5));

            $order = Order::create([
                'order_number'   => $orderNumber,
                'customer_name'  => $validated['customer_name'],
                'customer_phone' => $validated['customer_phone'],
                'class_room_id'  => $validated['class_room_id'],
                'total_amount'   => $finalTotalAmount,
                'delivery_fee'   => $deliveryFee,
                'handling_fee'   => $handlingFee,
                'payment_method' => $validated['payment_method'],
                'payment_status' => 'UNPAID',
                'cash_amount'    => $cashAmount,
                'change_amount'  => $changeAmount,
                'status'         => 'PENDING'
            ]);

            foreach ($validated['items'] as $item) {
                OrderItem::create([
                    'order_id'   => $order->id,
                    'product_id' => $item['id'],
                    'qty'        => $item['qty'],
                    'price'      => $item['price'],
                    'note'       => $item['note'] ?? null,
                    'variant'    => $item['variant'] ?? null,
                ]);
            }

            DB::commit();

            $order->load(['items.product', 'classRoom']);

            return response()->json([
                'status'  => 'success',
                'message' => 'Pesanan berhasil dibuat!',
                'data'    => $order
            ], 201);

        } catch (Throwable $e) {
            DB::rollBack();
            return response()->json([
                'status'  => 'error',
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
        $query = trim($request->query('query', ''));

        if (empty($query)) {
            return response()->json([
                'status'  => 'error',
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
                'status'  => 'error',
                'message' => 'Data pesanan tidak ditemukan.'
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data'   => $orders
        ]);
    }

    /**
     * Fetch semua pesanan untuk halaman Admin (dengan Filter Periode)
     */
    public function indexAdmin(Request $request)
    {
        $period = $request->query('period', 'today');
        $date   = $request->query('date', Carbon::today()->toDateString());

        $startDate = Carbon::today()->startOfDay();
        $endDate   = Carbon::today()->endOfDay();

        if ($period === '7days') {
            $startDate = Carbon::now()->subDays(6)->startOfDay();
            $endDate   = Carbon::now()->endOfDay();
        } elseif ($period === '30days') {
            $startDate = Carbon::now()->subDays(29)->startOfDay();
            $endDate   = Carbon::now()->endOfDay();
        } elseif ($period === 'custom' && $date) {
            $startDate = Carbon::parse($date)->startOfDay();
            $endDate   = Carbon::parse($date)->endOfDay();
        }

        $orders = Order::with(['classRoom', 'items.product'])
            ->whereBetween('created_at', [$startDate, $endDate])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data'   => $orders
        ]);
    }

    /**
     * Update status pesanan / pembayaran
     */
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status'         => 'nullable|in:PENDING,DIPROSES,DIANTAR,SELESAI',
            'payment_status' => 'nullable|in:UNPAID,PAID',
        ]);

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
                'status'  => 'success',
                'message' => 'Status berhasil diubah!',
                'data'    => $order
            ]);

        } catch (Throwable $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Error dari Server: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Hapus pesanan beserta item-item terkait
     */
    public function destroy($id)
    {
        DB::beginTransaction();
        try {
            $order = Order::findOrFail($id);

            // Hapus order_items terkait
            $order->items()->delete();

            // Hapus order utama
            $order->delete();

            DB::commit();

            return response()->json([
                'status'  => 'success',
                'message' => 'Pesanan berhasil dihapus!'
            ]);

        } catch (Throwable $e) {
            DB::rollBack();
            return response()->json([
                'status'  => 'error',
                'message' => 'Gagal menghapus pesanan: ' . $e->getMessage()
            ], 500);
        }
    }
}