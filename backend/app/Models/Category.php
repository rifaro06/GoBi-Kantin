<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'sort_order'];

    // Relasi ini wajib ada agar data produk bisa ditarik
    public function products()
    {
        return $this->hasMany(Product::class);
    }
}