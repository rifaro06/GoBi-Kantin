import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, ClipboardList, UtensilsCrossed, Sparkles } from 'lucide-react';
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

    const handleAddToCart = (product, qty = 1, note = '') => {
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

        if (addToCart) addToCart(product, qty, note);
        setSelectedProduct(null);
    };

    const scrollToCategory = (catName) => {
        setActiveCategory(catName);
        const el = document.getElementById(`category-${catName}`);
        if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 110, behavior: 'smooth' });
    };

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

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
                <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="font-extrabold text-emerald-700 animate-pulse text-sm sm:text-base">
                    Memuat Menu Kantin...
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-36 text-slate-800">
            <div className="relative w-full bg-slate-950 overflow-hidden h-48 sm:h-60 md:h-72">
                <img 
                    src={bannerImg} 
                    alt="Banner GoBi" 
                    className="w-full h-full object-cover opacity-60 scale-105 transition-all duration-700" 
                    onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80";
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
                <div className="absolute top-0 inset-x-0 z-10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                        <div className="bg-white/95 backdrop-blur-md border border-white/20 text-emerald-800 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-2xl font-black shadow-lg flex items-center gap-2.5">
                            <img 
                                src={logoImg} 
                                alt="Logo GoBi" 
                                className="h-6 sm:h-7 w-auto object-contain"
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                            <span className="text-sm sm:text-base tracking-tight font-extrabold text-slate-900">GoBI</span>
                        </div>
                        <button 
                            onClick={() => navigate('/track')}
                            className="bg-white/15 hover:bg-white/25 border border-white/20 backdrop-blur-md text-white px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95"
                        >
                            <ClipboardList className="w-4 h-4 text-emerald-400" />
                            <span>Riwayat Pesanan</span>
                        </button>
                    </div>
                </div>

                <div className="absolute bottom-10 inset-x-0 z-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    <span className="inline-flex items-center gap-1 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-lg mb-1.5 backdrop-blur-sm">
                        <Sparkles className="w-3 h-3 text-amber-400 fill-amber-400" /> Kantin Digital GoBI
                    </span>
                    <h1 className="text-white font-black text-xl sm:text-2xl md:text-3xl tracking-tight leading-tight">
                        Mau Makan Apa Hari Ini? <br />
                        Kami siap antarkan ke Kelasmu!
                    </h1>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-7 relative z-20">
                <div className="bg-white rounded-2xl p-2 sm:p-2.5 shadow-xl shadow-slate-900/5 border border-slate-100 flex items-center max-w-xl md:max-w-2xl mx-auto transition-all focus-within:ring-2 focus-within:ring-emerald-500">
                    <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
                    <input
                        type="text"
                        placeholder="Cari makanan atau minuman favoritmu..."
                        value={searchMenu}
                        onChange={(e) => setSearchMenu(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
                    />
                </div>

                {!searchMenu && formattedCategories.length > 0 && (
                    <div className="mt-6 sticky top-0 bg-slate-50/95 backdrop-blur-md z-30 py-3 border-b border-slate-200/80">
                        <div className="flex overflow-x-auto overflow-y-hidden justify-start sm:justify-center gap-2 sm:gap-3 px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                            {formattedCategories.map(c => {
                                const isActive = activeCategory === c.name;
                                return (
                                    <button
                                        key={c.id || c.name} 
                                        onClick={() => scrollToCategory(c.name)}
                                        className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap shrink-0 ${
                                            isActive 
                                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-105' 
                                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80 shadow-xs'
                                        }`}
                                    >
                                        {c.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                <main className="mt-6">
                    {formattedCategories.length === 0 ? (
                        <div className="bg-white rounded-3xl p-12 text-center text-slate-400 font-medium text-xs sm:text-sm shadow-xs border border-slate-100 flex flex-col items-center justify-center gap-3">
                            <UtensilsCrossed className="w-10 h-10 text-slate-300" />
                            <p>Menu yang kamu cari tidak ditemukan.</p>
                        </div>
                    ) : (
                        formattedCategories.map(category => (
                            <div key={category.name} id={`category-${category.name}`} className="mb-10 pt-2">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-1.5 h-4 bg-emerald-600 rounded-full"></div>
                                    <h2 className="text-xs sm:text-sm text-slate-500 font-black uppercase tracking-wider">
                                        {category.name}
                                    </h2>
                                </div>
                                
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-5">
                                    {category.products.map(product => (
                                        <div 
                                            key={product.id}
                                            className="bg-white rounded-2xl overflow-hidden shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-100 flex flex-col justify-between cursor-pointer group"
                                            onClick={() => product.is_available && setSelectedProduct({ ...product, category_name: category.name })}
                                        >
                                            <div>
                                                <div className="relative w-full aspect-[4/3] bg-slate-100 overflow-hidden">
                                                    <img 
                                                        src={getImageUrl(product.image)} 
                                                        alt={product.name}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                                        onError={(e) => {
                                                            e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80';
                                                        }}
                                                    />
                                                    {!product.is_available && (
                                                        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[1px] flex items-center justify-center">
                                                            <span className="bg-rose-500 text-white text-[10px] sm:text-xs font-black px-2.5 py-1 rounded-lg shadow-md uppercase tracking-wider">
                                                                Habis
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="p-3 sm:p-3.5">
                                                    <h3 className="font-bold text-slate-800 text-xs sm:text-sm leading-snug line-clamp-2 min-h-[2.25rem]">
                                                        {product.name || product.title}
                                                    </h3>
                                                    <p className="font-black text-emerald-600 text-xs sm:text-base mt-1">
                                                        Rp{Number(product.price || 0).toLocaleString('id-ID')}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="p-3 sm:p-3.5 pt-0">
                                                <button
                                                    disabled={!product.is_available}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (product.is_available) setSelectedProduct({ ...product, category_name: category.name });
                                                    }}
                                                    className={`w-full py-2 px-3 rounded-xl text-xs font-extrabold transition-all shadow-xs ${
                                                        product.is_available
                                                            ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-emerald-600/20'
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