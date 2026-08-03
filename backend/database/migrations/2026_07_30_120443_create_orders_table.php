<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique();
            $table->string('customer_name');
            $table->string('customer_phone');
            $table->foreignId('class_room_id')->constrained('class_rooms');
            $table->decimal('total_amount', 12, 2);
            
            // Metode Pembayaran
            $table->enum('payment_method', ['CASH', 'QRIS']);
            
            // Kolom INI BARU DITAMBAH untuk status Lunas / Belum Lunas
            $table->enum('payment_status', ['UNPAID', 'PAID'])->default('UNPAID');
            
            $table->decimal('cash_amount', 12, 2)->default(0);
            $table->decimal('change_amount', 12, 2)->default(0);
            
            // ENUM status disamakan dengan Frontend React kita
            $table->enum('status', ['PENDING', 'DIPROSES', 'DIANTAR', 'SELESAI', 'DIBATALKAN'])->default('PENDING');
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};