import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, ClipboardList } from 'lucide-react';
import ProductModal from '../components/ProductModal';
import FloatingCart from '../components/FloatingCart';
import { useCart } from '../context/CartContext';

export default function Catalog() {
    const navigate = useNavigate();
    const [data, setData] = useState({ isCanteenOpen: false, categories: [], classRooms: [] });
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [searchMenu, setSearchMenu] = useState('');
    
    const { cartItems = [], addToCart } = useCart();

    const getImageUrl = (url) => {
        if (!url) return 'https://placehold.co/400x300?text=No+Image';
        if (typeof url !== 'string') return url;
        return url.replace(/^http:\/\/(127\.0\.0\.1|localhost):8000/, '');
    };

    useEffect(() => {
        axios.get('/catalog')
            .then(response => {
                const resData = response.data || { categories: [] };
                setData(resData);
                if (resData.categories && resData.categories.length > 0) {
                    setActiveCategory(resData.categories[0].name);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const handleAddToCart = (product, qty = 1, note = '') => {
        let catName = product.category_name || product.category?.name;
        if (!catName && data.categories) {
            const foundCat = data.categories.find(c => (c.products || []).some(p => p.id === product.id));
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
        if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 100, behavior: 'smooth' });
    };

    const categoriesList = Array.isArray(data.categories) ? data.categories : [];
    const uniqueMergedCategories = Object.values(
        categoriesList.reduce((acc, category) => {
            if (!category.name) return acc;
            if (!acc[category.name]) {
                acc[category.name] = { ...category, products: [] };
            }
            const products = Array.isArray(category.products) ? category.products : [];
            products.forEach(p => {
                if (!acc[category.name].products.some(existing => existing.id === p.id)) {
                    acc[category.name].products.push(p);
                }
            });
            return acc;
        }, {})
    );

    const filteredCategories = uniqueMergedCategories.map(category => ({
        ...category,
        products: (category.products || [])
            .filter(p => p.name && p.name.toLowerCase().includes(searchMenu.toLowerCase()))
            .sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0))
    })).filter(category => category.products.length > 0);

    useEffect(() => {
        if (uniqueMergedCategories.length > 0 && !activeCategory) {
            setActiveCategory(uniqueMergedCategories[0].name);
        }
    }, [uniqueMergedCategories, activeCategory]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="font-bold text-emerald-600 animate-pulse">Memuat Menu...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-32">
            <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl relative">

                {/* Header Banner */}
                <div className="relative h-44 bg-emerald-900">
                    {/* Mengambil langsung dari folder public/assets/ */}
                    <img 
                        src="/assets/Benner.png" 
                        alt="Banner" 
                        className="w-full h-full object-cover opacity-60" 
                        onError={(e) => {
                            e.target.src = "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80";
                        }}
                    />
                    <div className="absolute top-0 w-full p-4 flex justify-between items-center z-10">
                        <div className="bg-white/90 backdrop-blur-sm text-emerald-700 px-3 py-1 rounded-full font-black tracking-tight shadow-sm flex items-center gap-1.5">
                            <img 
                                src="/assets/Logo.png" 
                                alt="Logo" 
                                className="h-6 w-auto object-contain"
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                            <span>GoBI</span>
                        </div>
                        <button onClick={() => navigate('/track')} className="bg-slate-800/80 backdrop-blur-md hover:bg-slate-900 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all">
                            <ClipboardList className="w-3.5 h-3.5" /> Riwayat
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
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
                            {uniqueMergedCategories.map(c => (
                                <button
                                    key={c.id || c.name} 
                                    onClick={() => scrollToCategory(c.name)}
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
                            <div key={category.name} id={`category-${category.name}`} className="mb-8 pt-4">
                                <h2 className="text-sm text-gray-500 font-bold mb-4 uppercase tracking-wider">{category.name}</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    {category.products.map(product => (
                                        <div 
                                            key={product.id} 
                                            className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col cursor-pointer"
                                            onClick={() => product.is_available && setSelectedProduct({ ...product, category_name: category.name })}
                                        >
                                            <div className="relative h-32 bg-gray-200">
                                                <img src={getImageUrl(product.image)} alt={product.name} className="w-full h-full object-cover" />
                                                {!product.is_available && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">Habis</span></div>}
                                            </div>
                                            <div className="p-3 flex flex-col flex-1">
                                                <h3 className="font-bold text-gray-800 text-sm leading-tight mb-1">{product.name}</h3>
                                                <div className="flex-1"></div>
                                                <span className="font-bold text-gray-900 text-sm mt-2 mb-3">
                                                    Rp{Number(product.price || 0).toLocaleString('id-ID')}
                                                </span>
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