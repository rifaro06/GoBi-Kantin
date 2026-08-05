import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { NavLink } from 'react-router-dom';
import { 
  TrendingUp, ShoppingBag, Clock, 
  ChefHat, ArrowRight, Activity 
} from 'lucide-react';

export default function DashboardAdmin() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  // HELPER: Mencegah Mixed Content & mengganti placeholder rusak
  const getImageUrl = (url) => {
    if (!url) return 'https://placehold.co/150?text=No+Image';
    if (typeof url !== 'string') return url;
    return url.replace(/^http:\/\/(127\.0\.0\.1|localhost):8000/, '');
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await axios.get('/admin/dashboard');
        setDashboardData(response.data.data);
      } catch (error) {
        console.error('Gagal mengambil data dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3 text-emerald-600 animate-pulse">
          <Activity className="w-10 h-10" />
          <p className="font-bold">Menyiapkan Dashboard...</p>
        </div>
      </div>
    );
  }

  const { metrics, top_menus } = dashboardData;

  return (
    <div className="p-4 lg:p-6 bg-slate-50 min-h-full font-sans space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-800">Dashboard</h2>
        <p className="text-sm font-medium text-slate-500 mt-1">Ringkasan aktivitas kantin hari ini.</p>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card Pendapatan */}
        <div className="bg-linear-to-br from-emerald-500 to-emerald-700 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/20">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-md">HARI INI</span>
          </div>
          <h3 className="text-emerald-50 text-sm font-medium">Total Pendapatan (Lunas)</h3>
          <p className="text-3xl font-black mt-1">
            Rp{metrics.revenue_today.toLocaleString('id-ID')}
          </p>
        </div>

        {/* Card Pesanan */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <ShoppingBag className="w-6 h-6" />
            </div>
          </div>
          <div>
            <h3 className="text-slate-500 text-sm font-medium">Pesanan Masuk</h3>
            <p className="text-3xl font-black text-slate-800 mt-1">{metrics.total_orders_today}</p>
          </div>
        </div>

        {/* Card Menunggu Proses */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <div>
            <h3 className="text-slate-500 text-sm font-medium">Menunggu Diproses</h3>
            <p className="text-3xl font-black text-slate-800 mt-1">{metrics.pending_orders}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Menus Section */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-emerald-500" /> Menu Terlaris (Top 5)
            </h3>
          </div>
          
          <div className="space-y-4">
            {top_menus.length > 0 ? top_menus.map((menu, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-200 rounded-lg overflow-hidden shrink-0">
                    <img 
                      src={getImageUrl(menu.image)} 
                      alt={menu.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-700 text-sm">{menu.name}</h4>
                    <p className="text-xs font-semibold text-slate-500">Rp{Number(menu.price).toLocaleString('id-ID')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-emerald-600">{menu.total_sold}</span>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Terjual</p>
                </div>
              </div>
            )) : (
              <div className="text-center py-6 text-slate-400 font-medium text-sm">
                Belum ada data penjualan hari ini.
              </div>
            )}
          </div>
        </div>

        {/* Quick Action Section (Shortcut) */}
        <div className="space-y-4">
          <div className="bg-slate-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-bold text-xl mb-2">Ada pesanan baru?</h3>
              <p className="text-slate-400 text-sm mb-6 max-w-[80%]">Pantau terus halaman pesanan biar makanan siswa cepat diantar ke kelas.</p>
              
              <NavLink 
                to="/admin/orders" 
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold transition-colors text-sm"
              >
                Cek Pesanan Sekarang <ArrowRight className="w-4 h-4" />
              </NavLink>
            </div>
            {/* Background Decoration */}
            <ChefHat className="absolute -bottom-6 -right-6 w-40 h-40 text-slate-700 opacity-50" />
          </div>
        </div>

      </div>
    </div>
  );
}