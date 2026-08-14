import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  CheckCircle2, Home, Receipt, ShoppingBag, MapPin,
  Calendar, Copy, Check, QrCode, User
} from 'lucide-react';

export default function SuccessTicket() {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state?.order;

  const [copied, setCopied] = useState(false);
  const [globalQrisUrl, setGlobalQrisUrl] = useState('');

  // Nomor WA Admin Kantin
  const adminWhatsAppNumber = "62881025719124";

  useEffect(() => {
    localStorage.removeItem('gobi_cart');

    // Fetch QRIS terbaru dari database settings
    axios.get('/settings')
      .then(res => {
        const data = res.data.data || res.data;
        if (data.qris_image_url) {
          setGlobalQrisUrl(data.qris_image_url);
        }
      })
      .catch(err => console.error('Gagal memuat QRIS settings:', err));
  }, []);

  if (!order) {
    return (
      <div className="min-h-[100dvh] bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center max-w-sm w-full space-y-4">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <Receipt className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base">Tiket Tidak Ditemukan</h3>
            <p className="text-xs text-slate-400 mt-1">Data pesanan tidak tersedia atau sesi telah berakhir.</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-2xl text-sm transition-all shadow-md"
          >
            Kembali ke Menu
          </button>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(order.created_at || Date.now()).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(order.order_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppConfirm = () => {
    const className = order.class_room?.name || 'Kelas';
    const totalFormatted = parseFloat(order.total_amount || 0).toLocaleString('id-ID');

    const textMessage =
      `Halo Admin GoBi Kantin, saya ingin konfirmasi pembayaran QRIS.

*Detail Pesanan:*
• Nomor Pesanan: *${order.order_number}*
• Nama Pemesan: *${order.customer_name}*
• Diantar ke: *${className}*
• Total Tagihan: *Rp ${totalFormatted}*

Berikut saya lampirkan foto/screenshot bukti pembayaran QRIS. Terima kasih!`;

    const encodedText = encodeURIComponent(textMessage);
    window.open(`https://wa.me/${adminWhatsAppNumber}?text=${encodedText}`, '_blank');
  };

  // MENGAMBIL GAMBAR QRIS DINAMIS
  const qrisImageUrl = order?.qris_image_url || order?.qris_image || globalQrisUrl || 'https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg';

  return (
    <div className="min-h-[100dvh] bg-slate-100/80 sm:bg-slate-100 py-4 sm:py-8 px-3 sm:px-6 flex flex-col items-center justify-center font-sans">

      {/* TIKET STRUK UTAMA */}
      <div className="bg-white w-full max-w-md rounded-3xl shadow-xl shadow-slate-200/80 overflow-hidden border border-slate-200/80 transition-all">

        {/* HEADER HIJAU GRADIENT */}
        <div className="bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-700 p-6 text-white text-center space-y-2 relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="absolute -left-8 -bottom-8 w-28 h-28 bg-emerald-400/20 rounded-full blur-xl pointer-events-none" />

          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-md border border-white/20 shadow-inner">
            <CheckCircle2 className="w-8 h-8 text-white drop-shadow-sm" />
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight">Pesanan Diterima!</h1>
          <p className="text-emerald-100 text-xs sm:text-sm font-medium leading-relaxed max-w-xs mx-auto">
            Santai di kelas, makananmu sedang disiapkan & akan segera diantar.
          </p>
        </div>

        {/* SECTION NOMOR PESANAN */}
        <div className="bg-emerald-50/70 p-4 sm:p-5 border-b border-dashed border-emerald-200/80 text-center relative">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block mb-1.5">
            Nomor Pesanan
          </span>

          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono tracking-wider">
              {order.order_number}
            </span>
            <button
              onClick={handleCopy}
              className="p-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-xl transition-all shadow-xs active:scale-95 flex items-center justify-center shrink-0"
              title="Salin Nomor Pesanan"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {copied && (
            <span className="inline-block mt-2 text-[10px] font-extrabold text-emerald-700 bg-emerald-200/80 px-2.5 py-0.5 rounded-full animate-fade-in">
              Nomor Pesanan Tersalin!
            </span>
          )}
        </div>

        {/* DETAIL TRANSAKSI */}
        <div className="p-5 sm:p-6 space-y-4 text-xs sm:text-sm text-slate-700">

          {/* BANNER QRIS DINAMIS (JIKA METODE PAYMENT = QRIS) */}
          {order.payment_method === 'QRIS' && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col items-center text-center space-y-3 mb-2 shadow-xs">
              <div className="flex items-center justify-center gap-1.5 text-emerald-700 font-bold text-xs">
                <QrCode className="w-4 h-4" /> Scan QRIS Pembayaran
              </div>
              <div className="p-2.5 bg-white border border-slate-200 rounded-2xl shadow-sm max-w-[200px]">
                <img
                  src={qrisImageUrl}
                  alt="QRIS Pembayaran"
                  className="w-full h-auto max-h-48 object-contain rounded-lg"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg";
                  }}
                />
              </div>
              <p className="text-[11px] text-slate-500 font-medium max-w-xs">
                Silakan selesaikan pembayaran. Pesanan diproses setelah pembayaran diverifikasi.
              </p>

              {/* TOMBOL KONFIRMASI WA */}
              <button
                onClick={handleWhatsAppConfirm}
                type="button"
                className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20 text-xs mt-1"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984 0 1.758.459 3.474 1.33 4.982l-1.413 5.161 5.282-1.385a9.924 9.924 0 004.789 1.226h.005c5.504 0 9.987-4.478 9.988-9.984 0-2.668-1.039-5.176-2.926-7.062a9.925 9.925 0 00-7.064-2.922zm5.828 14.175c-.244.688-1.427 1.314-1.968 1.378-.512.062-1.183.088-3.414-.834-2.853-1.178-4.689-4.082-4.832-4.272-.143-.19-1.161-1.545-1.161-2.946 0-1.401.734-2.091.995-2.378.261-.287.568-.359.758-.359.19 0 .38.002.545.009.176.008.414-.067.647.493.244.588.831 2.029.903 2.176.072.147.12.32.024.512-.096.191-.144.31-.287.48-.143.17-.301.38-.43.51-.143.143-.292.298-.126.583.167.285.741 1.223 1.589 1.979 1.091.972 2.011 1.274 2.296 1.417.285.143.452.119.619-.071.167-.19.714-.832.905-1.118.19-.286.38-.238.642-.143.262.095 1.666.786 1.952.929.285.143.476.214.547.333.071.119.071.688-.173 1.376z" />
                </svg>
                <span>Kirim Bukti Bayar via WA</span>
              </button>
            </div>
          )}

          {/* INFORMASI WAKTU & PEMESAN */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
              <span className="text-slate-500 text-xs flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Waktu Pesan
              </span>
              <span className="font-semibold text-xs text-slate-800">{formattedDate}</span>
            </div>

            <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
              <span className="text-slate-500 text-xs flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" /> Pemesan
              </span>
              <span className="font-bold text-slate-800">{order.customer_name}</span>
            </div>

            <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
              <span className="text-slate-500 text-xs flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> Diantar ke
              </span>
              <span className="font-extrabold text-xs bg-slate-100 text-slate-800 border border-slate-200 px-3 py-1 rounded-xl">
                {order.class_room?.name || 'Kelas'}
              </span>
            </div>
          </div>

          {/* DAFTAR ITEMS */}
          <div className="pt-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" /> Daftar Pesanan
            </p>

            <div className="space-y-2 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start text-xs border-b border-slate-100 last:border-0 pb-2 last:pb-0">
                  <div className="pr-2">
                    <span className="font-extrabold text-slate-800">{item.qty}x</span>{' '}
                    <span className="font-medium text-slate-700">{item.product?.name || 'Item'}</span>
                    {item.note && (
                      <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200/60 rounded-md px-2 py-0.5 mt-1 inline-block">
                        <span className="font-bold">Catatan:</span> {item.note}
                      </p>
                    )}
                  </div>
                  <span className="font-bold text-slate-800 shrink-0">
                    Rp {((item.price || 0) * (item.qty || 1)).toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* RINCIAN PEMBAYARAN */}
          <div className="pt-2 border-t border-slate-200 space-y-2">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Metode Pembayaran</span>
              <span className="font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                {order.payment_method}
              </span>
            </div>

            {order.payment_method === 'CASH' && (
              <>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Uang Tunai Disiapkan</span>
                  <span className="font-semibold text-slate-700">
                    Rp {parseFloat(order.cash_amount || 0).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Kembalian dari Kurir</span>
                  <span className="font-semibold text-slate-700">
                    Rp {parseFloat(order.change_amount || 0).toLocaleString('id-ID')}
                  </span>
                </div>
              </>
            )}

            {order.delivery_fee > 0 && (
              <div className="flex justify-between text-xs text-slate-500">
                <span>Biaya Antar</span>
                <span className="font-semibold text-slate-700">
                  Rp {parseFloat(order.delivery_fee).toLocaleString('id-ID')}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center text-sm font-bold text-slate-800 pt-2.5 border-t border-slate-100">
              <span>Total Tagihan</span>
              <span className="text-base font-black text-emerald-600">
                Rp {parseFloat(order.total_amount || 0).toLocaleString('id-ID')}
              </span>
            </div>
          </div>

        </div>

        {/* FOOTER BUTTON */}
        <div className="p-4 sm:p-5 bg-slate-50/80 border-t border-slate-100">
          <button
            onClick={() => navigate('/')}
            className="w-full bg-slate-800 hover:bg-slate-900 active:scale-[0.99] text-white font-bold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 text-xs sm:text-sm shadow-md shadow-slate-900/10"
          >
            <Home className="w-4 h-4" /> Kembali ke Menu Utama
          </button>
        </div>

      </div>
    </div>
  );
}