import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, ClipboardList } from 'lucide-react';
import ProductModal from '../components/ProductModal';
import FloatingCart from '../components/FloatingCart';
import { useCart } from '../context/CartContext';
import { Navigate } from 'react-router-dom';

export default function Catalog() {
    const navigate = useNavigate();
    const [data, setData] = useState({ isCanteenOpen: false, categories: [], classRooms: [] });
    const [loading, setLoading] = useState(true);
    const [canteenOpen, setCanteenOpen] = useState(true);
    const [activeCategory, setActiveCategory] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [searchMenu, setSearchMenu] = useState('');
    
    const { cartItems = [], addToCart } = useCart();

    useEffect(() => {

    const loadData = () => {

        Promise.all([
            axios.get("http://127.0.0.1:8000/api/catalog"),
            axios.get("http://127.0.0.1:8000/api/settings")
        ])
        .then(([catalogRes, settingRes]) => {

            setData(catalogRes.data);

            if (catalogRes.data.categories.length > 0) {
                setActiveCategory(catalogRes.data.categories[0].name);
            }

            const settings = settingRes.data.data || {};

            setCanteenOpen(settings.kantin_open === "1");

            if (settings.kantin_open === "1") {
                sessionStorage.removeItem("teacher_access");
            }

            setLoading(false);

        })
        .catch(err => {
            console.log(err);
            setLoading(false);
        });

    };

    // Pertama kali halaman dibuka
    loadData();

    // Cek perubahan setiap 2 detik
    const interval = setInterval(loadData, 2000);

    return () => clearInterval(interval);

}, []);

    const handleAddToCart = (product, qty = 1, note = '') => {
        // Validasi Maksimal 10 Porsi Makanan
        let catName = product.category_name || product.category?.name;
        if (!catName && data.categories) {
            const foundCat = data.categories.find(c => c.products?.some(p => p.id === product.id));
            if (foundCat) catName = foundCat.name;
        }

        if (catName === 'Makanan') {
            const existingMakananQty = cartItems
                .filter(item => {
                    const itemCat = item.category_name || item.category?.name;
                    return itemCat === 'Makanan';
                })
                .reduce((sum, item) => sum + item.qty, 0);

            if (existingMakananQty + qty > 10) {
                alert('Maksimal pemesanan kategori Makanan adalah 10 porsi dalam satu transaksi.');
                return;
            }
        }

        if (addToCart) {
            addToCart(product, qty, note);
        }
        setSelectedProduct(null);
    };

    const scrollToCategory = (catName) => {
        setActiveCategory(catName);
        const el = document.getElementById(`category-${catName}`);
        if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 100, behavior: 'smooth' });
    };

    const filteredCategories = data.categories.map(category => ({
        ...category,
        products: category.products.filter(p => p.name.toLowerCase().includes(searchMenu.toLowerCase()))
    })).filter(category => category.products.length > 0);

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p className="font-bold text-emerald-600 animate-pulse">Memuat Menu...</p></div>;
    const teacherAccess = sessionStorage.getItem("teacher_access");

if (!canteenOpen && teacherAccess !== "1") {
    return <Navigate to="/closed" replace />;
}

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-32">
            <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl relative">

                {/* Header Banner */}
                <div className="relative h-44 bg-emerald-900">
                    <img src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80" alt="Banner" className="w-full h-full object-cover opacity-60" />
                    <div className="absolute top-0 w-full p-4 flex justify-between items-center z-10">
                        <div className="bg-white/90 backdrop-blur-sm text-emerald-700 px-4 py-1.5 rounded-full font-black tracking-tight shadow-sm flex items-center gap-1">
                            <span className="text-amber-500">⚡</span> GoBI
                        </div>
                        <button onClick={() => navigate('/track')} className="bg-slate-800/80 backdrop-blur-md hover:bg-slate-900 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all">
                            <ClipboardList className="w-3.5 h-3.5" /> Riwayat
                        </button>
                    </div>
                </div>

                {/* Search Bar Makanan */}
                <div className="px-4 -mt-6 relative z-10">
                    <div className="bg-white rounded-2xl p-2 shadow-md border border-gray-100 flex items-center">
                        <Search className="w-5 h-5 text-gray-400 ml-2" />
                        <input
                            type="text"
                            placeholder="Cari makanan atau minuman..."
                            value={searchMenu}
                            onChange={(e) => setSearchMenu(e.target.value)}
                            className="w-full px-3 py-2 text-sm focus:outline-none"
                        />
                    </div>
                </div>

                {/* Tab Kategori */}
                {!searchMenu && (
                    <div className="mt-4 sticky top-0 bg-white z-30 border-b border-gray-200 shadow-sm">
                        <div className="flex overflow-x-auto no-scrollbar">
                            {data.categories.map(c => (
                                <button
                                    key={c.id} onClick={() => scrollToCategory(c.name)}
                                    className={`px-6 py-4 text-sm font-bold whitespace-nowrap uppercase tracking-wider transition-all
                                        ${activeCategory === c.name ? 'text-emerald-600 border-b-4 border-emerald-600' : 'text-gray-400 border-b-4 border-transparent'}`}
                                >
                                    {c.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Daftar Menu */}
                <main className="p-4 bg-gray-50">
                    {filteredCategories.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 font-medium text-sm">Menu tidak ditemukan.</div>
                    ) : (
                        filteredCategories.map(category => (
                            <div key={category.id} id={`category-${category.name}`} className="mb-8 pt-4">
                                <h2 className="text-sm text-gray-500 font-bold mb-4 uppercase tracking-wider">{category.name}</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    {category.products.map(product => (
                                        <div 
                                            key={product.id} 
                                            className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col cursor-pointer"
                                            onClick={() => product.is_available && setSelectedProduct({ ...product, category_name: category.name })}
                                        >
                                            <div className="relative h-32 bg-gray-200">
                                                <img src={product.image || 'https://via.placeholder.com/400'} alt={product.name} className="w-full h-full object-cover" />
                                                {!product.is_available && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">Habis</span></div>}
                                            </div>
                                            <div className="p-3 flex flex-col flex-1">
                                                <h3 className="font-bold text-gray-800 text-sm leading-tight mb-1">{product.name}</h3>
                                                <div className="flex-1"></div>
                                                <span className="font-bold text-gray-900 text-sm mt-2 mb-3">Rp{product.price.toLocaleString('id-ID')}</span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (product.is_available) setSelectedProduct({ ...product, category_name: category.name });
                                                    }}
                                                    className="bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors"
                                                >
                                                    + Tambah
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </main>

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
        </div>
    );
}