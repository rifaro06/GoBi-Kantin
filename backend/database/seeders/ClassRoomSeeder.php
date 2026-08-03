<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ClassRoomSeeder extends Seeder
{
    public function run(): void
    {
        // Matikan proteksi Foreign Key biar bisa truncate tanpa error
        Schema::disableForeignKeyConstraints();
        DB::table('class_rooms')->truncate();
        Schema::enableForeignKeyConstraints();

        $classes = [
            // JENJANG SMP
            ['name' => 'Kelas VII - A', 'level' => 'SMP'],
            ['name' => 'Kelas VII - B', 'level' => 'SMP'],
            ['name' => 'Kelas VII - C', 'level' => 'SMP'],
            ['name' => 'Kelas VIII - A', 'level' => 'SMP'],
            ['name' => 'Kelas VIII - B', 'level' => 'SMP'],
            ['name' => 'Kelas VIII - C', 'level' => 'SMP'],
            ['name' => 'Kelas IX - A', 'level' => 'SMP'],
            ['name' => 'Kelas IX - B', 'level' => 'SMP'],
            ['name' => 'Kelas IX - C', 'level' => 'SMP'],

            // JENJANG SMA / SMK
            ['name' => 'Kelas X - A', 'level' => 'SMA'],
            ['name' => 'Kelas X - B', 'level' => 'SMA'],
            ['name' => 'Kelas X - C', 'level' => 'SMA'],
            ['name' => 'Kelas XI - A', 'level' => 'SMA'],
            ['name' => 'Kelas XI - B', 'level' => 'SMA'],
            ['name' => 'Kelas XI - C', 'level' => 'SMA'],
            ['name' => 'Kelas XII - A', 'level' => 'SMA'],
            ['name' => 'Kelas XII - B', 'level' => 'SMA'],
            ['name' => 'Kelas XII - C', 'level' => 'SMA'],
        ];

        $now = now();
        $data = array_map(function ($item) use ($now) {
            return [
                'name'       => $item['name'],
                'level'      => $item['level'],
                'is_active'  => true,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }, $classes);

        DB::table('class_rooms')->insert($data);
    }
}