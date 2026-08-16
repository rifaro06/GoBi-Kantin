<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 
        'category_id', 
        'price', 
        'handling_fee', // <-- TAMBAHKAN INI
        'image', 
        'description',
        'is_available'
    ];

    protected $casts = [
        'is_available' => 'boolean',
        'handling_fee' => 'integer',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }
}