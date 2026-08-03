import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, Search, Clock, CheckCircle2, ChefHat, Bike, AlertCircle, 
  Loader2, X, QrCode, MapPin, User, Phone, ShoppingBag, Receipt, Copy, Check, ChevronRight 
} from 'lucide-react';

export default function OrderStatus() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  
  // State untuk menyimpan data pesanan yang sedang dibuka detailnya
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setHasSearched(true);
    setOrders([]);

    try {
      // PANGGULAN API BACKEND (Ganti URL sesuai kebutuhan)
      const response = await axios.get(`http://127.0.0.1:8000/api/orders/track?query=${searchQuery}`);
      setOrders(response.data.data || []);
    } catch (error) {
      console.error("Gagal mengambil data pesanan", error);
      
      // DUMMY DATA SEMENTARA (Untuk Pengetesan Frontend)
      if (searchQuery === '08123456789' || searchQuery.toUpperCase().startsWith('GB-')) {
        setOrders([
          { 
            id: 1, 
            order_number: 'GB-QKQCJ', 
            customer_name: 'Budi Santoso',
            customer_phone: '08123456789',
            class_room: { name: 'XII IPA 2' },
            total_amount: 15000, 
            status: 'DIANTAR', 
            payment_method: 'QRIS',
            payment_status: 'PAID', // Sudah lunas
            created_at: new Date().toISOString(), 
            items: [
              { product: { name: 'Ayam Geprek' }, qty: 1, price: 15000, note: 'Sambal dipisah ya min' }
            ] 
          },
          { 
            id: 2, 
            order_number: 'GB-XYZ12', 
            customer_name: 'Budi Santoso',
            customer_phone: '08123456789',
            class_room: { name: 'XII IPA 2' },
            total_amount: 12000, 
            status: 'PENDING', 
            payment_method: 'QRIS',
            payment_status: 'UNPAID', // Belum lunas -> Akan memicu tampilnya QRIS
            created_at: new Date(Date.now() - 3600000).toISOString(), 
            items: [
              { product: { name: 'Es Teh Manis' }, qty: 2, price: 3000, note: 'Es nya sedikit saja' },
              { product: { name: 'Roti Bakar Cokelat' }, qty: 1, price: 6000, note: '' }
            ] 
          }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status?.toUpperCase()) {
      case 'PENDING': return { icon: <Clock className="w-4 h-4" />, color: 'bg-amber-100 text-amber-700 border-amber-200', text: 'Menunggu' };
      case 'DIPROSES': return { icon: <ChefHat className="w-4 h-4" />, color: 'bg-blue-100 text-blue-700 border-blue-200', text: 'Dimasak' };
      case 'DIANTAR': return { icon: <Bike className="w-4 h-4" />, color: 'bg-purple-100 text-purple-700 border-purple-200', text: 'Sedang Diantar' };
      case 'SELESAI': return { icon: <CheckCircle2 className="w-4 h-4" />, color: 'bg-emerald-100 text-emerald-700 border-emerald-200', text: 'Selesai' };
      default: return { icon: <AlertCircle className="w-4 h-4" />, color: 'bg-slate-100 text-slate-700 border-slate-200', text: status || 'Unknown' };
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12 font-sans">
      
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <h1 className="text-xl font-bold text-slate-800">Lacak Pesanan</h1>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 pt-6 space-y-6">
        
        {/* Form Pencarian */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200">
          <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Cari berdasarkan No. HP / No. Pesanan</label>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="0812... atau GB-..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button type="submit" disabled={loading || !searchQuery} className="bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white px-5 rounded-xl font-bold transition-colors flex items-center justify-center">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Cari'}
            </button>
          </form>
        </div>

        {/* Hasil Pencarian Kosong */}
        {hasSearched && !loading && orders.length === 0 && (
          <div className="text-center py-10 bg-white rounded-3xl border border-slate-200 p-6">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-600 font-bold text-sm">Pesanan tidak ditemukan</p>
            <p className="text-xs text-slate-400 mt-1">Pastikan nomor pesanan atau nomor telepon yang dimasukkan sudah benar.</p>
          </div>
        )}

        {/* Daftar Kartu Pesanan Ringkas */}
        {orders.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Riwayat Pesanan ({orders.length})</h2>
            
            {orders.map((order) => {
              const badge = getStatusBadge(order.status);
              return (
                <div key={order.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 space-y-4">
                  
                  {/* Header Ringkas Kartu */}
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-black text-slate-800 text-lg">{order.order_number}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${badge.color}`}>
                      {badge.icon} {badge.text}
                    </span>
                  </div>

                  {/* Ringkasan Total & Tombol Detail */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400 block font-medium">Total Tagihan</span>
                      <span className="font-extrabold text-slate-800 text-base">Rp {Number(order.total_amount).toLocaleString('id-ID')}</span>
                    </div>

                    <button 
                      onClick={() => setSelectedOrder(order)}
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1"
                    >
                      Detail Pesanan <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* MODAL POP-UP DETAIL PESANAN */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-[2.5rem] sm:rounded-4xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col animate-slide-up">
            
            {/* Header Modal */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-slate-800">Detail Pesanan</h2>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-slate-100 text-slate-500 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Isi Konten Detail (Scrollable) */}
            <div className="p-6 overflow-y-auto space-y-6 text-slate-700">
              
              {/* Box Nomor Pesanan & Copy */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block">Nomor Pesanan</span>
                  <span className="text-xl font-black text-slate-800 font-mono">{selectedOrder.order_number}</span>
                </div>
                <button 
                  onClick={() => handleCopy(selectedOrder.order_number)}
                  className="p-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 transition-colors flex items-center gap-1 text-xs font-semibold"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Tersalin' : 'Salin'}
                </button>
              </div>

              {/* DUA KONDISI QRIS: Muncul jika QRIS dan BELUM DIBAYAR */}
              {selectedOrder.payment_method === 'QRIS' && selectedOrder.payment_status === 'UNPAID' && (
                <div className="bg-amber-50 border-2 border-amber-200 p-5 rounded-2xl text-center space-y-3">
                  <div className="flex items-center justify-center gap-2 text-amber-800 font-bold text-sm">
                    <QrCode className="w-5 h-5" /> Pembayaran QRIS Belum Selesai
                  </div>
                  <div className="p-2 bg-white border border-amber-200 rounded-xl inline-block shadow-sm">
                    <img 
                      src="https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg" 
                      alt="Scan QRIS" 
                      className="w-44 h-44 object-contain"
                    />
                  </div>
                  <p className="text-xs text-amber-700">Scan QRIS di atas untuk menyelesaikan pembayaran agar pesananmu segera diproses.</p>
                </div>
              )}

              {/* Status Pesanan */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs text-slate-500 font-medium">Status Pesanan</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${getStatusBadge(selectedOrder.status).color}`}>
                  {getStatusBadge(selectedOrder.status).icon} {getStatusBadge(selectedOrder.status).text}
                </span>
              </div>

              {/* Detail Pengantaran */}
              <div className="space-y-3 pt-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-500" /> Informasi Pengantaran
                </p>
                <div className="bg-slate-50 p-4 rounded-2xl space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 flex items-center gap-1"><User className="w-3.5 h-3.5" /> Nama Pemesan</span>
                    <span className="font-bold text-slate-800">{selectedOrder.customer_name || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> No. Telepon</span>
                    <span className="font-bold text-slate-800">{selectedOrder.customer_phone || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Diantar ke Kelas</span>
                    <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">{selectedOrder.class_room?.name || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Rincian Items */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-slate-500" /> Rincian Item Pesanan
                </p>
                <div className="bg-slate-50 p-4 rounded-2xl space-y-3">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start text-xs pb-2 border-b border-slate-200/60 last:border-0 last:pb-0">
                      <div>
                        <p className="font-bold text-slate-800">{item.qty}x {item.product?.name || item.name}</p>
                        {item.note && <p className="text-[11px] text-amber-600 italic mt-0.5">Catatan: {item.note}</p>}
                      </div>
                      <span className="font-semibold text-slate-700">Rp {(item.price * item.qty).toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ringkasan Pembayaran */}
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span className="flex items-center gap-1"><Receipt className="w-3.5 h-3.5" /> Metode Pembayaran</span>
                  <span className="font-bold text-slate-800">{selectedOrder.payment_method}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Status Pembayaran</span>
                  <span className={`font-bold ${selectedOrder.payment_status === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {selectedOrder.payment_status === 'PAID' ? 'LUNAS' : 'BELUM DIBAYAR'}
                  </span>
                </div>
                <div className="flex justify-between text-base font-black text-slate-800 pt-2 border-t border-slate-100">
                  <span>Total Harga</span>
                  <span className="text-emerald-600">Rp {Number(selectedOrder.total_amount).toLocaleString('id-ID')}</span>
                </div>
              </div>

            </div>

            {/* Footer Modal */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 sticky bottom-0">
              <button 
                onClick={() => setSelectedOrder(null)} 
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-xl transition-all text-sm"
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