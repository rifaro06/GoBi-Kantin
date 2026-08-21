import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, ClipboardList, UtensilsCrossed, Sparkles, MapPin, ChevronRight } from 'lucide-react';
import ProductModal from '../components/ProductModal';
import FloatingCart from '../components/FloatingCart';
import { useCart } from '../context/CartContext';

import logoImg from '../assets/Logo.png';
import bannerImg from '../assets/Benner.png';

export default function Catalog() {
    const navigate = useNavigate();
    const [data, setData] = useState({ isCanteenOpen: false, categories: [], classRooms: [] });
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [searchMenu, setSearchMenu] = useState('');

    const { cartItems = [], addToCart } = useCart();

    const getImageUrl = (url) => {
        if (!url) return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80';
        if (typeof url !== 'string') return url;

        const baseUrl = axios.defaults.baseURL
            ? axios.defaults.baseURL.replace(/\/api\/?$/, '')
            : window.location.origin;

        if (url.startsWith('http://') || url.startsWith('https://')) {
            if (url.includes('localhost') || url.includes('127.0.0.1')) {
                const path = url.replace(/^https?:\/\/[^\/]+/, '');
                return `${baseUrl}${path}`;
            }
            return url;
        }

        const cleanPath = url.startsWith('/') ? url : `/${url}`;
        if (cleanPath.startsWith('/storage')) {
            return `${baseUrl}${cleanPath}`;
        }

        return `${baseUrl}/storage${cleanPath}`;
    };

    // POLLING: Cek Status Kantin
    useEffect(() => {
        const checkStatus = async () => {
            const isTeacher = sessionStorage.getItem("teacher_access") === "1";

            try {
                const res = await axios.get('/settings', {
                    headers: { 'ngrok-skip-browser-warning': '69420' }
                });
                const rawData = res.data.data || res.data || {};

                let settings = {};
                if (Array.isArray(rawData)) {
                    rawData.forEach(item => {
                        const k = item.key_name || item.key;
                        if (k) settings[k] = item.value;
                    });
                } else if (typeof rawData === 'object') {
                    settings = { ...rawData };
                }

                const isOpen = settings.kantin_open == 1 || settings.kantin_open === "1" || settings.kantin_open === true;

                if (isOpen && isTeacher) {
                    sessionStorage.removeItem("teacher_access");
                }

                if (!isOpen && !isTeacher) {
                    navigate('/closed', { replace: true });
                }
            } catch (err) {
                console.error("Gagal mengecek status kantin:", err);
            }
        };

        checkStatus();
        const interval = setInterval(checkStatus, 3000);
        return () => clearInterval(interval);
    }, [navigate]);

    // AMBIL DATA KATALOG
    useEffect(() => {
        axios.get('/catalog', {
            headers: {
                'ngrok-skip-browser-warning': '69420',
                'Accept': 'application/json'
            }
        })
            .then(response => {
                let resData = response.data || {};
                if (typeof resData === 'string') {
                    try { resData = JSON.parse(resData); } catch (e) { resData = {}; }
                }

                let rawCategories = resData.categories || resData.data || (Array.isArray(resData) ? resData : []);
                if (!Array.isArray(rawCategories)) rawCategories = [];

                let rawProducts = resData.products || [];
                if (!Array.isArray(rawProducts) && Array.isArray(resData.data)) {
                    rawProducts = resData.data.filter(item => item && (item.name || item.title || item.harga || item.price));
                }

                let hasCategoryProducts = rawCategories.some(cat => Array.isArray(cat?.products) && cat.products.length > 0);

                if (!hasCategoryProducts && rawProducts.length > 0) {
                    rawCategories = [
                        {
                            id: 1,
                            name: 'Semua Menu',
                            products: rawProducts
                        }
                    ];
                }

                setData({
                    ...resData,
                    categories: rawCategories,
                    classRooms: resData.classRooms || []
                });

                if (rawCategories.length > 0) {
                    setActiveCategory(rawCategories[0].name || 'Semua Menu');
                }
            })
            .catch(err => console.error("Gagal memuat catalog:", err))
            .finally(() => setLoading(false));
    }, []);

    // FORMAT DATA KATEGORI & PENCARIAN
    const categoriesList = Array.isArray(data.categories) ? data.categories : [];
    const formattedCategories = categoriesList.map(cat => {
        const catName = cat.name || cat.title || 'Menu';
        const rawProducts = Array.isArray(cat.products) ? cat.products : [];

        const filteredProducts = rawProducts
            .filter(p => p && (p.name || p.title) && String(p.name || p.title).toLowerCase().includes(searchMenu.toLowerCase()))
            .sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));

        return {
            ...cat,
            name: catName,
            products: filteredProducts
        };
    }).filter(cat => cat.products.length > 0);

    // FITUR SCROLLSPY (Observer Kategori Aktif)
    useEffect(() => {
        if (formattedCategories.length === 0 || searchMenu) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const catName = entry.target.getAttribute('data-cat-name');
                        if (catName) setActiveCategory(catName);
                    }
                });
            },
            {
                rootMargin: '-20% 0px -70% 0px', // Area sensitif deteksi di layar
                threshold: 0
            }
        );

        formattedCategories.forEach((cat) => {
            const el = document.getElementById(`category-${cat.name}`);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, [formattedCategories, searchMenu]);

    const handleAddToCart = (product, qty = 1, note = '', variants = []) => {
        let catName = product.category_name || product.category?.name;
        if (!catName && data.categories) {
            const foundCat = data.categories.find(c => (c.products || []).some(p => String(p.id) === String(product.id)));
            if (foundCat) catName = foundCat.name;
        }

        if (catName === 'Makanan') {
            const existingMakananQty = cartItems
                .filter(item => (item.category_name || item.category?.name) === 'Makanan')
                .reduce((sum, item) => sum + item.qty, 0);

            if (existingMakananQty + qty > 10) {
                alert('Maksimal pemesanan kategori Makanan adalah 10 porsi dalam satu transaksi.');
                return;
            }
        }

        // PERBAIKAN: Pastikan 'variants' ikut dikirim ke CartContext
        if (addToCart) addToCart(product, qty, note, variants);
        setSelectedProduct(null);
    };

    const scrollToCategory = (catName) => {
        setActiveCategory(catName);
        const el = document.getElementById(`category-${catName}`);
        if (el) {
            // Smooth scroll bawaan, offset ditangani oleh class 'scroll-mt-[...]' di elemen target
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-emerald-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="font-bold text-emerald-800 animate-pulse text-sm">Menyiapkan Menu Lezat...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 font-sans pb-36 text-slate-800">
            {/* HERO SECTION (Diperbarui dengan gaya modern) */}
            <div className="relative w-full overflow-hidden h-[260px] sm:h-[320px] rounded-b-[2rem] sm:rounded-b-[3rem] shadow-sm">
                <img
                    src={bannerImg}
                    alt="Banner GoBi"
                    className="w-full h-full object-cover opacity-90 scale-105 transition-transform duration-1000"
                    onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80";
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/40 to-slate-900/90"></div>

                {/* Header Nav */}
                <div className="absolute top-0 inset-x-0 z-10 pt-4 pb-2">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                        <div className="bg-white/90 backdrop-blur-xl border border-white/40 text-emerald-800 px-4 py-2 rounded-full font-black shadow-lg flex items-center gap-2.5 transition-all hover:scale-105">
                            <img
                                src={logoImg}
                                alt="Logo GoBi"
                                className="h-6 sm:h-7 w-auto object-contain"
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                            <span className="text-sm sm:text-base tracking-tight font-extrabold text-emerald-950">GoBI</span>
                        </div>
                        <button
                            onClick={() => navigate('/track')}
                            className="bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 backdrop-blur-md text-emerald-50 px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95 group"
                        >
                            <ClipboardList className="w-4 h-4 text-emerald-400 group-hover:rotate-12 transition-transform" />
                            <span>Riwayat Pesanan</span>
                        </button>
                    </div>
                </div>

                {/* Hero Content */}
                <div className="absolute bottom-8 inset-x-0 z-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    <div className="flex flex-col gap-3">
                        <span className="inline-flex w-max items-center gap-1.5 bg-white/20 border border-white/30 text-white text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full backdrop-blur-md">
                            <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" /> Kantin Digital Pintar
                        </span>
                        <h1 className="text-white font-black text-2xl sm:text-3xl md:text-4xl tracking-tight leading-[1.15] drop-shadow-md">
                            Mau Makan Apa Hari Ini ? <br /> <span className="text-emerald-300">Kami Siap Antar Ke Kelas</span>
                        </h1>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
                {/* SEARCH BAR (Floating) */}
                <div className="bg-white/80 backdrop-blur-xl rounded-full p-2 shadow-xl shadow-slate-200/50 border border-white/60 flex items-center max-w-xl mx-auto transition-all focus-within:ring-4 focus-within:ring-emerald-500/20 focus-within:bg-white">
                    <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center shrink-0 ml-1">
                        <Search className="w-4 h-4 text-emerald-600" />
                    </div>
                    <input
                        type="text"
                        placeholder="Cari makanan atau minuman..."
                        value={searchMenu}
                        onChange={(e) => setSearchMenu(e.target.value)}
                        className="w-full px-4 py-2 text-sm text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none font-medium"
                    />
                </div>

                {/* CATEGORY TABS (Sticky & Scrollspy) */}
                {!searchMenu && formattedCategories.length > 0 && (
                    <div className="mt-8 sticky top-2 z-30 py-2">
                        <div className="bg-white/80 backdrop-blur-2xl rounded-2xl border border-white/50 shadow-lg shadow-slate-200/40 p-2 flex overflow-x-auto gap-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden items-center">
                            {formattedCategories.map(c => {
                                const isActive = activeCategory === c.name;
                                return (
                                    <button
                                        key={c.id || c.name}
                                        onClick={() => scrollToCategory(c.name)}
                                        className={`px-5 py-2.5 rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-300 whitespace-nowrap shrink-0 flex items-center gap-1.5 ${isActive
                                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-100'
                                                : 'bg-transparent text-slate-500 hover:bg-slate-100/80 hover:text-slate-800'
                                            }`}
                                    >
                                        {c.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                <main className="mt-8 sm:mt-12 space-y-12">
                    {formattedCategories.length === 0 ? (
                        <div className="bg-white rounded-3xl p-12 text-center text-slate-400 font-medium text-sm shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                                <UtensilsCrossed className="w-8 h-8 text-slate-300" />
                            </div>
                            <p>Maaf, menu yang kamu cari tidak ditemukan.</p>
                        </div>
                    ) : (
                        formattedCategories.map(category => (
                            <div
                                key={category.name}
                                id={`category-${category.name}`}
                                data-cat-name={category.name} // Attribute untuk scrollspy
                                className="scroll-mt-[140px]" // Menyesuaikan jarak agar tidak tertutup sticky navbar
                            >
                                <div className="flex items-center gap-3 mb-5 pl-1">
                                    <h2 className="text-lg sm:text-xl text-slate-800 font-black tracking-tight flex items-center gap-2">
                                        {category.name}
                                        <ChevronRight className="w-5 h-5 text-emerald-500" />
                                    </h2>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-5">
                                    {category.products.map(product => (
                                        <div
                                            key={product.id}
                                            className="bg-white rounded-[1.25rem] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 border border-slate-100 flex flex-col justify-between cursor-pointer group"
                                            onClick={() => product.is_available && setSelectedProduct({ ...product, category_name: category.name })}
                                        >
                                            <div>
                                                <div className="relative w-full aspect-[4/3] bg-slate-100 overflow-hidden">
                                                    <img
                                                        src={getImageUrl(product.image)}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                                                        onError={(e) => {
                                                            e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80';
                                                        }}
                                                    />
                                                    <div className="absolute top-2 left-2">
                                                        <span className="bg-white/90 backdrop-blur-sm text-slate-700 text-[9px] sm:text-[10px] font-black px-2 py-1 rounded-md shadow-sm uppercase tracking-wider">
                                                            {category.name}
                                                        </span>
                                                    </div>
                                                    {!product.is_available && (
                                                        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center">
                                                            <span className="bg-rose-500 text-white text-[10px] sm:text-xs font-black px-3 py-1.5 rounded-lg shadow-md uppercase tracking-wider">
                                                                Stok Habis
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="p-3.5 sm:p-4">
                                                    <h3 className="font-bold text-slate-800 text-xs sm:text-sm leading-snug line-clamp-2 min-h-[2.25rem] group-hover:text-emerald-600 transition-colors">
                                                        {product.name || product.title}
                                                    </h3>
                                                    <p className="font-black text-emerald-600 text-sm sm:text-base mt-2">
                                                        Rp{Number(product.price || 0).toLocaleString('id-ID')}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="p-3.5 sm:p-4 pt-0">
                                                <button
                                                    disabled={!product.is_available}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (product.is_available) setSelectedProduct({ ...product, category_name: category.name });
                                                    }}
                                                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-black transition-all duration-300 ${product.is_available
                                                            ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-md shadow-emerald-600/20'
                                                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                        }`}
                                                >
                                                    {product.is_available ? '+ Tambah' : 'Stok Habis'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </main>
            </div>

            <ProductModal
                product={selectedProduct}
                onClose={() => setSelectedProduct(null)}
                onAddToCart={handleAddToCart}
            />

            <FloatingCart
                cart={cartItems}
                onCheckoutClick={() => navigate('/checkout', { state: { classRooms: data.classRooms } })}
            />
        </div>
    );
}