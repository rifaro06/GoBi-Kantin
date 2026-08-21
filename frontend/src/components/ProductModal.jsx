import React, { useState, useEffect } from 'react';
import { X, Plus, Minus } from 'lucide-react';

export default function ProductModal({ product, onClose, onAddToCart }) {
    const [quantity, setQuantity] = useState(1);
    const [note, setNote] = useState('');
    const [selectedVariant, setSelectedVariant] = useState('');

    useEffect(() => {
        if (product) {
            setQuantity(1);
            setNote('');
            setSelectedVariants([]); 
        }
    }, [product]);

    if (!product) return null;

    const handleAdd = () => {
        // Langsung kirim 4 parameter dengan rapi tanpa variabel nganggur
        onAddToCart(product, quantity, note, selectedVariants);
    };

    const getImageUrl = (url) => {
        if (!url) return 'https://placehold.co/400x300?text=No+Image';
        if (typeof url !== 'string') return url;
        return url.replace(/^http:\/\/(127\.0\.0\.1|localhost):8000/, '');
    };

    const totalPrice = (Number(product.price) || 0) * quantity;

    const rawVariants = product.variants || '';
    const quickVariants = rawVariants
        ? rawVariants.split(',').map(v => v.trim()).filter(Boolean)
        : [];

    const toggleVariant = (variant) => {
        if (selectedVariants.includes(variant)) {
            setSelectedVariants(selectedVariants.filter(v => v !== variant));
        } else {
            setSelectedVariants([...selectedVariants, variant]);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 transition-opacity">
            <div className="bg-white w-full sm:max-w-md h-full sm:h-[85vh] rounded-none sm:rounded-3xl overflow-hidden shadow-2xl relative flex flex-col">

                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 z-20 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="overflow-y-auto flex-1 no-scrollbar">
                    <div className="h-56 sm:h-60 bg-slate-100 relative shrink-0">
                        <img
                            src={getImageUrl(product.image)}
                            alt={product.name}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    <div className="p-5">
                        <div className="flex justify-between items-start mb-2">
                            <h2 className="text-lg sm:text-xl font-bold text-slate-800 leading-tight pr-3">
                                {product.name}
                            </h2>
                            <span className="text-base sm:text-lg font-black text-emerald-600 whitespace-nowrap">
                                Rp {Number(product.price || 0).toLocaleString('id-ID')}
                            </span>
                        </div>

                        <p className="text-sm text-slate-500 mb-5 leading-relaxed">
                            {product.description || 'Deskripsi menu tidak tersedia'}
                        </p>

                        <div>
                            {quickVariants.length > 0 && (
                                <>
                                    <label className="text-xs font-bold text-slate-700 block mb-2">
                                        Pilihan / Varian (Opsional)
                                    </label>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {quickVariants.map((variant, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => toggleVariant(variant)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${selectedVariants.includes(variant)
                                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                                    }`}
                                            >
                                                {variant}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}

                            <label className="text-xs font-bold text-slate-700 block mb-2">
                                Catatan Tambahan
                            </label>
                            <textarea
                                rows="2"
                                placeholder="Contoh: Tanpa bawang, pedas banget, dll"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                            ></textarea>
                        </div>
                    </div>
                </div>

                <div className="p-4 sm:p-5 bg-white border-t border-slate-100 flex items-center gap-3 shrink-0 shadow-lg">
                    <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
                        <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-slate-700 shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
                        >
                            <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-10 text-center font-bold text-base text-slate-800">
                            {quantity}
                        </span>
                        <button
                            onClick={() => setQuantity(quantity + 1)}
                            className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-slate-700 shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    <button
                        onClick={handleAdd}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold py-3.5 px-4 text-sm rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex justify-between items-center"
                    >
                        <span>Tambah Pesanan</span>
                        <span>Rp {totalPrice.toLocaleString('id-ID')}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}