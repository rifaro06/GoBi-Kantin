import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, Search, Clock, CheckCircle2, ChefHat, Bike, AlertCircle,
  Loader2, X, QrCode, MapPin, User, Phone, ShoppingBag, Receipt, Copy, Check, ChevronRight, MessageCircle
} from 'lucide-react';

const ADMIN_WA_NUMBER = "62881025337675";

const formatRupiah = (num) => Number(num || 0).toLocaleString('id-ID');

export default function OrderStatus() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [copied, setCopied] = useState(false);
  const [globalQrisUrl, setGlobalQrisUrl] = useState('');

  // Ambil URL QRIS terbaru dari Admin secara otomatis
  useEffect(() => {
    axios.get('/settings')
      .then(res => {
        const data = res.data.data || res.data;
        if (data?.qris_image_url) {
          setGlobalQrisUrl(data.qris_image_url);
        }
      })
      .catch(err => console.error('Gagal memuat settings QRIS:', err));
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setHasSearched(true);
    setOrders([]);

    try {
      const response = await axios.get(`/orders/track?query=${encodeURIComponent(searchQuery.trim())}`);
      setOrders(response.data.data || []);
    } catch (error) {
      console.error("Gagal mengambil data pesanan", error);

      // Dummy data pengujian jika backend offline / test
      if (searchQuery === '089673746693' || searchQuery.toUpperCase().startsWith('GB-')) {
        setOrders([
          {
            id: 1,
            order_number: 'GB-KWP8V',
            customer_name: 'owo',
            customer_phone: '089673746693',
            class_room: { name: 'Kelas VIII - A' },
            total_amount: 9000,
            delivery_fee: 1000,
            status: 'DIPROSES',
            payment_method: 'CASH',
            payment_status: 'PAID',
            created_at: '2026-08-07T05:50:00Z',
            items: [
              { product: { name: 'Indomie Goreng Special (Telur Rebus & Sayur)' }, qty: 1, price: 8000, note: '' }
            ]
          },
          {
            id: 2,
            order_number: 'GB-IPKIJ',
            customer_name: 'owo',
            customer_phone: '089673746693',
            class_room: { name: 'Kelas VIII - A' },
            total_amount: 7000,
            delivery_fee: 1000,
            status: 'SELESAI',
            payment_method: 'CASH',
            payment_status: 'PAID',
            created_at: '2026-08-07T04:53:00Z',
            items: [
              { product: { name: 'Es Teh Manis Jumbo' }, qty: 2, price: 3000, note: 'Es sedikit' }
            ]
          }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return { icon: <Clock className="w-4 h-4" />, color: 'bg-amber-50 text-amber-700 border-amber-200', text: 'Menunggu' };
      case 'DIPROSES':
        return { icon: <ChefHat className="w-4 h-4" />, color: 'bg-blue-50 text-blue-700 border-blue-200', text: 'Dimasak' };
      case 'DIANTAR':
        return { icon: <Bike className="w-4 h-4" />, color: 'bg-purple-50 text-purple-700 border-purple-200', text: 'Sedang Diantar' };
      case 'SELESAI':
        return { icon: <CheckCircle2 className="w-4 h-4" />, color: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'Selesai' };
      default:
        return { icon: <AlertCircle className="w-4 h-4" />, color: 'bg-slate-100 text-slate-700 border-slate-200', text: status || 'Unknown' };
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppConfirm = () => {
    if (!selectedOrder) return;
    const className = selectedOrder.class_room?.name || 'Kelas';
    const totalFormatted = formatRupiah(selectedOrder.total_amount);

    const textMessage =
      `Halo Admin GoBi Kantin, saya ingin konfirmasi pembayaran QRIS.

*Detail Pesanan:*
• Nomor Pesanan: *${selectedOrder.order_number}*
• Nama Pemesan: *${selectedOrder.customer_name}*
• Diantar ke: *${className}*
• Total Tagihan: *Rp ${totalFormatted}*

Berikut saya lampirkan foto/screenshot bukti pembayaran QRIS. Terima kasih!`;

    window.open(`https://wa.me/${ADMIN_WA_NUMBER}?text=${encodeURIComponent(textMessage)}`, '_blank');
  };

  const handleWhatsAppContact = () => {
    if (!selectedOrder) return;
    const className = selectedOrder.class_room?.name || 'Kelas';
    const statusText = getStatusBadge(selectedOrder.status).text;
    const paymentText = selectedOrder.payment_status === 'PAID' ? 'Lunas' : 'Belum Dibayar';

    const textMessage =
      `Halo Admin GoBi Kantin, saya ingin menanyakan perkembangan pesanan saya.

*Detail Pesanan:*
• Nomor Pesanan: *${selectedOrder.order_number}*
• Nama Pemesan: *${selectedOrder.customer_name}*
• Diantar ke: *${className}*
• Status Pesanan: *${statusText}*
• Status Pembayaran: *${paymentText}*

Ada yang ingin saya tanyakan terkait pesanan ini. Terima kasih!`;

    window.open(`https://wa.me/${ADMIN_WA_NUMBER}?text=${encodeURIComponent(textMessage)}`, '_blank');
  };

  return (
    <div className="min-h-[100dvh] bg-slate-100/70 pb-16 font-sans">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-2xl transition-all text-slate-700 shrink-0"
              title="Kembali"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-black text-slate-800 tracking-tight">Lacak Pesanan</h1>
              <p className="text-xs text-slate-400 hidden sm:block">Pantau status pengantaran pesananmu secara akurat</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 md:pt-8 space-y-6">
        {/* Form Pencarian */}
        <div className="bg-white p-5 sm:p-7 md:p-8 rounded-3xl shadow-xs border border-slate-200/80 space-y-3 md:space-y-4">
          <div>
            <label className="text-xs sm:text-sm font-bold text-slate-600 uppercase tracking-wider block">
              Cari Berdasarkan No. HP / No. Pesanan
            </label>
            <p className="text-xs text-slate-400 mt-0.5 sm:block hidden">
              Masukkan nomor WhatsApp saat pesan atau kode transaksi (contoh: 089673746693 / GB-KWP8V)
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Nomor HP (0812...) atau Kode Pesanan (GB-...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-10 py-3.5 sm:py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all placeholder:font-normal placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={loading || !searchQuery.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white px-7 py-3.5 sm:py-4 rounded-2xl font-bold text-sm transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 shrink-0"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Search className="w-4 h-4" /> Cari Pesanan</>}
            </button>
          </form>
        </div>

        {/* Status Tidak Ditemukan */}
        {hasSearched && !loading && orders.length === 0 && (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-3">
            <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>
            <p className="text-slate-800 font-bold text-base">Pesanan Tidak Ditemukan</p>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
              Pastikan nomor pesanan atau nomor WhatsApp yang dimasukkan sudah benar.
            </p>
          </div>
        )}

        {/* Daftar Hasil Search */}
        {orders.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">
                Hasil Pencarian ({orders.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
              {orders.map((order) => {
                const badge = getStatusBadge(order.status);
                return (
                  <div
                    key={order.id}
                    className="bg-white p-5 sm:p-6 rounded-3xl shadow-xs border border-slate-200/80 space-y-4 hover:border-emerald-400 transition-all flex flex-col justify-between"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <p className="font-mono font-black text-slate-800 text-lg sm:text-xl tracking-wider">
                          {order.order_number}
                        </p>
                        <p className="text-xs text-slate-400 font-medium mt-1">
                          {new Date(order.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <span className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border shrink-0 ${badge.color}`}>
                        {badge.icon} {badge.text}
                      </span>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] sm:text-xs text-slate-400 block font-bold uppercase tracking-wider">
                          Total Tagihan
                        </span>
                        <span className="font-black text-emerald-600 text-base sm:text-lg">
                          Rp {formatRupiah(order.total_amount)}
                        </span>
                      </div>

                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs sm:text-sm font-bold px-4 py-3 rounded-2xl transition-all shadow-xs flex items-center gap-1.5"
                      >
                        Detail Pesanan <ChevronRight className="w-4 h-4 text-slate-300" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Modal Detail Pesanan */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md sm:max-w-lg rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-slate-100 transition-all">

            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-base sm:text-lg font-bold text-slate-800">Detail Pesanan</h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Modal */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm text-slate-700">

              {/* Box Nomor Pesanan */}
              <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] sm:text-xs text-emerald-800 uppercase font-bold tracking-wider block mb-0.5">
                    Nomor Pesanan
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-emerald-700 font-mono tracking-wider">
                    {selectedOrder.order_number}
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(selectedOrder.order_number)}
                  className="p-2.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-xl transition-all active:scale-95 flex items-center gap-1.5 text-xs font-bold"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Tersalin' : 'Salin'}
                </button>
              </div>

              {/* Status Pesanan */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs sm:text-sm text-slate-500 font-medium">Status Pesanan</span>
                <span className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 border ${getStatusBadge(selectedOrder.status).color}`}>
                  {getStatusBadge(selectedOrder.status).icon} {getStatusBadge(selectedOrder.status).text}
                </span>
              </div>

              {/* Tombol Chat WA Jika Diproses / Belum Selesai */}
              {(selectedOrder.status === 'DIPROSES' || (selectedOrder.payment_status === 'PAID' && selectedOrder.status !== 'SELESAI')) && (
                <div className="bg-emerald-50/90 border border-emerald-200/80 p-3.5 rounded-2xl flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="font-bold text-emerald-900 text-xs sm:text-sm">Pesanan Sedang Diproses</p>
                    <p className="text-[11px] sm:text-xs text-emerald-700">Ada kendala? Hubungi kantin via WhatsApp.</p>
                  </div>
                  <button
                    onClick={handleWhatsAppContact}
                    type="button"
                    className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold py-2 px-3.5 rounded-xl flex items-center gap-1.5 transition-all text-xs shrink-0 shadow-sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Chat WA</span>
                  </button>
                </div>
              )}

              {/* QRIS & WA Confirm jika UNPAID */}
              {selectedOrder.payment_method === 'QRIS' && selectedOrder.payment_status === 'UNPAID' && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-center space-y-3">
                  <div className="flex items-center justify-center gap-1.5 text-amber-800 font-bold text-xs sm:text-sm">
                    <QrCode className="w-5 h-5" /> Scan QRIS Pembayaran
                  </div>
                  <div className="p-2.5 bg-white border border-amber-200/80 rounded-2xl inline-block shadow-xs max-w-[180px]">
                    <img
                      src={selectedOrder.qris_image_url || selectedOrder.qris_image || globalQrisUrl || "https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg"}
                      alt="Scan QRIS"
                      className="w-full h-auto object-contain rounded-lg"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg";
                      }}
                    />
                  </div>
                  <p className="text-xs text-amber-700 font-medium leading-relaxed">
                    Scan QRIS di atas untuk menyelesaikan pembayaran agar pesananmu segera diproses.
                  </p>

                  <button
                    onClick={handleWhatsAppConfirm}
                    type="button"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md text-xs mt-1"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Kirim Bukti Bayar via WA</span>
                  </button>
                </div>
              )}

              {/* Informasi Pengantaran */}
              <div className="space-y-2.5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" /> Informasi Pengantaran
                </p>
                <div className="bg-slate-50 p-4 rounded-2xl space-y-2.5 text-xs sm:text-sm border border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 flex items-center gap-2"><User className="w-4 h-4 text-slate-400" /> Nama Pemesan</span>
                    <span className="font-bold text-slate-800">{selectedOrder.customer_name || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400" /> No. Telepon</span>
                    <span className="font-bold text-slate-800">{selectedOrder.customer_phone || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-400" /> Diantar ke Kelas</span>
                    <span className="font-extrabold text-xs bg-slate-200/80 text-slate-800 px-3 py-1 rounded-lg">
                      {selectedOrder.class_room?.name || '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rincian Item */}
              <div className="space-y-2.5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-emerald-600" /> Rincian Item Pesanan
                </p>
                <div className="bg-slate-50 p-4 rounded-2xl space-y-2.5 border border-slate-100">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start text-xs sm:text-sm pb-2.5 border-b border-slate-200/60 last:border-0 last:pb-0">
                      <div className="pr-2">
                        <p className="font-extrabold text-slate-800">
                          {item.qty}x <span className="font-medium text-slate-700">{item.product?.name || item.name}</span>
                        </p>
                        {item.variant && (
                          <p className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200/60 rounded px-2 py-0.5 mt-1 inline-block mr-1">
                            <span className="font-bold">Varian:</span> {item.variant}
                          </p>
                        )}
                        {item.note && (
                          <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200/60 rounded px-2 py-0.5 mt-1 inline-block">
                            <span className="font-bold">Catatan:</span> {item.note}
                          </p>
                        )}
                      </div>
                      <span className="font-bold text-slate-800 shrink-0">
                        Rp {formatRupiah((item.price || 0) * (item.qty || 1))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ringkasan Pembayaran */}
              <div className="space-y-2 pt-2 border-t border-slate-200 text-xs sm:text-sm">
                <div className="flex justify-between text-slate-500">
                  <span className="flex items-center gap-1.5"><Receipt className="w-4 h-4 text-slate-400" /> Metode Pembayaran</span>
                  <span className="font-bold text-slate-800">{selectedOrder.payment_method}</span>
                </div>

                <div className="flex justify-between text-slate-500">
                  <span>Status Pembayaran</span>
                  <span className={`font-bold ${selectedOrder.payment_status === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {selectedOrder.payment_status === 'PAID' ? 'LUNAS' : 'BELUM DIBAYAR'}
                  </span>
                </div>

                {selectedOrder.delivery_fee > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Biaya Antar</span>
                    <span className="font-semibold text-slate-700">Rp {formatRupiah(selectedOrder.delivery_fee)}</span>
                  </div>
                )}

                <div className="flex justify-between text-base sm:text-lg font-bold text-slate-800 pt-3 border-t border-slate-100">
                  <span>Total Harga</span>
                  <span className="text-emerald-600 font-black">
                    Rp {formatRupiah(selectedOrder.total_amount)}
                  </span>
                </div>
              </div>

            </div>

            {/* Footer Modal */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 sticky bottom-0">
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-full bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-bold py-3.5 rounded-2xl transition-all text-sm shadow-md"
              >
                Tutup Detail
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}