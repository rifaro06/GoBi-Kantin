import React, { useState, useEffect } from 'react';
import { X, Plus, Minus } from 'lucide-react';

export default function ProductModal({ product, onClose, onAddToCart }) {
    const [quantity, setQuantity] = useState(1);
    const [note, setNote] = useState('');

    // Reset form setiap kali modal dibuka untuk produk yang berbeda
    useEffect(() => {
        if (product) {
            setQuantity(1);
            setNote('');
        }
    }, [product]);

    if (!product) return null;

    const handleAdd = () => {
        // INI KUNCINYA: Lempar product, quantity, dan note ke Catalog
        onAddToCart(product, quantity, note);
    };

    const getImageUrl = (url) => {
        if (!url) return 'https://placehold.co/400x300?text=No+Image';
        if (typeof url !== 'string') return url;
        return url.replace(/^http:\/\/(127\.0\.0\.1|localhost):8000/, '');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 transition-opacity">
            <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl relative animate-slide-up">

                {/* Tombol Close */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 bg-black/40 text-white rounded-full hover:bg-black/60 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>


                {/* Gambar Produk */}
                <div className="h-48 sm:h-56 bg-slate-100 relative">
                    <img
                        src={getImageUrl(product.image)}
                        alt={product.name}
                        className="w-full h-full object-cover"
                    />
                </div>

                <div className="p-5">
                    {/* Info Produk */}
                    <div className="flex justify-between items-start mb-2">
                        <h2 className="text-xl font-bold text-slate-800 leading-tight pr-4">{product.name}</h2>
                        <span className="text-lg font-black text-emerald-600 whitespace-nowrap">
                            Rp {product.price.toLocaleString('id-ID')}
                        </span>
                    </div>
                    <p className="text-sm text-slate-500 mb-5 line-clamp-2">
                        {product.description || 'Deskripsi menu tidak tersedia'}
                    </p>

                    {/* Input Catatan */}
                    <div className="mb-6">
                        <label className="text-xs font-bold text-slate-700 block mb-2">Catatan Pesanan (Opsional)</label>
                        <textarea
                            rows="2"
                            placeholder="Contoh: Pedas, tanpa bawang, dll"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                        ></textarea>
                    </div>

                    {/* Footer: Quantity & Tambah */}
                    <div className="flex items-center gap-4 mt-2">
                        {/* Kontrol Quantity */}
                        <div className="flex items-center bg-slate-100 rounded-2xl p-1.5 border border-slate-200">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-700 shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-12 text-center font-bold text-base text-slate-800">{quantity}</span>
                            <button
                                onClick={() => setQuantity(quantity + 1)}
                                className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-700 shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Tombol Tambah ke Keranjang */}
                        <button
                            onClick={handleAdd}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
                        >
                            Tambah Pesanan
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}