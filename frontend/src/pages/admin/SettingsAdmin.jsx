import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Save, CheckCircle2, AlertCircle, RefreshCw,
    Shield, School, Truck, Plus, Trash2, Tag,
    Info, Settings2, Utensils, Coffee, ToggleLeft, ToggleRight, QrCode, Upload,
    GripVertical
} from 'lucide-react';

export default function SettingsAdmin() {
    const [activeTab, setActiveTab] = useState('general'); // 'general' | 'classes' | 'shipping'

    // State Pengaturan General & Global
    const [settings, setSettings] = useState({
        kantin_open: "1",
        guru_password: "guru123",
        qris_image_url: "",
        global_item_max: '5',
        global_min_fee: '1500',
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
    });

    // State QRIS Image File & Preview
    const [qrisFile, setQrisFile] = useState(null);
    const [qrisPreview, setQrisPreview] = useState('');

    // State Kelola Kelas
    const [classes, setClasses] = useState([]);
    const [newClassName, setNewClassName] = useState('');
    const [loadingClass, setLoadingClass] = useState(false);

    // State Kelola Kategori Dynamic
    const [categories, setCategories] = useState([]);
    const [newCatName, setNewCatName] = useState('');
    const [newCatFee, setNewCatFee] = useState(0);
    const [newCatType, setNewCatType] = useState('flat');
    const [loadingCategory, setLoadingCategory] = useState(false);
    const [editingCategories, setEditingCategories] = useState({});

    // State Drag and Drop Index
    const [draggedIndex, setDraggedIndex] = useState(null);

    // State Status & Loading
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            // 1. Fetch Settings
            const resSettings = await axios.get('/settings');
            const rawSettings = resSettings.data.data || resSettings.data;
            let normalizedData = {};

            if (Array.isArray(rawSettings)) {
                rawSettings.forEach(item => {
                    if (item.key) normalizedData[item.key] = item.value;
                });
            } else if (rawSettings && typeof rawSettings === 'object') {
                normalizedData = { ...rawSettings };
            }

            if (normalizedData.kantin_open !== undefined) {
                const isOpen = normalizedData.kantin_open == 1 || normalizedData.kantin_open === "1" || normalizedData.kantin_open === true;
                normalizedData.kantin_open = isOpen ? "1" : "0";
            }

            setSettings(prev => ({ ...prev, ...normalizedData }));

            if (normalizedData.qris_image_url) {
                setQrisPreview(normalizedData.qris_image_url);
            }

            // 2. Fetch Classes
            const resClasses = await axios.get('/classes');
            setClasses(resClasses.data.data || resClasses.data || []);

            // 3. Fetch Categories
            fetchCategories();

        } catch (err) {
            console.error('Gagal mengambil data:', err);
            setStatusMessage({
                type: 'error',
                text: 'Gagal mengambil data dari server. Pastikan server aktif.'
            });
        } finally {
            setFetching(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const resCat = await axios.get('/categories');
            let catData = resCat.data.data || resCat.data || [];
            
            // Urutkan kategori berdasarkan sort_order terkecil ke terbesar
            catData.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
            setCategories(catData);

            const initialEditState = {};
            catData.forEach(c => {
                initialEditState[c.id] = {
                    name: c.name,
                    shipping_fee: c.shipping_fee ?? 0,
                    fee_type: c.fee_type || 'flat',
                    sort_order: c.sort_order || 0
                };
            });
            setEditingCategories(initialEditState);
        } catch (err) {
            console.error('Gagal mengambil kategori:', err);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
        if (statusMessage.text) setStatusMessage({ type: '', text: '' });
    };

    const handleQrisFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setQrisFile(file);
            setQrisPreview(URL.createObjectURL(file));
        }
    };

    const handleSaveSettings = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        setStatusMessage({ type: '', text: '' });

        try {
            const formData = new FormData();
            Object.keys(settings).forEach(key => {
                formData.append(key, settings[key]);
            });

            if (qrisFile) {
                formData.append('qris_image', qrisFile);
            }

            const response = await axios.post('/settings', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (settings.kantin_open === "0") {
                sessionStorage.removeItem("teacher_access");
            }

            if (response.data?.qris_image_url) {
                setSettings(prev => ({ ...prev, qris_image_url: response.data.qris_image_url }));
                setQrisPreview(response.data.qris_image_url);
            }

            setStatusMessage({
                type: 'success',
                text: response.data?.message || 'Pengaturan berhasil disimpan!'
            });
        } catch (error) {
            console.error('Gagal menyimpan pengaturan:', error);
            setStatusMessage({
                type: 'error',
                text: error.response?.data?.message || 'Gagal menyimpan pengaturan.'
            });
        } finally {
            setLoading(false);
        }
    };

    // --- KELOLA KELAS ---
    const handleAddClass = async (e) => {
        e.preventDefault();
        if (!newClassName.trim()) return;
        setLoadingClass(true);

        try {
            const res = await axios.post('/classes', { name: newClassName.trim() });
            const addedClass = res.data.data || res.data;
            setClasses(prev => [...prev, addedClass]);
            setNewClassName('');
            setStatusMessage({ type: 'success', text: 'Kelas baru berhasil ditambahkan!' });
        } catch (err) {
            console.error('Gagal menambah kelas:', err);
            setStatusMessage({ type: 'error', text: 'Gagal menambah kelas baru.' });
        } finally {
            setLoadingClass(false);
        }
    };

    const handleDeleteClass = async (id) => {
        if (!window.confirm('Yakin ingin menghapus kelas ini?')) return;
        try {
            await axios.delete(`/classes/${id}`);
            setClasses(prev => prev.filter(c => c.id !== id));
            setStatusMessage({ type: 'success', text: 'Kelas berhasil dihapus!' });
        } catch (err) {
            console.error('Gagal menghapus kelas:', err);
            setStatusMessage({ type: 'error', text: 'Gagal menghapus kelas.' });
        }
    };

    // --- KELOLA KATEGORI ---
    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCatName.trim()) return;
        setLoadingCategory(true);

        try {
            await axios.post('/categories', {
                name: newCatName.trim(),
                shipping_fee: Number(newCatFee) || 0,
                fee_type: newCatType
            });
            setNewCatName('');
            setNewCatFee(0);
            setNewCatType('flat');
            await fetchCategories();
            setStatusMessage({ type: 'success', text: `Kategori "${newCatName}" berhasil dibuat!` });
        } catch (err) {
            console.error('Gagal menambah kategori:', err);
            setStatusMessage({ type: 'error', text: err.response?.data?.message || 'Gagal menambah kategori.' });
        } finally {
            setLoadingCategory(false);
        }
    };

    const handleUpdateCategory = async (id) => {
        const item = editingCategories[id];
        if (!item) return;

        try {
            await axios.put(`/categories/${id}`, {
                name: item.name,
                shipping_fee: Number(item.shipping_fee) || 0,
                fee_type: item.fee_type,
                sort_order: Number(item.sort_order) || 0
            });
            setStatusMessage({ type: 'success', text: `Pengaturan untuk "${item.name}" berhasil disimpan!` });
            fetchCategories();
        } catch (err) {
            console.error('Gagal mengupdate kategori:', err);
            setStatusMessage({ type: 'error', text: 'Gagal menyimpan perubahan kategori.' });
        }
    };

    const handleDeleteCategory = async (id) => {
        if (!window.confirm('Yakin ingin menghapus kategori ini?')) return;
        try {
            await axios.delete(`/categories/${id}`);
            await fetchCategories();
            setStatusMessage({ type: 'success', text: 'Kategori berhasil dihapus!' });
        } catch (err) {
            console.error('Gagal menghapus kategori:', err);
            setStatusMessage({ type: 'error', text: 'Gagal menghapus kategori.' });
        }
    };

    // --- HANDLER DRAG AND DROP ---
    const handleDragStart = (index) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (dropIndex) => {
        if (draggedIndex === null || draggedIndex === dropIndex) return;

        const updatedCategories = [...categories];
        const [movedItem] = updatedCategories.splice(draggedIndex, 1);
        updatedCategories.splice(dropIndex, 0, movedItem);

        // Update nilai sort_order berurutan (1, 2, 3, dst) untuk semua item
        const updatedEditing = { ...editingCategories };
        updatedCategories.forEach((cat, index) => {
            const newOrder = index + 1;
            updatedEditing[cat.id] = {
                ...updatedEditing[cat.id],
                sort_order: newOrder
            };
        });

        setCategories(updatedCategories);
        setEditingCategories(updatedEditing);
        setDraggedIndex(null);
    };

    if (fetching) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center gap-3 text-slate-500 font-bold">
                <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
                <span className="text-sm">Memuat konfigurasi...</span>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 font-sans max-w-5xl mx-auto space-y-6">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Pengaturan Kantin</h2>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium">
                        Atur jam operasional, barcode QRIS, kelas pengantaran, dan perhitungan tarif ongkir.
                    </p>
                </div>
            </div>

            {statusMessage.text && (
                <div className={`p-4 rounded-2xl flex items-start gap-3 text-xs sm:text-sm font-bold shadow-xs transition-all ${statusMessage.type === 'success'
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                        : 'bg-rose-50 border border-rose-200 text-rose-800'
                    }`}>
                    {statusMessage.type === 'success' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <span className="leading-snug">{statusMessage.text}</span>
                </div>
            )}

            {/* TAB BAR */}
            <div className="bg-slate-200/60 p-1.5 rounded-2xl flex flex-wrap sm:flex-nowrap gap-1">
                <button
                    type="button"
                    onClick={() => setActiveTab('general')}
                    className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${activeTab === 'general' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                        }`}
                >
                    <Shield className="w-4 h-4 text-emerald-600" />
                    <span>Akses System</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('classes')}
                    className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${activeTab === 'classes' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                        }`}
                >
                    <School className="w-4 h-4 text-emerald-600" />
                    <span>Daftar Kelas ({classes.length})</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('shipping')}
                    className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${activeTab === 'shipping' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                        }`}
                >
                    <Truck className="w-4 h-4 text-emerald-600" />
                    <span>Aturan Ongkir Kategori</span>
                </button>
            </div>

            {/* TAB 1: GENERAL */}
            {activeTab === 'general' && (
                <form onSubmit={handleSaveSettings} className="space-y-6">
                    <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200 space-y-5">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                            <Shield className="w-5 h-5 text-emerald-600" />
                            <h3 className="font-extrabold text-slate-800 text-sm uppercase">Status Operasional</h3>
                        </div>

                        <div
                            onClick={() => setSettings(prev => ({ ...prev, kantin_open: prev.kantin_open === "1" ? "0" : "1" }))}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${settings.kantin_open === "1" ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'
                                }`}
                        >
                            <div className="space-y-1">
                                <p className="font-extrabold text-slate-900 text-sm">
                                    Kantin Sedang {settings.kantin_open === "1" ? "BUKA" : "TUTUP"}
                                </p>
                                <p className="text-xs text-slate-500">
                                    Klik untuk mengganti status operasional toko kantin secara instan.
                                </p>
                            </div>
                            {settings.kantin_open === "1" ? (
                                <ToggleRight className="w-10 h-10 text-emerald-600" />
                            ) : (
                                <ToggleLeft className="w-10 h-10 text-slate-400" />
                            )}
                        </div>

                        <div className="pt-2">
                            <label className="text-xs font-bold text-slate-700 block mb-1">
                                PIN Bypass Guru
                            </label>
                            <input
                                type="text"
                                name="guru_password"
                                value={settings.guru_password || ''}
                                onChange={handleChange}
                                className="w-full sm:w-72 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
                            />
                        </div>

                        {/* SECTION UPLOAD FOTO QRIS DINAMIS */}
                        <div className="pt-5 border-t border-slate-100 space-y-3">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <QrCode className="w-4 h-4 text-emerald-600" /> Gambar / Barcode QRIS Pembayaran
                            </label>
                            <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                                <div className="w-32 h-32 bg-white border border-slate-200 rounded-xl p-2 shrink-0 flex items-center justify-center overflow-hidden shadow-xs">
                                    {qrisPreview ? (
                                        <img src={qrisPreview} alt="Preview QRIS" className="w-full h-full object-contain" />
                                    ) : (
                                        <span className="text-[11px] text-slate-400 font-medium text-center">Belum ada foto QRIS</span>
                                    )}
                                </div>
                                <div className="space-y-2 text-center sm:text-left flex-1">
                                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                        Unggah foto barcode QRIS Kantin terbaru. Foto ini yang akan tampil saat siswa memilih pembayaran QRIS.
                                    </p>
                                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-xs rounded-xl cursor-pointer transition-all active:scale-95">
                                        <Upload className="w-4 h-4" /> Pilih File Gambar
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleQrisFileChange}
                                            className="hidden"
                                        />
                                    </label>
                                    {qrisFile && (
                                        <p className="text-[11px] font-bold text-emerald-600 mt-1">
                                            Dipilih: {qrisFile.name}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>

                    <div className="text-right">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-3 rounded-2xl shadow-md active:scale-95 text-sm"
                        >
                            <Save className="w-4 h-4 inline mr-2" /> Simpan Pengaturan Akses
                        </button>
                    </div>
                </form>
            )}

            {/* TAB 2: KELAS */}
            {activeTab === 'classes' && (
                <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200 space-y-6">
                    <form onSubmit={handleAddClass} className="flex gap-3">
                        <input
                            type="text"
                            placeholder="Nama kelas baru (misal: X IPA 1)"
                            value={newClassName}
                            onChange={(e) => setNewClassName(e.target.value)}
                            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
                        />
                        <button type="submit" disabled={loadingClass} className="bg-emerald-600 text-white font-extrabold px-6 py-2.5 rounded-xl text-sm">
                            <Plus className="w-4 h-4 inline mr-1" /> Tambah
                        </button>
                    </form>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {classes.map((cls) => (
                            <div key={cls.id} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                                <span className="font-extrabold text-slate-800 text-xs sm:text-sm">{cls.name}</span>
                                <button type="button" onClick={() => handleDeleteClass(cls.id)} className="text-slate-400 hover:text-rose-600">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB 3: ATURAN ONGKIR DYNAMIC */}
            {activeTab === 'shipping' && (
                <div className="space-y-6">
                    <div className="bg-emerald-900 text-white p-5 rounded-3xl space-y-2">
                        <div className="flex items-center gap-2 text-emerald-300 font-extrabold text-xs uppercase">
                            <Info className="w-4 h-4" /> Pilih Skema Ongkir Per Kategori
                        </div>
                        <p className="text-xs sm:text-sm text-emerald-100 font-medium leading-relaxed">
                            Setiap kali kamu membuat kategori baru, kamu bebas menentukan **Tipe Ongkirnya**: mau Flat, Ikut Tier Porsi Makanan, atau Ikut Threshold Nominal Belanja.
                        </p>
                    </div>

                    <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200 space-y-6">
                        <div className="border-b border-slate-100 pb-3">
                            <h3 className="font-extrabold text-slate-800 text-sm uppercase flex items-center gap-2">
                                <Tag className="w-5 h-5 text-emerald-600" /> Tambah Kategori & Tentukan Aturan Ongkir
                            </h3>
                        </div>

                        <form onSubmit={handleAddCategory} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                            <div>
                                <label className="text-[11px] font-bold text-slate-500 block mb-1">Nama Kategori</label>
                                <input
                                    type="text"
                                    placeholder="Contoh: ATK"
                                    value={newCatName}
                                    onChange={(e) => setNewCatName(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-bold text-slate-500 block mb-1">Skema Hitung Ongkir</label>
                                <select
                                    value={newCatType}
                                    onChange={(e) => setNewCatType(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                                >
                                    <option value="flat">Ongkir Flat / Tetap</option>
                                    <option value="tier_qty">Ikut Tier Porsi (Makanan)</option>
                                    <option value="threshold_nominal">Ikut Nominal Belanja (Minuman/Snack)</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-[11px] font-bold text-slate-500 block mb-1">Ongkir Dasar (Rp)</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={newCatFee}
                                    onChange={(e) => setNewCatFee(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                                    min="0"
                                />
                            </div>

                            <div className="flex items-end">
                                <button
                                    type="submit"
                                    disabled={loadingCategory || !newCatName.trim()}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5"
                                >
                                    <Plus className="w-4 h-4" /> Simpan Kategori
                                </button>
                            </div>
                        </form>

                        <div className="space-y-3 pt-2">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Daftar Kategori & Konfigurasi Aktif ({categories.length}) — <span className="text-emerald-600 capitalize font-medium">Geser ikon titik-titik untuk drag & drop</span>
                            </p>

                            {categories.map((cat, index) => {
                                const currentEdit = editingCategories[cat.id] || { name: cat.name, shipping_fee: cat.shipping_fee, fee_type: cat.fee_type || 'flat', sort_order: cat.sort_order || 0 };

                                return (
                                    <div
                                        key={cat.id}
                                        draggable
                                        onDragStart={() => handleDragStart(index)}
                                        onDragOver={handleDragOver}
                                        onDrop={() => handleDrop(index)}
                                        className={`p-4 bg-slate-50 border rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 transition-all ${
                                            draggedIndex === index ? 'opacity-40 border-dashed border-emerald-500 bg-emerald-50' : 'border-slate-200/80 hover:border-slate-300'
                                        }`}
                                    >
                                        {/* DRAG HANDLE & NAMA KATEGORI */}
                                        <div className="flex-1 w-full md:w-1/3 flex items-center gap-2">
                                            <div 
                                                className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-slate-200/70 text-slate-400 hover:text-slate-600 rounded-lg shrink-0 transition-colors"
                                                title="Geser posisi urutan"
                                            >
                                                <GripVertical className="w-5 h-5" />
                                            </div>

                                            <div className="flex-1">
                                                <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Nama Kategori</label>
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                                                        <Tag className="w-4 h-4" />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={currentEdit.name}
                                                        onChange={(e) => setEditingCategories({
                                                            ...editingCategories,
                                                            [cat.id]: { ...currentEdit, name: e.target.value }
                                                        })}
                                                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* BAGIAN TIPE ONGKIR & URUTAN */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-2/3 items-center">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Tipe Ongkir</label>
                                                <select
                                                    value={currentEdit.fee_type}
                                                    onChange={(e) => setEditingCategories({
                                                        ...editingCategories,
                                                        [cat.id]: { ...currentEdit, fee_type: e.target.value }
                                                    })}
                                                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                                                >
                                                    <option value="flat">Ongkir Flat / Tetap</option>
                                                    <option value="tier_qty">Ikut Tier Porsi (Makanan)</option>
                                                    <option value="threshold_nominal">Ikut Nominal Belanja</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Ongkir (Rp)</label>
                                                <input
                                                    type="number"
                                                    value={currentEdit.shipping_fee}
                                                    onChange={(e) => setEditingCategories({
                                                        ...editingCategories,
                                                        [cat.id]: { ...currentEdit, shipping_fee: e.target.value }
                                                    })}
                                                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                                                    min="0"
                                                />
                                            </div>

                                            <div className="flex items-end gap-2">
                                                {/* INPUT URUTAN MANUAL (MASIH DAPAT DIISI/DIUBAH SAMA SEPERTI SEBELUMNYA) */}
                                                <div className="w-16 shrink-0">
                                                    <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Urutan</label>
                                                    <input
                                                        type="number"
                                                        value={currentEdit.sort_order}
                                                        onChange={(e) => setEditingCategories({
                                                            ...editingCategories,
                                                            [cat.id]: { ...currentEdit, sort_order: e.target.value }
                                                        })}
                                                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 text-center"
                                                    />
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => handleUpdateCategory(cat.id)}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-xl transition-all cursor-pointer shrink-0 h-[34px] flex items-center justify-center"
                                                    title="Simpan Perubahan Kategori Ini"
                                                >
                                                    <Save className="w-4 h-4" />
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteCategory(cat.id)}
                                                    className="p-2 text-rose-500 hover:bg-rose-100 rounded-xl transition-all cursor-pointer shrink-0 h-[34px] flex items-center justify-center"
                                                    title="Hapus Kategori"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200 space-y-6">
                        <div className="border-b border-slate-100 pb-3">
                            <h3 className="font-extrabold text-slate-900 text-sm uppercase flex items-center gap-2">
                                <Settings2 className="w-5 h-5 text-emerald-600" /> Parameter Nilai Tier Khusus
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Kategori apa pun yang memilih tipe **"Ikut Tier Porsi"** atau **"Ikut Nominal Belanja"** akan mengikuti rumus di bawah ini:
                            </p>
                        </div>

                        <div className="p-5 bg-amber-50/50 rounded-3xl border border-amber-200/70 space-y-4">
                            <div className="flex items-center gap-2 border-b border-amber-200/60 pb-2">
                                <Utensils className="w-4 h-4 text-amber-700" />
                                <h4 className="font-black text-amber-900 text-xs uppercase">Parameter Untuk Kategori Tipe "Tier Porsi"</h4>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold text-amber-900/70 block mb-1">Maks Porsi/Qty</label>
                                    <input type="number" name="max_food_qty" value={settings.max_food_qty || ''} onChange={handleChange} className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-xl text-xs font-bold" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-amber-900/70 block mb-1">Fee 1–2 Item (Rp)</label>
                                    <input type="number" name="food_tier1_fee" value={settings.food_tier1_fee || ''} onChange={handleChange} className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-xl text-xs font-bold" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-amber-900/70 block mb-1">Fee 3–5 Item (Rp)</label>
                                    <input type="number" name="food_tier2_fee" value={settings.food_tier2_fee || ''} onChange={handleChange} className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-xl text-xs font-bold" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-amber-900/70 block mb-1">Fee 6–10 Item (Rp)</label>
                                    <input type="number" name="food_tier3_fee" value={settings.food_tier3_fee || ''} onChange={handleChange} className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-xl text-xs font-bold" />
                                </div>
                            </div>
                        </div>

                        <div className="p-5 bg-sky-50/50 rounded-3xl border border-sky-200/70 space-y-4">
                            <div className="flex items-center gap-2 border-b border-sky-200/60 pb-2">
                                <Coffee className="w-4 h-4 text-sky-700" />
                                <h4 className="font-black text-sky-900 text-xs uppercase">Parameter Untuk Kategori Tipe "Nominal Belanja"</h4>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold text-sky-900/70 block mb-1">Fee Dasar (Rp)</label>
                                    <input type="number" name="drink_base_fee" value={settings.drink_base_fee || ''} onChange={handleChange} className="w-full px-3 py-1.5 bg-white border border-sky-300 rounded-xl text-xs font-bold" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-sky-900/70 block mb-1">Batas Belanja (Rp)</label>
                                    <input type="number" name="drink_threshold" value={settings.drink_threshold || ''} onChange={handleChange} className="w-full px-3 py-1.5 bg-white border border-sky-300 rounded-xl text-xs font-bold" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-sky-900/70 block mb-1">Fee Jika Lewat Batas (Rp)</label>
                                    <input type="number" name="drink_fee" value={settings.drink_fee || ''} onChange={handleChange} className="w-full px-3 py-1.5 bg-white border border-sky-300 rounded-xl text-xs font-bold" />
                                </div>
                            </div>
                        </div>

                        <div className="text-right">
                            <button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-3 rounded-2xl text-xs">
                                <Save className="w-4 h-4 inline mr-1" /> Simpan Semua Parameter
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}