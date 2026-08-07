import React from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';

export default function FloatingCart({ cart = [], onCheckoutClick }) {
  if (!cart || cart.length === 0) return null;

  const totalItems = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
  const totalPrice = cart.reduce((sum, item) => sum + ((Number(item.price) || 0) * (item.qty || 1)), 0);

  return (
    <div className="fixed bottom-4 inset-x-0 z-40 px-4 sm:px-6 pointer-events-none">
      <div className="max-w-2xl mx-auto pointer-events-auto">
        <div className="bg-slate-900 text-white p-3.5 sm:p-4 rounded-3xl shadow-2xl border border-slate-800 flex items-center justify-between gap-3 backdrop-blur-md">
          
          {/* Sisi Kiri: Informasi Item & Total Harga */}
          <div className="flex items-center gap-3 pl-1">
            <div className="relative w-11 h-11 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md">
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-slate-950 text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900 shadow-sm">
                {totalItems}
              </span>
            </div>

            <div>
              <p className="text-[11px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">
                {totalItems} Menu dipesan
              </p>
              <p className="text-base sm:text-lg font-black text-emerald-400">
                Rp {totalPrice.toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          {/* Sisi Kanan: Tombol Checkout */}
          <button
            onClick={onCheckoutClick}
            className="bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black px-5 py-3 sm:px-6 sm:py-3.5 rounded-2xl text-xs sm:text-sm transition-all shadow-lg flex items-center gap-2 shrink-0"
          >
            <span>Lanjut Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>

        </div>
      </div>
    </div>
  );
}