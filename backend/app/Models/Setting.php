<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use HasFactory;

    protected $table = 'settings';

    protected $fillable = [
        'key_name',
        'value',
    ];

    /**
     * Ambil nilai setting berdasarkan key_name.
     * Penggunaan: Setting::get('max_food_qty', 10);
     */
    public static function get(string $key, $default = null)
    {
        $setting = static::where('key_name', $key)->first();
        return $setting ? $setting->value : $default;
    }

    /**
     * Simpan atau perbarui nilai setting.
     * Penggunaan: Setting::set('max_food_qty', 10);
     */
    public static function set(string $key, $value): static
    {
        return static::updateOrCreate(
            ['key_name' => $key],
            ['value' => (string) $value]
        );
    }

    /**
     * Ambil seluruh data setting dalam bentuk Key-Value array.
     * Cocok digunakan untuk response API Frontend.
     * Penggunaan: Setting::getAllAsKeyValue();
     */
    public static function getAllAsKeyValue(): array
    {
        return static::pluck('value', 'key_name')->toArray();
    }
}