import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
    ArrowLeft, Trash2, Plus, Minus, QrCode, Banknote,
    ShoppingBag, User, Phone, GraduationCap, ChevronRight, Calculator, Info, Sparkles,
    SquarePen, Check
} from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function Checkout() {
    const navigate = useNavigate();
    const location = useLocation();

    const {
        cartItems = [],
        handleIncreaseQty,
        handleDecreaseQty,
        handleRemoveItem,
        totalAmount,
        clearCart,
        addToCart,
        updateItemNote
    } = useCart();

    const [classRooms, setClassRooms] = useState(location.state?.classRooms || []);
    const [categoriesList, setCategoriesList] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    // State khusus pesan error per-item produk
    const [itemErrors, setItemErrors] = useState({});

    // State untuk kontrol Edit Catatan Per Item
    const [editingNoteId, setEditingNoteId] = useState(null);
    const [localNotes, setLocalNotes] = useState({});

    // State Pengaturan Ongkir & Rekomendasi Menu
    const [settings, setSettings] = useState(null);
    const [deliveryFee, setDeliveryFee] = useState(0);
    const [showInfo, setShowInfo] = useState(false);
    const [recommendations, setRecommendations] = useState([]);

    // Form Data
    const [formData, setFormData] = useState(() => {
        const savedData = localStorage.getItem('gobi_checkout_form');
        return savedData ? JSON.parse(savedData) : {
            name: '',
            phone: '',
            class_room_id: '',
            notes: ''
        };
    });

    const [paymentMethod, setPaymentMethod] = useState('QRIS');
    const [cashPaid, setCashPaid] = useState('');

    // HELPER: Mencegah Mixed Content & Error gambar
    const getImageUrl = (url) => {
        if (!url) return 'https://placehold.co/400x300?text=No+Image';
        if (typeof url !== 'string') return url;
        return url.replace(/^http:\/\/(127\.0\.0\.1|localhost):8000/, '');
    };

    useEffect(() => {
        localStorage.setItem('gobi_checkout_form', JSON.stringify(formData));
    }, [formData]);

    // AMBIL DAFTAR KELAS & KATEGORI DARI API
    useEffect(() => {
        axios.get('/classes')
            .then(res => setClassRooms(res.data.data || res.data || []))
            .catch(() => {
                axios.get('/catalog')
                    .then(res => setClassRooms(res.data.classRooms || []))
                    .catch(err => console.error('Gagal mengambil daftar kelas:', err));
            });

        axios.get('/categories')
            .then(res => setCategoriesList(res.data.data || res.data || []))
            .catch(err => console.error('Gagal mengambil daftar kategori:', err));
    }, []);

    // POLLING OTOMATIS: Cek Status Kantin
    useEffect(() => {
        const checkStatus = async () => {
            const isTeacher = sessionStorage.getItem("teacher_access") === "1";

            try {
                const res = await axios.get('/settings');
                const rawData = res.data.data || res.data || {};

                let currentSettings = {};
                if (Array.isArray(rawData)) {
                    rawData.forEach(item => { currentSettings[item.key] = item.value; });
                } else if (typeof rawData === 'object') {
                    currentSettings = { ...rawData };
                }

                const isOpen = currentSettings.kantin_open == 1 || currentSettings.kantin_open === "1" || currentSettings.kantin_open === true;

                if (!isOpen && !isTeacher) {
                    navigate('/closed', { replace: true });
                }
            } catch (err) {
                console.error("Gagal mengecek status kantin di Checkout:", err);
            }
        };

        checkStatus();
        const interval = setInterval(checkStatus, 3000);
        return () => clearInterval(interval);
    }, [navigate]);

    // AMBIL DATA REKOMENDASI "MENU LAIN YANG SERING DIPESAN"
    useEffect(() => {
        axios.get('/catalog')
            .then(res => {
                const categories = res.data.categories || res.data || [];
                const allProducts = [];

                categories.forEach(cat => {
                    if (Array.isArray(cat.products)) {
                        cat.products.forEach(p => {
                            const inCart = cartItems.some(item => item.id === p.id);
                            if (!inCart && p.is_available !== false) {
                                allProducts.push({ ...p, category_name: cat.name });
                            }
                        });
                    }
                });

                setRecommendations(allProducts.slice(0, 8));
            })
            .catch(err => console.error("Gagal mengambil menu rekomendasi:", err));
    }, [cartItems]);

    // TARIK DATA SETTINGS DARI API
    useEffect(() => {
        axios.get('/settings')
            .then(res => {
                const data = res.data.data || res.data;
                if (Array.isArray(data)) {
                    let formattedObj = {};
                    data.forEach(item => {
                        formattedObj[item.key_name || item.key] = item.value;
                    });
                    setSettings(formattedObj);
                } else {
                    setSettings(data);
                }
            })
            .catch(err => console.error('Gagal mengambil pengaturan ongkir:', err));
    }, []);

    // KALKULASI ONGKIR DINAMIS (Integrasi fee_type dari DB + Fallback Legacy)
    useEffect(() => {
        if (cartItems.length === 0) {
            setDeliveryFee(0);
            return;
        }

        const safeNumber = (val, defaultVal) => {
            const num = Number(val);
            return isNaN(num) ? defaultVal : num;
        };

        const foodTier1 = safeNumber(settings?.food_tier1_fee, 1000);
        const foodTier2 = safeNumber(settings?.food_tier2_fee, 1500);
        const foodTier3 = safeNumber(settings?.food_tier3_fee, 2000);

        const drinkBaseFee = safeNumber(settings?.drink_base_fee, 500);
        const drinkThreshold = safeNumber(settings?.drink_threshold, 10000);
        const drinkFee = safeNumber(settings?.drink_fee, 1000);

        const snackBaseFee = safeNumber(settings?.snack_base_fee, 500);
        const snackThreshold = safeNumber(settings?.snack_threshold, 10000);
        const snackFee = safeNumber(settings?.snack_fee, 1000);

        const globalItemMax = safeNumber(settings?.global_item_max, 5);
        const globalMinFee = safeNumber(settings?.global_min_fee, 1500);

        let foodQty = 0;
        let drinkSub = 0;
        let snackSub = 0;
        let totalItems = 0;

        let dynamicMaxCategoryFee = 0;

        cartItems.forEach(item => {
            const qty = safeNumber(item.qty, 1);
            const priceTotal = safeNumber(item.price, 0) * qty;
            totalItems += qty;

            const catName = String(item.category_name || item.category?.name || '').toLowerCase();
            const catId = item.category_id || item.category?.id;

            // Cari kategori yang cocok di database
            const matchedCategory = categoriesList.find(c => c.id === catId || (c.name && c.name.toLowerCase() === catName));

            // Deteksi fee_type dari database, atau fallback berdasarkan nama kategori jika tidak diset
            const feeType = matchedCategory?.fee_type || (
                catName.includes('makan') ? 'tier_qty' : 
                (catName.includes('minum') || catName.includes('snack') || catName.includes('cemilan')) ? 'threshold_nominal' : 
                'flat'
            );

            if (feeType === 'tier_qty') {
                foodQty += qty;
            } else if (feeType === 'threshold_nominal') {
                if (catName.includes('snack') || catName.includes('cemilan')) {
                    snackSub += priceTotal;
                } else {
                    drinkSub += priceTotal;
                }
            } else if (feeType === 'flat') {
                if (matchedCategory && matchedCategory.shipping_fee) {
                    dynamicMaxCategoryFee = Math.max(dynamicMaxCategoryFee, Number(matchedCategory.shipping_fee));
                }
            }
        });

        let foodFeeCalc = 0;
        if (foodQty >= 1 && foodQty <= 2) foodFeeCalc = foodTier1;
        else if (foodQty >= 3 && foodQty <= 5) foodFeeCalc = foodTier2;
        else if (foodQty >= 6) foodFeeCalc = foodTier3;

        let drinkFeeCalc = 0;
        if (drinkSub > 0) {
            drinkFeeCalc = drinkSub >= drinkThreshold ? drinkFee : drinkBaseFee;
        }

        let snackFeeCalc = 0;
        if (snackSub > 0) {
            snackFeeCalc = snackSub >= snackThreshold ? snackFee : snackBaseFee;
        }

        // Ambil nilai tertinggi dari hasil kalkulasi
        let finalFee = Math.max(foodFeeCalc, drinkFeeCalc, snackFeeCalc, dynamicMaxCategoryFee);

        if (foodQty >= 1 && totalItems > globalItemMax) {
            finalFee = Math.max(finalFee, globalMinFee);
        }

        setDeliveryFee(finalFee);
    }, [cartItems, settings, categoriesList]);

    // HANDLER SIMPAN CATATAN PER ITEM
    const handleSaveNote = (itemId) => {
        const noteText = localNotes[itemId] !== undefined
            ? localNotes[itemId]
            : (cartItems.find(i => (i.cartId || i.id) === itemId)?.note || '');

        if (updateItemNote) {
            updateItemNote(itemId, noteText);
        } else {
            const item = cartItems.find(i => (i.cartId || i.id) === itemId);
            if (item) item.note = noteText;
        }
        setEditingNoteId(null);
    };

    // PROTEKSI PEMESANAN PORSI MAKANAN
    const handleSafeIncreaseQty = (itemId) => {
        const itemToIncrease = cartItems.find(i => (i.cartId || i.id) === itemId);
        const cat = String(itemToIncrease?.category_name || itemToIncrease?.category?.name || '').toLowerCase();

        if (cat.includes('makan')) {
            let currentFoodQty = 0;
            cartItems.forEach(item => {
                const itemCat = String(item.category_name || item.category?.name || '').toLowerCase();
                if (itemCat.includes('makan')) {
                    currentFoodQty += (Number(item.qty) || 1);
                }
            });

            const maxFoodQty = settings?.max_food_qty ? Number(settings.max_food_qty) : 10;

            if (currentFoodQty >= maxFoodQty) {
                setItemErrors(prev => ({
                    ...prev,
                    [itemId]: `Maksimal pemesanan kategori Makanan adalah ${maxFoodQty} porsi dalam satu transaksi.`
                }));
                return;
            }
        }

        setItemErrors(prev => ({ ...prev, [itemId]: null }));
        handleIncreaseQty(itemId);
    };

    const handleSafeDecreaseQty = (itemId) => {
        setItemErrors(prev => ({ ...prev, [itemId]: null }));
        handleDecreaseQty(itemId);
    };

    const handleAddRecommendation = (product) => {
        if (addToCart) {
            addToCart(product, 1, '');
        }
    };

    const subtotalProducts = totalAmount || cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const computedTotal = subtotalProducts + deliveryFee;
    const cashPaidNumber = parseFloat(cashPaid) || 0;
    const changeAmount = cashPaidNumber - computedTotal;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (cartItems.length === 0) return;

        const newErrors = {};

        if (!formData.name.trim()) newErrors.name = 'Mohon isi Nama Pemesan terlebih dahulu!';

        const cleanPhone = formData.phone.trim();
        if (!cleanPhone) {
            newErrors.phone = 'Mohon isi No. WhatsApp / HP terlebih dahulu!';
        } else if (!cleanPhone.startsWith('08')) {
            newErrors.phone = 'Nomor HP / WhatsApp harus diawali dengan angka 08!';
        } else if (cleanPhone.length < 10 || cleanPhone.length > 13) {
            newErrors.phone = 'Nomor HP / WhatsApp harus terdiri dari 10 hingga 13 digit!';
        }

        if (!formData.class_room_id) newErrors.class_room_id = 'Mohon pilih Kelas Tujuan pengantaran!';

        if (paymentMethod === 'CASH') {
            if (!cashPaid || cashPaidNumber < computedTotal) {
                newErrors.cashPaid = 'Jumlah uang pembayaran tunai masih kurang dari total tagihan!';
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        setSubmitting(true);

        try {
            const payload = {
                class_room_id: formData.class_room_id,
                customer_name: formData.name,
                customer_phone: cleanPhone,
                payment_method: paymentMethod,
                cash_amount: paymentMethod === 'CASH' ? cashPaidNumber : 0,
                delivery_fee: deliveryFee,
                items: cartItems.map(item => {
                    const itemId = item.cartId || item.id;
                    const noteText = localNotes[itemId] !== undefined ? localNotes[itemId] : (item.note || formData.notes || '');
                    return {
                        id: item.id,
                        qty: item.qty,
                        price: item.price,
                        note: noteText
                    };
                })
            };

            const response = await axios.post('/orders', payload);

            if (clearCart) clearCart();
            localStorage.removeItem('gobi_checkout_form');

            const orderData = response.data.data;
            if (orderData && orderData.order_number) {
                navigate(`/track/${orderData.order_number}`, { state: { order: orderData } });
            } else {
                setErrors({ general: 'Pesanan berhasil dibuat, tetapi nomor resi tidak terdeteksi.' });
                navigate('/');
            }

        } catch (error) {
            if (error.response && error.response.data && error.response.data.errors) {
                const errorList = Object.values(error.response.data.errors).flat().join(', ');
                setErrors({ general: `Gagal membuat pesanan (Validasi Server): ${errorList}` });
            } else {
                setErrors({ general: 'Gagal membuat pesanan: ' + (error.response?.data?.message || error.message) });
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20 font-sans text-slate-800">
            {/* Header Sticky */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button type="button" onClick={() => navigate('/')} className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer">
                            <ArrowLeft className="w-5 h-5 text-slate-700" />
                        </button>
                        <h1 className="text-lg sm:text-xl font-bold text-slate-800">Checkout Pesanan</h1>
                    </div>
                </div>
            </div>

            {/* Container Utama */}
            <main className="max-w-6xl mx-auto px-4 pt-6">
                {cartItems.length === 0 ? (
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-4 shadow-xs my-8 max-w-md mx-auto">
                        <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                            <ShoppingBag className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-lg">Keranjang Kamu Kosong</h3>
                            <p className="text-xs text-slate-400 mt-1">Kamu belum memilih menu makanan/minuman.</p>
                        </div>
                        <button type="button" onClick={() => navigate('/')} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-3 rounded-xl transition-all shadow-md cursor-pointer">
                            Kembali Pilih Menu
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

                        {/* KOLOM KIRI: FORM & ITEM */}
                        <div className="lg:col-span-7 space-y-6">

                            {/* INFORMASI PENGANTARAN */}
                            <div className="bg-white p-5 rounded-3xl shadow-xs border border-slate-200 space-y-4">
                                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <User className="w-4 h-4 text-emerald-600" /> Informasi Pengantaran
                                </h2>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs font-bold text-slate-600 block mb-1">Nama Pemesan</label>
                                        <div className="relative">
                                            <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                            <input type="text" placeholder="Contoh: Budi Santoso" value={formData.name} onChange={(e) => { const sanitizedValue = e.target.value.replace(/[^a-zA-Z\s]/g, ''); setFormData({ ...formData, name: sanitizedValue }); if (errors.name) setErrors(prev => ({ ...prev, name: null })); }} className={`w-full pl-9 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 ${errors.name ? 'border-rose-500 focus:ring-rose-400' : 'border-slate-200 focus:ring-emerald-500'}`} />
                                        </div>
                                        {errors.name && <p className="text-[11px] font-bold text-rose-500 mt-1.5 pl-1">• {errors.name}</p>}
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-600 block mb-1">No. WhatsApp / HP</label>
                                        <div className="relative">
                                            <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                            <input type="tel" maxLength={13} placeholder="Contoh: 08123456789" value={formData.phone} onChange={(e) => { const sanitizedValue = e.target.value.replace(/\D/g, ''); setFormData({ ...formData, phone: sanitizedValue }); if (errors.phone) setErrors(prev => ({ ...prev, phone: null })); }} className={`w-full pl-9 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 ${errors.phone ? 'border-rose-500 focus:ring-rose-400' : 'border-slate-200 focus:ring-emerald-500'}`} />
                                        </div>
                                        {errors.phone && <p className="text-[11px] font-bold text-rose-500 mt-1.5 pl-1">• {errors.phone}</p>}
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-600 block mb-1">Pilih Kelas Tujuan</label>
                                        <div className="relative">
                                            <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                            <select value={formData.class_room_id} onChange={(e) => { setFormData({ ...formData, class_room_id: e.target.value }); if (errors.class_room_id) setErrors(prev => ({ ...prev, class_room_id: null })); }} className={`w-full pl-9 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 appearance-none text-slate-700 font-semibold cursor-pointer ${errors.class_room_id ? 'border-rose-500 focus:ring-rose-400' : 'border-slate-200 focus:ring-emerald-500'}`}>
                                                <option value="">-- Pilih Kelas --</option>
                                                {classRooms.map(room => (
                                                    <option key={room.id} value={room.id}>{room.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        {errors.class_room_id && <p className="text-[11px] font-bold text-rose-500 mt-1.5 pl-1">• {errors.class_room_id}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* RINGKASAN ITEMS */}
                            <div className="bg-white p-5 rounded-3xl shadow-xs border border-slate-200 space-y-4">
                                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <ShoppingBag className="w-4 h-4 text-emerald-600" /> Ringkasan Items ({cartItems.length})
                                    </h2>
                                </div>
                                <div className="space-y-4">
                                    {cartItems.map((item) => {
                                        const itemId = item.cartId || item.id;
                                        const currentNote = localNotes[itemId] !== undefined ? localNotes[itemId] : (item.note || '');
                                        const isEditing = editingNoteId === itemId;

                                        return (
                                            <div key={itemId} className="flex flex-col border-b border-slate-100 last:border-0 pb-3 last:pb-0">
                                                <div className="flex gap-3 items-center">
                                                    <img
                                                        src={getImageUrl(item.image)}
                                                        alt={item.name}
                                                        className="w-14 h-14 rounded-2xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-slate-800 text-sm truncate">{item.name}</h4>
                                                        <p className="text-xs font-semibold text-emerald-600 mt-0.5">Rp {Number(item.price).toLocaleString('id-ID')}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
                                                            <button type="button" onClick={() => handleSafeDecreaseQty(itemId)} className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-slate-700 shadow-xs hover:bg-slate-50 cursor-pointer"><Minus className="w-3 h-3" /></button>
                                                            <span className="w-7 text-center font-bold text-xs text-slate-800">{item.qty}</span>
                                                            <button type="button" onClick={() => handleSafeIncreaseQty(itemId)} className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-slate-700 shadow-xs hover:bg-slate-50 cursor-pointer"><Plus className="w-3 h-3" /></button>
                                                        </div>
                                                        <button type="button" onClick={() => handleRemoveItem(itemId)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                                                    </div>
                                                </div>

                                                {/* BARIS CATATAN */}
                                                <div className="mt-2.5 pl-17">
                                                    {isEditing ? (
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="text"
                                                                placeholder="Contoh: Pedas, tanpa sayur..."
                                                                value={currentNote}
                                                                onChange={(e) => setLocalNotes({ ...localNotes, [itemId]: e.target.value })}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        e.preventDefault();
                                                                        handleSaveNote(itemId);
                                                                    }
                                                                }}
                                                                className="flex-1 bg-slate-50 border border-emerald-400 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                                                autoFocus
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSaveNote(itemId)}
                                                                className="bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-xl text-xs hover:bg-emerald-700 transition-all flex items-center gap-1 shrink-0 shadow-xs cursor-pointer"
                                                            >
                                                                <Check className="w-3.5 h-3.5" /> Simpan
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center">
                                                            {currentNote ? (
                                                                <div className="bg-amber-50 border border-amber-200/80 text-amber-900 rounded-xl px-3 py-1.5 flex items-center justify-between gap-2 w-full text-xs">
                                                                    <p className="truncate font-medium text-[11px]">
                                                                        <span className="font-bold text-amber-800">Catatan:</span> {currentNote}
                                                                    </p>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setEditingNoteId(itemId)}
                                                                        className="text-amber-700 hover:text-amber-900 font-bold p-0.5 rounded-md hover:bg-amber-100 transition-colors shrink-0 cursor-pointer"
                                                                    >
                                                                        <SquarePen className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setEditingNoteId(itemId)}
                                                                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-2.5 py-1 rounded-lg transition-colors border border-dashed border-emerald-300 cursor-pointer"
                                                                >
                                                                    <SquarePen className="w-3.5 h-3.5" />
                                                                    <span>+ Tambah Catatan</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {itemErrors[itemId] && (
                                                    <div className="mt-2 text-[11px] font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl">
                                                        ⚠️ {itemErrors[itemId]}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* BANNER REKOMENDASI */}
                            <div className="bg-emerald-50/80 border border-emerald-200/80 p-4 rounded-3xl flex items-center justify-between gap-3 shadow-xs">
                                <div>
                                    <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm">Ada lagi yang mau dibeli?</h4>
                                    <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">Masih bisa nambah menu lain, ya.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => navigate('/')}
                                    className="bg-white hover:bg-emerald-600 hover:text-white border border-emerald-600 text-emerald-700 font-extrabold text-xs px-4 py-2 rounded-2xl transition-all shrink-0 shadow-xs flex items-center gap-1 cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Tambah
                                </button>
                            </div>

                            {/* KARUSEL REKOMENDASI */}
                            {recommendations.length > 0 && (
                                <div className="bg-white p-5 rounded-3xl shadow-xs border border-slate-200 space-y-3">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" /> Menu Lain yang Sering Dipesan
                                    </h3>

                                    <div className="flex overflow-x-auto gap-3 pt-1 pb-2">
                                        {recommendations.map(rec => (
                                            <div
                                                key={rec.id}
                                                className="min-w-[210px] bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5 flex items-center gap-3 shrink-0"
                                            >
                                                <img
                                                    src={getImageUrl(rec.image)}
                                                    alt={rec.name}
                                                    className="w-14 h-14 rounded-xl object-cover bg-white shrink-0"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <h5 className="font-bold text-xs text-slate-800 truncate">{rec.name}</h5>
                                                    <p className="font-extrabold text-xs text-emerald-600 mt-1">
                                                        Rp {Number(rec.price || 0).toLocaleString('id-ID')}
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleAddRecommendation(rec)}
                                                    className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 transition-all shadow-xs cursor-pointer"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* KOLOM KANAN: RINGKASAN PEMBAYARAN */}
                        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">

                            {/* RINCIAN PEMBAYARAN */}
                            <div className="bg-white p-5 rounded-3xl shadow-xs border border-slate-200 space-y-3">
                                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100">
                                    Ringkasan Pembayaran
                                </h2>

                                <div className="space-y-2 text-sm text-slate-500 pt-1">
                                    <div className="flex justify-between items-center">
                                        <span>Subtotal Produk</span>
                                        <span className="font-bold text-slate-700">Rp {subtotalProducts.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="flex justify-between items-center relative">
                                        <div className="flex items-center gap-1.5">
                                            <span>Biaya Antar</span>
                                            <button type="button" onClick={() => setShowInfo(!showInfo)} className="text-slate-400 hover:text-emerald-500 transition-colors cursor-pointer">
                                                <Info className="w-4 h-4" />
                                            </button>
                                            {showInfo && (
                                                <div className="absolute bottom-6 left-0 w-64 p-3 bg-slate-800 text-white text-[10px] rounded-2xl shadow-xl z-20">
                                                    Biaya antar dihitung otomatis berdasarkan kategori produk, jumlah makanan, subtotal snack/minuman, serta total item.
                                                </div>
                                            )}
                                        </div>
                                        <span className="font-bold text-slate-700">Rp {deliveryFee.toLocaleString('id-ID')}</span>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                                    <span className="text-sm font-bold text-slate-600">Total Pembayaran</span>
                                    <span className="text-lg font-black text-emerald-600">Rp {computedTotal.toLocaleString('id-ID')}</span>
                                </div>
                            </div>

                            {/* METODE PEMBAYARAN */}
                            <div className="bg-white p-5 rounded-3xl shadow-xs border border-slate-200 space-y-4">
                                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Metode Pembayaran</h2>
                                <div className="grid grid-cols-2 gap-3">
                                    <button type="button" onClick={() => { setPaymentMethod('QRIS'); if (errors.cashPaid) setErrors(prev => ({ ...prev, cashPaid: null })); }} className={`p-3.5 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition-all cursor-pointer ${paymentMethod === 'QRIS' ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700 shadow-xs' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                                        <QrCode className="w-6 h-6" /><span className="text-xs font-bold">QRIS</span>
                                    </button>
                                    <button type="button" onClick={() => setPaymentMethod('CASH')} className={`p-3.5 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition-all cursor-pointer ${paymentMethod === 'CASH' ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700 shadow-xs' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                                        <Banknote className="w-6 h-6" /><span className="text-xs font-bold">Tunai (Cash)</span>
                                    </button>
                                </div>

                                {paymentMethod === 'CASH' && (
                                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 bg-slate-50 p-4 rounded-2xl">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                                            <Calculator className="w-4 h-4 text-emerald-600" /><span>Perhitungan Kembalian Tunai</span>
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-500 block mb-1">Uang yang Dibayarkan (Rp)</label>
                                            <input type="number" placeholder="Masukkan jumlah uang..." value={cashPaid} onChange={(e) => { setCashPaid(e.target.value); if (errors.cashPaid) setErrors(prev => ({ ...prev, cashPaid: null })); }} className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 ${errors.cashPaid ? 'border-rose-500 focus:ring-rose-400' : 'border-slate-200 focus:ring-emerald-500'}`} />
                                            {errors.cashPaid && <p className="text-[11px] font-bold text-rose-500 mt-1.5 pl-1">• {errors.cashPaid}</p>}
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            <button type="button" onClick={() => { setCashPaid(computedTotal.toString()); if (errors.cashPaid) setErrors(prev => ({ ...prev, cashPaid: null })); }} className="text-[11px] bg-white border border-slate-200 font-bold px-2.5 py-1 rounded-lg hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer">Uang Pas</button>
                                            {[10000, 20000, 50000, 100000].map((val) => (
                                                <button key={val} type="button" onClick={() => { setCashPaid(val.toString()); if (errors.cashPaid) setErrors(prev => ({ ...prev, cashPaid: null })); }} className="text-[11px] bg-white border border-slate-200 font-bold px-2.5 py-1 rounded-lg hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer">Rp{val.toLocaleString('id-ID')}</button>
                                            ))}
                                        </div>
                                        {cashPaid !== '' && (
                                            <div className={`p-3 rounded-xl border flex justify-between items-center ${changeAmount >= 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
                                                <span className="text-xs font-bold">{changeAmount >= 0 ? 'Kembalian:' : 'Uang Kurang:'}</span>
                                                <span className="text-sm font-black">Rp {Math.abs(changeAmount).toLocaleString('id-ID')}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {errors.general && (
                                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-2xl text-xs font-bold">
                                    • {errors.general}
                                </div>
                            )}

                            {/* SUBMIT BUTTON */}
                            <button type="submit" disabled={submitting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-4 rounded-2xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 text-base disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                                {submitting ? 'Memproses Pesanan...' : 'Konfirmasi & Buat Pesanan'} <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>

                    </form>
                )}
            </main>
        </div>
    );
}