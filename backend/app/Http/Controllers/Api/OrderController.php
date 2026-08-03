<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    /**
     * Membuat pesanan baru dari Checkout
     */
    public function store(Request $request)
    {
        $request->validate([
            'customer_name' => 'required|string',
            'customer_phone' => 'required|string',
            'class_room_id' => 'required|exists:class_rooms,id',
            'payment_method' => 'required|in:CASH,QRIS',
            'items' => 'required|array|min:1',
            'items.*.id' => 'required|exists:products,id',
            'items.*.qty' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric',
            'items.*.note' => 'nullable|string',
            'delivery_fee' => 'nullable|numeric',
        ]);

        DB::beginTransaction();
        try {
            // Hitung Total Belanja dari Server
            $subtotal = 0;
            foreach ($request->items as $item) {
                $subtotal += $item['price'] * $item['qty'];
            }

            // Tambahkan ongkir ke total tagihan
            $deliveryFee = $request->delivery_fee ?? 0;
            $finalTotalAmount = $subtotal + $deliveryFee;

            $cashAmount = $request->payment_method === 'CASH' ? ($request->cash_amount ?? 0) : 0;
            $changeAmount = $request->payment_method === 'CASH' ? ($cashAmount - $finalTotalAmount) : 0;

            // Generate Order Number Unik (contoh: GB-83921)
            $orderNumber = 'GB-' . strtoupper(Str::random(5));

            // Simpan Data Utama Order
            $order = Order::create([
                'order_number' => $orderNumber,
                'customer_name' => $request->customer_name,
                'customer_phone' => $request->customer_phone,
                'class_room_id' => $request->class_room_id,
                'total_amount' => $finalTotalAmount,
                'payment_method' => $request->payment_method,
                'cash_amount' => $cashAmount,
                'change_amount' => $changeAmount > 0 ? $changeAmount : 0,
                'status' => 'PENDING'
            ]);

            // Simpan Detail Item Order
            foreach ($request->items as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item['id'],
                    'qty' => $item['qty'],
                    'price' => $item['price'],
                    'note' => $item['note'] ?? null,
                ]);
            }

            DB::commit();

            // Load Relasi untuk dikirim ke Frontend
            $order->load(['items.product', 'classRoom']);

            return response()->json([
                'message' => 'Pesanan berhasil dibuat!',
                'data' => $order
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Gagal membuat pesanan',
                'error' => $e->getMessage()
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

    // Fetch semua pesanan untuk halaman Admin
    public function indexAdmin(Request $request)
    {
        $query = Order::with(['classRoom', 'items.product'])
            ->orderBy('created_at', 'desc');

        if ($request->has('date') && $request->date != '') {
            $query->whereDate('created_at', $request->date);
        }

        $orders = $query->get();

        return response()->json(['status' => 'success', 'data' => $orders]);
    }

    // Update status pesanan
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
}