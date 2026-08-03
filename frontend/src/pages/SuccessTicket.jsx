import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Home, Receipt, ShoppingBag, MapPin, Calendar, Copy, Check, QrCode } from 'lucide-react';

export default function SuccessTicket() {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state?.order;

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    localStorage.removeItem('gobi_cart');
  }, []);

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <p className="text-slate-600 mb-4">Tiket tidak ditemukan.</p>
        <button onClick={() => navigate('/')} className="bg-emerald-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm">Kembali ke Menu</button>
      </div>
    );
  }

  const formattedDate = new Date(order.created_at || Date.now()).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(order.order_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 flex flex-col items-center justify-center">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden border border-slate-200">
        
        <div className="bg-emerald-600 p-6 text-white text-center space-y-2 relative">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2 backdrop-blur-sm">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">Pesanan Diterima!</h1>
          {/* KONSEP PESAN ANTAR (DELIVERY) DIUBAH DISINI */}
          <p className="text-emerald-100 text-sm font-medium">Santai di kelas, makananmu sedang disiapkan & akan segera diantar.</p>
        </div>

        <div className="bg-emerald-50 p-5 border-b border-dashed border-emerald-200 text-center relative">
          <span className="text-xs uppercase tracking-wider font-semibold text-emerald-800 block mb-2">Nomor Pesanan</span>
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl font-black text-emerald-600 font-mono tracking-widest">{order.order_number}</span>
            <button 
              onClick={handleCopy} 
              className="p-2 bg-emerald-200/50 hover:bg-emerald-200 text-emerald-700 rounded-lg transition-all"
              title="Salin Nomor Pesanan"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          {copied && <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">Tersalin!</span>}
        </div>

        <div className="p-6 space-y-4 text-sm text-slate-700">
          
          {/* TAMPILAN QRIS JIKA METODE PEMBAYARANNYA QRIS */}
          {order.payment_method === 'QRIS' && (
            <div className="bg-white p-5 rounded-2xl border-2 border-emerald-100 flex flex-col items-center text-center space-y-3 mb-4 shadow-sm">
               <div className="flex items-center justify-center gap-2 text-emerald-700 font-bold mb-1">
                  <QrCode className="w-5 h-5" /> Scan QRIS di Bawah
               </div>
               {/* Ini Dummy QRIS - Nanti bisa diganti dengan image URL dari backend payment gateway */}
               <div className="p-2 bg-white border border-slate-200 rounded-xl inline-block">
                 <img src="https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg" alt="Barcode QRIS" className="w-40 h-40 object-contain" />
               </div>
               <p className="text-xs text-slate-500 font-medium">Pesananmu akan mulai dimasak setelah pembayaran terverifikasi.</p>
            </div>
          )}

          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <span className="text-slate-500 text-xs flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Waktu Pesan</span>
            <span className="font-semibold text-xs">{formattedDate}</span>
          </div>

          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <span className="text-slate-500 text-xs flex items-center gap-1.5"><Receipt className="w-4 h-4" /> Pemesan</span>
            <span className="font-semibold">{order.customer_name}</span>
          </div>

          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <span className="text-slate-500 text-xs flex items-center gap-1.5"><MapPin className="w-4 h-4" /> Diantar ke</span>
            <span className="font-semibold bg-slate-100 px-2.5 py-1 rounded-md text-slate-800">{order.class_room?.name || 'Kelas'}</span>
          </div>

          <div className="pt-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><ShoppingBag className="w-4 h-4" /> Daftar Pesanan</p>
            <div className="space-y-2 bg-slate-50 p-3 rounded-2xl">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{item.qty}x</span> {item.product?.name || 'Item'}
                    {item.note && <p className="text-[10px] text-amber-600 italic mt-0.5">Catatan: {item.note}</p>}
                  </div>
                  <span className="font-semibold text-slate-700">Rp {(item.price * item.qty).toLocaleString('id-ID')}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 space-y-1.5">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Metode Pembayaran</span>
              <span className="font-bold text-emerald-700">{order.payment_method}</span>
            </div>

            {order.payment_method === 'CASH' && (
              <>
                <div className="flex justify-between text-xs text-slate-500"><span>Uang Tunai Disiapkan</span><span>Rp {parseFloat(order.cash_amount).toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between text-xs text-slate-500"><span>Kembalian dari Kurir</span><span>Rp {parseFloat(order.change_amount).toLocaleString('id-ID')}</span></div>
              </>
            )}

            <div className="flex justify-between text-base font-bold text-slate-800 pt-2 border-t border-slate-100">
              <span>Total Tagihan</span>
              <span className="text-emerald-600">Rp {parseFloat(order.total_amount).toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100">
          <button onClick={() => navigate('/')} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-md">
            <Home className="w-4 h-4" /> Kembali ke Menu Utama
          </button>
        </div>

      </div>
    </div>
  );
}