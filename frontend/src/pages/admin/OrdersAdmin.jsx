import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  CheckCircle2, Clock, ChefHat, Bike, Search, User,
  MapPin, X, Phone, Receipt, Banknote, Wallet, Calendar, Trash2
} from 'lucide-react';

export default function OrdersAdmin() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Filter Periode State
  const [period, setPeriod] = useState('today'); // 'today' | '7days' | '30days' | 'custom'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Fetch data pesanan
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/admin/orders?period=${period}&date=${selectedDate}`);
      setOrders(response.data.data || []);
    } catch (error) {
      console.error('Gagal mengambil data pesanan:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    const interval = setInterval(() => {
      fetchOrders();
    }, 15000);

    return () => clearInterval(interval);
  }, [period, selectedDate]);

  const handleUpdateStatus = async (orderId, currentStatus) => {
    let nextStatus = '';
    if (currentStatus === 'PENDING') nextStatus = 'DIPROSES';
    else if (currentStatus === 'DIPROSES') nextStatus = 'DIANTAR';
    else if (currentStatus === 'DIANTAR') nextStatus = 'SELESAI';
    else return;

    try {
      await axios.patch(`/admin/orders/${orderId}/status`, {
        status: nextStatus
      });
      fetchOrders();
      if (selectedOrder) setSelectedOrder(null);
    } catch (error) {
      alert(error.response?.data?.message || 'Gagal mengupdate status pesanan.');
      console.error(error);
    }
  };

  const handleLunas = async (orderId) => {
    try {
      await axios.patch(`/admin/orders/${orderId}/status`, {
        payment_status: 'PAID'
      });
      fetchOrders();
      if (selectedOrder) setSelectedOrder(prev => ({ ...prev, payment_status: 'PAID' }));
    } catch (error) {
      alert(error.response?.data?.message || 'Gagal mengubah status pembayaran.');
    }
  };

  // Fungsi Hapus Pesanan
  const handleDeleteOrder = async (orderId, orderNumber) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus pesanan ${orderNumber}?`)) {
      return;
    }

    try {
      await axios.delete(`/admin/orders/${orderId}`);
      alert(`Pesanan ${orderNumber} berhasil dihapus.`);
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }
      fetchOrders();
    } catch (error) {
      alert(error.response?.data?.message || 'Gagal menghapus pesanan.');
      console.error(error);
    }
  };

  const tabs = [
    { id: 'PENDING', label: 'Pesanan Baru', icon: <Clock className="w-4 h-4" /> },
    { id: 'DIPROSES', label: 'Dimasak', icon: <ChefHat className="w-4 h-4" /> },
    { id: 'DIANTAR', label: 'Diantar', icon: <Bike className="w-4 h-4" /> },
    { id: 'SELESAI', label: 'Selesai', icon: <CheckCircle2 className="w-4 h-4" /> },
  ];

  const filteredOrders = orders.filter(o =>
    o.status === activeTab &&
    (o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans relative">

      {/* HEADER & TOOLBAR */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 p-4 lg:px-6 space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <h2 className="text-xl font-extrabold text-slate-800">Kelola Pesanan</h2>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
            {/* TOOLBAR FILTER PERIODE */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                onClick={() => setPeriod('today')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${period === 'today' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'}`}
              >
                Hari Ini
              </button>
              <button
                onClick={() => setPeriod('7days')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${period === '7days' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'}`}
              >
                7 Hari
              </button>
              <button
                onClick={() => setPeriod('30days')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${period === '30days' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'}`}
              >
                30 Hari
              </button>

              {/* Input Tanggal Spesifik */}
              <div className="relative flex items-center">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setPeriod('custom');
                  }}
                  className={`pl-8 pr-2 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${period === 'custom' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                />
                <Calendar className={`w-3.5 h-3.5 absolute left-2.5 pointer-events-none ${period === 'custom' ? 'text-white' : 'text-slate-400'}`} />
              </div>
            </div>

            {/* INPUT PENCARIAN */}
            <div className="relative sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text" placeholder="Cari nama/no. order..."
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* TAB STATUS PESANAN */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-1 -mx-2 px-2 md:mx-0 md:px-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${activeTab === tab.id ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
            >
              {tab.icon} {tab.label}
              <span className={`px-2 py-0.5 rounded-full text-[10px] ml-1 ${activeTab === tab.id ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {orders.filter(o => o.status === tab.id).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* LIST PESANAN */}
      <div className="p-4 lg:p-6 flex-1">
        {loading ? (
          <div className="text-center py-10 text-slate-500 font-medium animate-pulse">Memuat data pesanan...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 border-dashed">
            <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="font-bold text-slate-600">Belum ada pesanan {activeTab.toLowerCase()} pada periode ini</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredOrders.map(order => (
              <div key={order.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3 pb-3 border-b border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">No. Pesanan</span>
                      <span className="font-black text-slate-800">{order.order_number}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Tanggal & Waktu</span>
                      <span className="text-xs font-semibold text-slate-600">
                        {new Date(order.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} • {new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-slate-700 font-bold">
                      <User className="w-4 h-4 text-slate-400 shrink-0" /> {order.customer_name}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-emerald-700 font-bold">
                      <MapPin className="w-4 h-4 text-emerald-500 shrink-0" /> {order.class_room?.name}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md border ${order.payment_status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                    {order.payment_method} {order.payment_status === 'PAID' ? 'LUNAS' : 'BELUM BAYAR'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* Tombol Hapus */}
                    <button
                      onClick={() => handleDeleteOrder(order.id, order.order_number)}
                      title="Hapus Pesanan"
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {/* Tombol Detail */}
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition-colors"
                    >
                      Detail
                    </button>

                    {/* Tombol Status */}
                    {activeTab !== 'SELESAI' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, order.status)}
                        className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors"
                      >
                        {activeTab === 'PENDING' ? 'Proses' : activeTab === 'DIPROSES' ? 'Antar' : 'Selesaikan'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DETAIL PESANAN */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">

            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-800 text-lg leading-tight">Detail Pesanan</h3>
                <p className="text-xs text-slate-500 font-medium">{selectedOrder.order_number}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDeleteOrder(selectedOrder.id, selectedOrder.order_number)}
                  title="Hapus Pesanan"
                  className="p-2 bg-rose-100 text-rose-600 hover:bg-rose-200 rounded-full transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button onClick={() => setSelectedOrder(null)} className="p-2 bg-slate-200 text-slate-600 rounded-full hover:bg-slate-300">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-6 flex-1">

              {/* Info Pelanggan */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Info Pemesan</h4>
                <div className="bg-slate-50 p-4 rounded-2xl space-y-3 border border-slate-100">
                  <div className="flex items-center gap-3 text-slate-700">
                    <User className="w-5 h-5 text-emerald-500" />
                    <span className="font-bold">{selectedOrder.customer_name}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-emerald-500" />
                      <span className="font-bold">{selectedOrder.customer_phone}</span>
                    </div>
                    <a
                      href={`https://wa.me/${selectedOrder.customer_phone.replace(/^0/, '62')}`}
                      target="_blank" rel="noreferrer"
                      className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md font-bold hover:bg-emerald-200"
                    >
                      Chat WA
                    </a>
                  </div>
                  <div className="flex items-center gap-3 text-slate-700">
                    <MapPin className="w-5 h-5 text-emerald-500" />
                    <span className="font-bold">{selectedOrder.class_room?.name}</span>
                  </div>
                </div>
              </div>

              {/* Rincian Menu */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Pesanan</h4>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-sm">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start border-b border-slate-200 last:border-0 pb-2 last:pb-0">
                      <div>
                        <span className="font-bold text-slate-700">{item.qty}x {item.product.name}</span>
                        {item.note && <p className="text-[10px] text-slate-500 italic mt-0.5">Catatan: {item.note}</p>}
                      </div>
                      <span className="font-bold text-slate-700">Rp{(Number(item.price) * Number(item.qty)).toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Info Pembayaran */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Rincian Pembayaran</h4>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600 flex items-center gap-2"><Receipt className="w-4 h-4" /> Total Tagihan</span>
                    <span className="font-black text-slate-800 text-base">Rp{Number(selectedOrder.total_amount).toLocaleString('id-ID')}</span>
                  </div>

                  {selectedOrder.payment_method === 'CASH' && (
                    <>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 flex items-center gap-2"><Banknote className="w-4 h-4" /> Uang Tunai</span>
                        <span className="font-bold text-emerald-600">Rp{Number(selectedOrder.cash_amount).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-200">
                        <span className="text-slate-600 flex items-center gap-2"><Wallet className="w-4 h-4" /> Kembalian</span>
                        <span className="font-black text-rose-500">Rp{Number(selectedOrder.change_amount).toLocaleString('id-ID')}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-slate-100 bg-white grid grid-cols-2 gap-3">
              {selectedOrder.payment_status !== 'PAID' ? (
                <button
                  onClick={() => handleLunas(selectedOrder.id)}
                  className="w-full bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-bold py-3 rounded-xl transition-colors text-sm"
                >
                  Konfirmasi Lunas
                </button>
              ) : (
                <div className="w-full bg-slate-100 text-slate-400 font-bold py-3 rounded-xl flex items-center justify-center text-sm cursor-not-allowed">
                  Sudah Lunas
                </div>
              )}

              {selectedOrder.status !== 'SELESAI' ? (
                <button
                  onClick={() => handleUpdateStatus(selectedOrder.id, selectedOrder.status)}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-xl transition-colors text-sm"
                >
                  {selectedOrder.status === 'PENDING' ? 'Proses Pesanan' : selectedOrder.status === 'DIPROSES' ? 'Antar Pesanan' : 'Selesaikan'}
                </button>
              ) : (
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-xl transition-colors text-sm"
                >
                  Tutup Modal
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}