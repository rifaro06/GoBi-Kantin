import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
    ArrowLeft, Trash2, Plus, Minus, QrCode, Banknote,
    ShoppingBag, User, Phone, GraduationCap, ChevronRight, Calculator, Info
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
        clearCart
    } = useCart();

    const [classRooms, setClassRooms] = useState(location.state?.classRooms || []);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    // State khusus pesan error per-item produk
    const [itemErrors, setItemErrors] = useState({});

    // State Pengaturan Ongkir
    const [settings, setSettings] = useState(null);
    const [deliveryFee, setDeliveryFee] = useState(0);
    const [showInfo, setShowInfo] = useState(false);

    // HELPER: Mencegah Mixed Content & Error gambar
    const getImageUrl = (url) => {
        if (!url) return 'https://placehold.co/400x300?text=No+Image';
        if (typeof url !== 'string') return url;
        return url.replace(/^http:\/\/(127\.0\.0\.1|localhost):8000/, '');
    };

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

    useEffect(() => {
        localStorage.setItem('gobi_checkout_form', JSON.stringify(formData));
    }, [formData]);

    useEffect(() => {
        if (classRooms.length === 0) {
            axios.get('/catalog')
                .then(res => setClassRooms(res.data.classRooms || []))
                .catch(err => console.error('Gagal mengambil daftar kelas dari API:', err));
        }
    }, [classRooms.length]);

    // TARIK DATA SETTINGS DARI API
    useEffect(() => {
        axios.get('/settings')
            .then(res => {
                const data = res.data.data || res.data;
                if (Array.isArray(data)) {
                    let formattedObj = {};
                    data.forEach(item => {
                        formattedObj[item.key_name] = item.value;
                    });
                    setSettings(formattedObj);
                } else {
                    setSettings(data);
                }
            })
            .catch(err => console.error('Gagal mengambil pengaturan ongkir:', err));
    }, []);

    // KALKULASI ONGKIR (ANTI NaN)
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

        const drinkBaseFee = safeNumber(settings?.drink_base_fee, 0);
        const drinkThreshold = safeNumber(settings?.drink_threshold, 10000);
        const drinkFee = safeNumber(settings?.drink_fee, 1000);

        const snackBaseFee = safeNumber(settings?.snack_base_fee, 0);
        const snackThreshold = safeNumber(settings?.snack_threshold, 10000);
        const snackFee = safeNumber(settings?.snack_fee, 1000);

        const globalItemMax = safeNumber(settings?.global_item_max, 5);
        const globalMinFee = safeNumber(settings?.global_min_fee, 1500);

        let foodQty = 0;
        let drinkSub = 0;
        let snackSub = 0;
        let totalItems = 0;

        cartItems.forEach(item => {
            const qty = safeNumber(item.qty, 1);
            const priceTotal = safeNumber(item.price, 0) * qty;
            totalItems += qty;

            const cat = String(item.category_name || item.category?.name || '').toLowerCase();

            if (cat.includes('makan')) {
                foodQty += qty;
            } else if (cat.includes('minum')) {
                drinkSub += priceTotal;
            } else if (cat.includes('snack') || cat.includes('cemilan')) {
                snackSub += priceTotal;
            } else {
                foodQty += qty;
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

        let finalFee = Math.max(foodFeeCalc, drinkFeeCalc, snackFeeCalc);

        if (foodQty >= 1 && totalItems > globalItemMax) {
            finalFee = Math.max(finalFee, globalMinFee);
        }

        setDeliveryFee(finalFee);
    }, [cartItems, settings]);
    

    // PROTEKSI PEMESANAN DENGAN NOTIFIKASI DI BAWAH PRODUK
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
                // Set pesan error khusus untuk item ini
                setItemErrors(prev => ({
                    ...prev,
                    [itemId]: `Maksimal pemesanan kategori Makanan adalah ${maxFoodQty} porsi dalam satu transaksi.`
                }));
                return;
            }
        }

        // Bersihkan error jika berhasil tambah
        setItemErrors(prev => ({ ...prev, [itemId]: null }));
        handleIncreaseQty(itemId);
    };

    const handleSafeDecreaseQty = (itemId) => {
        // Clear error saat kuantitas dikurangi
        setItemErrors(prev => ({ ...prev, [itemId]: null }));
        handleDecreaseQty(itemId);
    };

    const smpClasses = classRooms.filter(room =>
        room.name.includes('VII') || room.name.includes('VIII') || room.name.includes('IX')
    );
    const smaClasses = classRooms.filter(room => !smpClasses.includes(room));

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
                items: cartItems.map(item => ({
                    id: item.id,
                    qty: item.qty,
                    price: item.price,
                    note: item.note || formData.notes || ''
                }))
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
        <div className="min-h-screen bg-slate-50 pb-20 font-sans">
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
                    <button type="button" onClick={() => navigate('/')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-slate-700" />
                    </button>
                    <h1 className="text-xl font-bold text-slate-800">Checkout Pesanan</h1>
                </div>
            </div>

            <main className="max-w-md mx-auto px-4 pt-6 space-y-6">
                {cartItems.length === 0 ? (
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm my-8">
                        <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                            <ShoppingBag className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-lg">Keranjang Kamu Kosong</h3>
                            <p className="text-xs text-slate-400 mt-1">Kamu belum memilih menu makanan/minuman.</p>
                        </div>
                        <button type="button" onClick={() => navigate('/')} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-3 rounded-xl transition-all shadow-md">
                            Kembali Pilih Menu
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} noValidate className="space-y-6">

                        {/* INFORMASI PENGANTARAN */}
                        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 space-y-4">
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
                                        <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                        <select value={formData.class_room_id} onChange={(e) => { setFormData({ ...formData, class_room_id: e.target.value }); if (errors.class_room_id) setErrors(prev => ({ ...prev, class_room_id: null })); }} className={`w-full pl-9 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 appearance-none text-slate-700 font-medium ${errors.class_room_id ? 'border-rose-500 focus:ring-rose-400' : 'border-slate-200 focus:ring-emerald-500'}`}>
                                            <option value="">-- Pilih Kelas --</option>
                                            {smpClasses.length > 0 && <optgroup label="--- JENJANG SMP ---">{smpClasses.map(room => <option key={room.id} value={room.id}>{room.name}</option>)}</optgroup>}
                                            {smaClasses.length > 0 && <optgroup label="--- JENJANG SMK ---">{smaClasses.map(room => <option key={room.id} value={room.id}>{room.name}</option>)}</optgroup>}
                                        </select>
                                    </div>
                                    {errors.class_room_id && <p className="text-[11px] font-bold text-rose-500 mt-1.5 pl-1">• {errors.class_room_id}</p>}
                                </div>
                            </div>
                        </div>

                        {/* RINGKASAN ITEMS */}
                        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 space-y-4">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <ShoppingBag className="w-4 h-4 text-emerald-600" /> Ringkasan Items ({cartItems.length})
                                </h2>
                            </div>
                            <div className="space-y-4">
                                {cartItems.map((item) => {
                                    const itemId = item.cartId || item.id;
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
                                                        <button type="button" onClick={() => handleSafeDecreaseQty(itemId)} className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-slate-700 shadow-sm hover:bg-slate-50"><Minus className="w-3 h-3" /></button>
                                                        <span className="w-7 text-center font-bold text-xs text-slate-800">{item.qty}</span>
                                                        <button type="button" onClick={() => handleSafeIncreaseQty(itemId)} className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-slate-700 shadow-sm hover:bg-slate-50"><Plus className="w-3 h-3" /></button>
                                                    </div>
                                                    <button type="button" onClick={() => handleRemoveItem(itemId)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </div>

                                            {/* NOTIFIKASI ERROR TEPAT DI BAWAH PRODUK */}
                                            {itemErrors[itemId] && (
                                                <div className="mt-2 text-[11px] font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl animate-fade-in">
                                                    ⚠️ {itemErrors[itemId]}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="pt-3 border-t border-slate-100 space-y-2">
                                <div className="flex justify-between items-center text-sm text-slate-500">
                                    <span>Subtotal Produk</span>
                                    <span className="font-bold text-slate-700">Rp {subtotalProducts.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm text-slate-500 relative">
                                    <div className="flex items-center gap-1.5">
                                        <span>Biaya Antar</span>
                                        <button type="button" onClick={() => setShowInfo(!showInfo)} className="text-slate-400 hover:text-emerald-500 transition-colors"><Info className="w-4 h-4" /></button>
                                        {showInfo && <div className="absolute bottom-6 left-0 w-64 p-3 bg-slate-800 text-white text-[10px] rounded-2xl shadow-xl z-20">Biaya antar dihitung berdasarkan kategori produk, jumlah makanan, subtotal snack/minuman, serta jumlah total item untuk membantu proses pengantaran pesanan ke kelas.</div>}
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
                        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 space-y-4">
                            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Metode Pembayaran</h2>
                            <div className="grid grid-cols-2 gap-3">
                                <button type="button" onClick={() => { setPaymentMethod('QRIS'); if (errors.cashPaid) setErrors(prev => ({ ...prev, cashPaid: null })); }} className={`p-3.5 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition-all ${paymentMethod === 'QRIS' ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700 shadow-sm' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                                    <QrCode className="w-6 h-6" /><span className="text-xs font-bold">QRIS</span>
                                </button>
                                <button type="button" onClick={() => setPaymentMethod('CASH')} className={`p-3.5 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition-all ${paymentMethod === 'CASH' ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700 shadow-sm' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
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
                                        <input type="number" placeholder="Masukkan jumlah uang..." value={cashPaid} onChange={(e) => { setCashPaid(e.target.value); if (errors.cashPaid) setErrors(prev => ({ ...prev, cashPaid: null })); }} className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${errors.cashPaid ? 'border-rose-500 focus:ring-rose-400' : 'border-slate-200 focus:ring-emerald-500'}`} />
                                        {errors.cashPaid && <p className="text-[11px] font-bold text-rose-500 mt-1.5 pl-1">• {errors.cashPaid}</p>}
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        <button type="button" onClick={() => { setCashPaid(computedTotal.toString()); if (errors.cashPaid) setErrors(prev => ({ ...prev, cashPaid: null })); }} className="text-[11px] bg-white border border-slate-200 font-bold px-2.5 py-1 rounded-lg hover:bg-emerald-50 hover:text-emerald-700 transition-colors">Uang Pas</button>
                                        {[10000, 20000, 50000, 100000].map((val) => (
                                            <button key={val} type="button" onClick={() => { setCashPaid(val.toString()); if (errors.cashPaid) setErrors(prev => ({ ...prev, cashPaid: null })); }} className="text-[11px] bg-white border border-slate-200 font-bold px-2.5 py-1 rounded-lg hover:bg-emerald-50 hover:text-emerald-700 transition-colors">Rp{val.toLocaleString('id-ID')}</button>
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

                        <button type="submit" disabled={submitting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-4 rounded-2xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 text-base disabled:opacity-50 disabled:cursor-not-allowed">
                            {submitting ? 'Memproses Pesanan...' : 'Konfirmasi & Buat Pesanan'} <ChevronRight className="w-5 h-5" />
                        </button>
                    </form>
                )}
            </main>
        </div>
    );
}