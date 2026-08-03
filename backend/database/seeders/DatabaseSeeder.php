<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Setting;
use App\Models\Category;
use App\Models\Product;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Status Kantin
        Setting::updateOrCreate(['key_name' => 'is_canteen_open'], ['value' => '1']);

        // 2. Panggil ClassRoomSeeder (Biar baca daftar kelas terbaru yang rapi)
        $this->call([
            ClassRoomSeeder::class,
        ]);

        // 3. Kategori Menu Sesuai Prompt (Makanan, Minuman, Snack)
        $makanan = Category::create(['name' => 'Makanan', 'sort_order' => 1]);
        $minuman = Category::create(['name' => 'Minuman', 'sort_order' => 2]);
        $snack   = Category::create(['name' => 'Snack', 'sort_order' => 3]);

        // 4. Insert Produk Kategori MAKANAN
        $makananProducts = [
            ['name' => 'Mie Gaul', 'price' => 4000],
            ['name' => 'MiReng', 'price' => 4000],
            ['name' => 'Indomie Goreng Special (Telur Rebus & Sayur)', 'price' => 8000],
        ];
        foreach ($makananProducts as $p) {
            Product::create([
                'category_id' => $makanan->id,
                'name' => $p['name'],
                'price' => $p['price'],
                'is_available' => true // True = Tersedia, False = Habis
            ]);
        }

        // 5. Insert Produk Kategori MINUMAN
        $minumanProducts = [
            ['name' => 'Teh Pucuk', 'price' => 5000],
            ['name' => 'Floridina', 'price' => 4000],
            ['name' => 'Cleo 500ml', 'price' => 3000],
            ['name' => 'Cleo Gelas', 'price' => 1000],
            ['name' => 'Cleo Botol Kecil', 'price' => 2000],
            ['name' => 'Nipis Madu', 'price' => 4000],
            ['name' => 'Golda', 'price' => 4000],
            ['name' => 'Milku', 'price' => 4000],
            ['name' => 'Matcha', 'price' => 5000],
            ['name' => 'Teh Tarik', 'price' => 5000],
        ];
        foreach ($minumanProducts as $p) {
            Product::create([
                'category_id' => $minuman->id,
                'name' => $p['name'],
                'price' => $p['price'],
                'is_available' => true
            ]);
        }

        // 6. Insert Produk Kategori SNACK
        $snackProducts = [
            ['name' => 'Malkist Gula', 'price' => 1000], ['name' => 'Malkist Balado', 'price' => 1000],
            ['name' => 'Malkist Coklat', 'price' => 1000], ['name' => 'Beng-Beng', 'price' => 2500],
            ['name' => 'Astor', 'price' => 1000], ['name' => 'Pillow Ungu', 'price' => 1000],
            ['name' => 'Brownies Keju', 'price' => 2000], ['name' => 'Brownies Coklat', 'price' => 2000],
            ['name' => 'Mie Kremes Pedas', 'price' => 1000], ['name' => 'HOTPOP', 'price' => 1000],
            ['name' => 'Better', 'price' => 2500], ['name' => 'Chocopie', 'price' => 2500],
            ['name' => 'Oreo Brownies', 'price' => 2000], ['name' => 'Roma Kelapa', 'price' => 2000],
            ['name' => 'Slayolay', 'price' => 2000], ['name' => 'Gopopato', 'price' => 500],
            ['name' => 'Sagu Keju', 'price' => 500], ['name' => 'Goriorio', 'price' => 500],
            ['name' => 'Choki-Choki', 'price' => 1000], ['name' => 'Nabati', 'price' => 2000],
            ['name' => 'Sponge Stroberi', 'price' => 1000], ['name' => 'Sponge Coklat', 'price' => 1000],
            ['name' => 'Basreng', 'price' => 3000], ['name' => 'Makaroni', 'price' => 3500],
            ['name' => 'Kripset (Keripik Pedas)', 'price' => 3500],
        ];
        foreach ($snackProducts as $p) {
            Product::create([
                'category_id' => $snack->id,
                'name' => $p['name'],
                'price' => $p['price'],
                'is_available' => true
            ]);
        }
    }
}