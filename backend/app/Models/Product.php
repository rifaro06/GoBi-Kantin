<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    // 1. REVISI: Ubah 'category' jadi 'category_id'
    protected $fillable = [
        'name', 
        'category_id', 
        'price', 
        'image', 
        'description',
        'is_available'
    ];

    protected $casts = [
        'is_available' => 'boolean',
    ];

    // 2. REVISI: Tambahkan relasi ke Kategori biar controller nggak error
    public function category()
    {
        return $this->belongsTo(Category::class);
    }
}