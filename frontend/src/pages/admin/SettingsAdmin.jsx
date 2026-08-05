import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function SettingsAdmin() {
    const [settings, setSettings] = useState({
        kantin_open: "1",
        guru_password: "guru123",

        max_food_qty: '10',
        food_tier1_fee: '1000',
        food_tier2_fee: '1500',
        food_tier3_fee: '2000',
        drink_base_fee: '500',
        drink_threshold: '10000',
        drink_fee: '1000',
        snack_base_fee: '500',
        snack_threshold: '10000',
        snack_fee: '1000',
        global_item_max: '5',
        global_min_fee: '1500'
    });
    
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

    // TARIK DATA PENGATURAN
    useEffect(() => {
        axios.get('http://127.0.0.1:8000/api/settings')
            .then(res => {
                const data = res.data.data || res.data;
                if (data && typeof data === 'object' && Object.keys(data).length > 0) {
                    setSettings(prev => ({ ...prev, ...data }));
                }
            })
            .catch(err => {
                console.error('Gagal mengambil pengaturan:', err);
                setStatusMessage({
                    type: 'error',
                    text: 'Gagal mengambil data dari server. Pastikan server Laravel berjalan.'
                });
            })
            .finally(() => setFetching(false));
    }, []);

    const handleChange = (e) => {
        setSettings({ ...settings, [e.target.name]: e.target.value });
        // Sembunyikan notifikasi saat user mulai mengetik lagi
        if (statusMessage.text) setStatusMessage({ type: '', text: '' });
    };

    // SIMPAN PENGATURAN
    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatusMessage({ type: '', text: '' });

        try {
            // Disesuaikan ke endpoint /api/settings agar cocok dengan route Laravel
            const response = await axios.post('http://127.0.0.1:8000/api/settings', settings);
            
            setStatusMessage({
                type: 'success',
                text: response.data.message || 'Pengaturan berhasil disimpan!'
            });
        } catch (error) {
            console.error('Gagal menyimpan pengaturan:', error);
            const errorMsg = error.response?.data?.message || 'Gagal menyimpan pengaturan. Periksa koneksi API.';
            setStatusMessage({
                type: 'error',
                text: errorMsg
            });
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="p-8 flex items-center justify-center gap-2 text-slate-500 font-bold">
                <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
                <span>Memuat data pengaturan...</span>
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-6 font-sans max-w-4xl">
            <h2 className="text-2xl font-extrabold text-slate-800 mb-6">Pengaturan Ongkos Kirim Kantin</h2>
            
            {/* NOTIFIKASI SUKSES / ERROR */}
            {statusMessage.text && (
                <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold shadow-sm transition-all ${
                    statusMessage.type === 'success' 
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                        : 'bg-rose-50 border border-rose-200 text-rose-700'
                }`}>
                    {statusMessage.type === 'success' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    )}
                    <span>{statusMessage.text}</span>
                </div>
            )}

            <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-6">

                <div>
    <h3 className="font-bold text-slate-700 border-b border-slate-100 pb-2 mb-4">
        Status Kantin
    </h3>

    <div className="space-y-4">

        <label className="flex items-center justify-between bg-slate-50 p-4 rounded-xl">

            <div>
                <p className="font-bold">
                    Kantin Dibuka
                </p>

                <p className="text-sm text-slate-500">
                    Jika dimatikan maka hanya guru yang bisa masuk menggunakan password.
                </p>

            </div>

            <input
                type="checkbox"
                checked={settings.kantin_open === "1"}
                onChange={(e)=>
                    setSettings({
                        ...settings,
                        kantin_open: e.target.checked ? "1":"0"
                    })
                }
            />

        </label>


        <div>

            <label className="text-sm font-bold">
                Password Guru
            </label>

            <input
                type="text"
                value={settings.guru_password}
                onChange={(e)=>
                    setSettings({
                        ...settings,
                        guru_password:e.target.value
                    })
                }
                className="w-full px-4 py-2 border rounded-xl mt-2"
            />

        </div>

    </div>

</div>
                {/* Makanan */}
                <div>
                    <h3 className="font-bold text-slate-700 border-b border-slate-100 pb-2 mb-4 text-sm uppercase tracking-wider">Aturan Makanan</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 block mb-1">Maks. Porsi</label>
                            <input type="number" name="max_food_qty" value={settings.max_food_qty} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 block mb-1">Fee 1-2 Porsi (Rp)</label>
                            <input type="number" name="food_tier1_fee" value={settings.food_tier1_fee} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 block mb-1">Fee 3-5 Porsi (Rp)</label>
                            <input type="number" name="food_tier2_fee" value={settings.food_tier2_fee} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 block mb-1">Fee 6-10 Porsi (Rp)</label>
                            <input type="number" name="food_tier3_fee" value={settings.food_tier3_fee} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                    </div>
                </div>

                {/* Minuman */}
                <div>
                    <h3 className="font-bold text-slate-700 border-b border-slate-100 pb-2 mb-4 text-sm uppercase tracking-wider">Aturan Minuman</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 block mb-1">Fee Dasar (Rp)</label>
                            <input type="number" name="drink_base_fee" value={settings.drink_base_fee} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 block mb-1">Batas Harga Naik (Rp)</label>
                            <input type="number" name="drink_threshold" value={settings.drink_threshold} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 block mb-1">Fee Saat Tembus (Rp)</label>
                            <input type="number" name="drink_fee" value={settings.drink_fee} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                    </div>
                </div>

                {/* Snack */}
                <div>
                    <h3 className="font-bold text-slate-700 border-b border-slate-100 pb-2 mb-4 text-sm uppercase tracking-wider">Aturan Snack</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 block mb-1">Fee Dasar (Rp)</label>
                            <input type="number" name="snack_base_fee" value={settings.snack_base_fee} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 block mb-1">Batas Harga Naik (Rp)</label>
                            <input type="number" name="snack_threshold" value={settings.snack_threshold} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 block mb-1">Fee Saat Tembus (Rp)</label>
                            <input type="number" name="snack_fee" value={settings.snack_fee} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                    </div>
                </div>

                {/* Global */}
                <div>
                    <h3 className="font-bold text-slate-700 border-b border-slate-100 pb-2 mb-4 text-sm uppercase tracking-wider">Aturan Global (Min. 1 Makanan)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 block mb-1">Batas Total Item (Semua Kategori)</label>
                            <input type="number" name="global_item_max" value={settings.global_item_max} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 block mb-1">Fee Minimum Jika Lewat Batas (Rp)</label>
                            <input type="number" name="global_min_fee" value={settings.global_min_fee} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-100 text-right">
                    <button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 ml-auto transition-colors text-sm disabled:opacity-50 shadow-md shadow-emerald-600/20">
                        <Save className="w-5 h-5" /> {loading ? 'Menyimpan...' : 'Simpan Pengaturan'}
                    </button>
                </div>
            </form>
        </div>
    );
}