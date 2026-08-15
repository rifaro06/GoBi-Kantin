import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { NavLink } from 'react-router-dom';
import { 
  TrendingUp, ShoppingBag, Clock, 
  ChefHat, ArrowRight, Activity, Calendar, CheckCircle2, X 
} from 'lucide-react';

export default function DashboardAdmin() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  // State untuk filter periode
  const [period, setPeriod] = useState('today');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // State untuk Modal Rincian Pendapatan
  const [showModal, setShowModal] = useState(false);
  const [detailOrders, setDetailOrders] = useState([]);
  const [loadingModal, setLoadingModal] = useState(false);

  const getImageUrl = (url) => {
    if (!url) return 'https://placehold.co/150?text=No+Image';
    if (typeof url !== 'string') return url;
    return url.replace(/^http:\/\/(127\.0\.0\.1|localhost):8000/, '');
  };

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/admin/dashboard?period=${period}&date=${selectedDate}`);
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Gagal mengambil data dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk mengambil detail rincian dari OrderController
  const fetchOrderDetails = async () => {
    setShowModal(true);
    setLoadingModal(true);
    try {
      const response = await axios.get(`/admin/orders?period=${period}&date=${selectedDate}`);
      // Kita saring HANYA yang status pembayarannya PAID (karena ini rincian pendapatan)
      const paidOrders = response.data.data.filter(order => order.payment_status === 'PAID');
      setDetailOrders(paidOrders);
    } catch (error) {
      console.error('Gagal mengambil rincian pesanan:', error);
    } finally {
      setLoadingModal(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [period, selectedDate]);

  return (
    <div className="p-4 lg:p-6 bg-slate-50 min-h-full font-sans space-y-6 relative">
      
      {/* Header & Filter Periode */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800">Dashboard</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Ringkasan aktivitas dan pendapatan kantin.</p>
        </div>

        {/* Filter Period Toolbar */}
        <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 border border-slate-200 rounded-2xl shadow-xs">
          <button
            onClick={() => setPeriod('today')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${period === 'today' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            Hari Ini
          </button>
          <button
            onClick={() => setPeriod('7days')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${period === '7days' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            7 Hari Terakhir
          </button>
          <button
            onClick={() => setPeriod('30days')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${period === '30days' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            30 Hari Terakhir
          </button>

          {/* Custom Date Input */}
          <div className="relative flex items-center">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setPeriod('custom');
              }}
              className={`pl-8 pr-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${period === 'custom' ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
            />
            <Calendar className={`w-3.5 h-3.5 absolute left-2.5 pointer-events-none ${period === 'custom' ? 'text-white' : 'text-slate-400'}`} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3 text-emerald-600 animate-pulse">
            <Activity className="w-10 h-10" />
            <p className="font-bold text-sm">Menyiapkan Dashboard...</p>
          </div>
        </div>
      ) : dashboardData && (
        <>
          {/* Top Metrics Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card Total Pendapatan dengan Tombol Rincian */}
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-5 text-white shadow-lg shadow-emerald-600/20 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold bg-white/20 px-2 py-1 rounded-md tracking-wider">
                    {dashboardData.period_label}
                  </span>
                </div>
                <h3 className="text-emerald-100 text-xs font-semibold uppercase tracking-wider">Total Pendapatan (Lunas)</h3>
                <p className="text-2xl lg:text-3xl font-black mt-1">
                  Rp{dashboardData.metrics.revenue.toLocaleString('id-ID')}
                </p>
              </div>
              
              <div>
                {/* Rincian Cash & QRIS */}
                <div className="mt-4 pt-3 border-t border-emerald-500/50 flex justify-between items-center text-sm">
                  <div>
                    <span className="text-emerald-200 text-[10px] uppercase font-bold block mb-0.5">💵 Cash (Tunai)</span>
                    <span className="font-bold">Rp{dashboardData.metrics.revenue_cash?.toLocaleString('id-ID') || 0}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-200 text-[10px] uppercase font-bold block mb-0.5">📱 QRIS / Transfer</span>
                    <span className="font-bold">Rp{dashboardData.metrics.revenue_qris?.toLocaleString('id-ID') || 0}</span>
                  </div>
                </div>

                {/* Tombol Lihat Rincian */}
                <button 
                  onClick={fetchOrderDetails}
                  className="mt-4 w-full bg-emerald-900/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-white py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Activity className="w-3.5 h-3.5" /> Lihat Rincian Pesanan
                </button>
              </div>
            </div>

            {/* Card Total Pesanan Masuk */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div className="flex justify-between items-start mb-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <ShoppingBag className="w-5 h-5" />
                </div>
              </div>
              <div>
                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Pesanan Masuk</h3>
                <p className="text-2xl lg:text-3xl font-black text-slate-800 mt-1">
                  {dashboardData.metrics.total_orders}
                </p>
              </div>
            </div>

            {/* Card Menunggu Diproses */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div className="flex justify-between items-start mb-3">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div>
                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Menunggu Diproses</h3>
                <p className="text-2xl lg:text-3xl font-black text-slate-800 mt-1">
                  {dashboardData.metrics.pending_orders}
                </p>
              </div>
            </div>

            {/* Card Pesanan Selesai */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div className="flex justify-between items-start mb-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <div>
                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Pesanan Selesai</h3>
                <p className="text-2xl lg:text-3xl font-black text-slate-800 mt-1">
                  {dashboardData.metrics.completed_orders}
                </p>
              </div>
            </div>

          </div>

          {/* Middle Section: Top Menus & Quick Banner */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Top Menus Section */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm sm:text-base">
                  <ChefHat className="w-5 h-5 text-emerald-600" /> Menu Terlaris (Top 5)
                </h3>
                <span className="text-xs font-bold text-slate-400">
                  {dashboardData.period_label}
                </span>
              </div>
              
              <div className="space-y-3">
                {dashboardData.top_menus.length > 0 ? dashboardData.top_menus.map((menu, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100/80 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-200 rounded-xl overflow-hidden shrink-0 border border-slate-200">
                        <img 
                          src={getImageUrl(menu.image)} 
                          alt={menu.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs sm:text-sm">{menu.name}</h4>
                        <p className="text-xs font-semibold text-slate-500">Rp{Number(menu.price).toLocaleString('id-ID')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-emerald-600">{menu.total_sold}</span>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Terjual</p>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-10 text-slate-400 font-medium text-xs sm:text-sm">
                    Belum ada data penjualan pada periode ini.
                  </div>
                )}
              </div>
            </div>

            {/* Quick Action Banner */}
            <div className="space-y-4">
              <div className="bg-slate-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col justify-between h-full min-h-[220px]">
                <div className="relative z-10">
                  <h3 className="font-extrabold text-xl mb-2">Pantau Pesanan Masuk</h3>
                  <p className="text-slate-400 text-sm mb-6 max-w-[85%] leading-relaxed">
                    Pastikan makanan dan minuman siswa segera diproses dan diantar tepat waktu ke kelas.
                  </p>
                  
                  <NavLink 
                    to="/admin/orders" 
                    className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 rounded-xl font-bold transition-all text-sm active:scale-95 shadow-md shadow-emerald-500/20"
                  >
                    Cek Pesanan Sekarang <ArrowRight className="w-4 h-4" />
                  </NavLink>
                </div>
                {/* Background Decor */}
                <ChefHat className="absolute -bottom-8 -right-8 w-44 h-44 text-slate-700/40 pointer-events-none" />
              </div>
            </div>

          </div>
        </>
      )}

      {/* POPUP MODAL RINCIAN PENDAPATAN */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white z-10 shadow-sm">
              <div>
                <h3 className="font-extrabold text-lg text-slate-800 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" /> Rincian Pendapatan (Lunas)
                </h3>
                <p className="text-xs font-bold text-slate-400 mt-1">
                  Periode: {dashboardData?.period_label || '-'}
                </p>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 bg-slate-50/50">
              {loadingModal ? (
                <div className="flex justify-center items-center py-20">
                  <Activity className="w-8 h-8 text-emerald-500 animate-spin" />
                </div>
              ) : detailOrders.length > 0 ? (
                <div className="space-y-3">
                  {detailOrders.map((order) => (
                    <div key={order.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center hover:border-emerald-200 transition-colors">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                            {order.order_number}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            {new Date(order.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm">{order.customer_name}</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          {order.items?.map(item => `${item.qty}x ${item.product?.name}`).join(', ')}
                        </p>
                      </div>
                      
                      <div className="text-right w-full sm:w-auto flex sm:flex-col justify-between items-center sm:items-end">
                        <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase mb-1 ${order.payment_method === 'QRIS' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {order.payment_method}
                        </span>
                        <span className="text-lg font-black text-slate-800">
                          Rp{Number(order.total_amount).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ShoppingBag className="w-8 h-8 text-slate-300" />
                  </div>
                  <h4 className="font-bold text-slate-600">Tidak ada transaksi lunas</h4>
                  <p className="text-sm text-slate-400 mt-1">Belum ada pemasukan di periode ini.</p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}