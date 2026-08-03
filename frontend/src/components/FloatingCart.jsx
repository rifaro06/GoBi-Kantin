export default function FloatingCart({ cart, onCheckoutClick }) {
    if (cart.length === 0) return null;

    const totalItem = cart.reduce((sum, item) => sum + item.qty, 0);
    const totalHarga = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    return (
        <div className="fixed bottom-0 left-0 w-full z-40 flex justify-center bg-linear-to-t from-white via-white to-transparent pb-4 pt-6 px-4">
            <div className="max-w-md w-full">
                <button onClick={onCheckoutClick} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl p-4 flex justify-between items-center shadow-lg transition-all">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <span className="text-2xl">🛍️</span>
                            <span className="absolute -top-1 -right-2 bg-amber-400 text-emerald-900 text-[11px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-emerald-600">{totalItem}</span>
                        </div>
                        <div className="text-left leading-tight">
                            <p className="text-[11px] font-medium text-emerald-100">Total Pembayaran</p>
                            <p className="font-bold text-amber-300">Rp{totalHarga.toLocaleString('id-ID')}</p>
                        </div>
                    </div>
                    <div className="font-black text-sm tracking-wide bg-emerald-700 px-4 py-2 rounded-lg">CHECK OUT</div>
                </button>
            </div>
        </div>
    );
}