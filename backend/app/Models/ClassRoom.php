<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClassRoom extends Model
{
    use HasFactory;

    protected $fillable = [
        'level', 
        'name', 
        'is_active'
    ];

    // Konversi is_active otomatis jadi boolean (true/false)
    protected $casts = [
        'is_active' => 'boolean',
    ];

    // Relasi: Satu kelas bisa punya banyak pesanan
    public function orders()
    {
        return $this->hasMany(Order::class);
    }
}