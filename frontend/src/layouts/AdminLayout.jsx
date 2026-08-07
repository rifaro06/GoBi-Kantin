import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, ChefHat, LogOut, Menu, X, Bell, Users, ChevronRight, Clock, Settings } from 'lucide-react';
import axios from 'axios';

export default function AdminLayout() {
  const token = localStorage.getItem('admin_token');
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [pendingOrders, setPendingOrders] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  const notifRef = useRef(null);

  const checkNotifications = async () => {
    try {
      // TAMBAHKAN HEADER AUTHORIZATION DI SINI
      const response = await axios.get('/admin/orders', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const pending = (response.data.data || []).filter(
        (order) => order.status === 'pending' || order.status === 'menunggu'
      );
      setPendingOrders(pending);
    } catch (error) {
      console.error('Gagal mengecek notifikasi:', error);
    }
  };

  useEffect(() => {
    checkNotifications();
    const interval = setInterval(() => {
      checkNotifications();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    if (!window.confirm('Yakin ingin keluar?')) return;
    try {
      // TAMBAHKAN HEADER AUTHORIZATION JUGA SAAT LOGOUT
      await axios.post('/logout', {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Gagal logout', error);
    } finally {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      navigate('/admin/login');
    }
  };

  const navItems = [
    { path: '/admin/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
    { path: '/admin/orders', icon: <ShoppingCart className="w-5 h-5" />, label: 'Pesanan Masuk' },
    { path: '/admin/menus', icon: <ChefHat className="w-5 h-5" />, label: 'Kelola Menu' },
    { path: '/admin/users', icon: <Users className="w-5 h-5" />, label: 'Kelola Admin' },
    { path: '/admin/settings', icon: <Settings className="w-5 h-5" />, label: 'Pengaturan' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">

      {/* OVERLAY MOBILE */}
      <div
        className={`fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity lg:hidden ${isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMobileOpen(false)}
      />

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#1a1f2c] text-slate-300 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:shrink-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 flex items-center justify-between border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-xl">⚡</span>
            </div>
            <span className="font-bold text-white text-lg tracking-wide">GoBI Admin</span>
          </div>
          <button onClick={() => setIsMobileOpen(false)} className="lg:hidden p-1 hover:bg-slate-700 rounded-lg text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname.includes(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${isActive
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 font-semibold'
                    : 'hover:bg-slate-800 hover:text-white font-medium'
                  }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  {item.label}
                </div>
                {item.path === '/admin/orders' && pendingOrders.length > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                    {pendingOrders.length}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700/50">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors font-medium">
            <LogOut className="w-5 h-5" /> Keluar
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 max-w-full">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 lg:px-6 z-30 sticky top-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileOpen(true)} className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-xl">
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-slate-800 hidden lg:block">Panel Kantin</h1>
          </div>

          <div className="flex items-center gap-4">
            
            {/* 🔔 LONCENG NOTIFIKASI DROPDOWN */}
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2 text-slate-500 hover:text-emerald-600 transition-colors bg-slate-50 hover:bg-emerald-50 rounded-xl"
                title="Notifikasi Pesanan"
              >
                <Bell className="w-5 h-5" />
                {pendingOrders.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                    {pendingOrders.length}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 py-3 z-50">
                  <div className="px-4 pb-3 border-b border-slate-100 flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-800">Pesanan Baru</span>
                    <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                      {pendingOrders.length} Menunggu
                    </span>
                  </div>

                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                    {pendingOrders.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        Tidak ada pesanan yang perlu diproses 👍
                      </div>
                    ) : (
                      pendingOrders.slice(0, 5).map((ord) => (
                        <div 
                          key={ord.id}
                          onClick={() => {
                            setIsNotifOpen(false);
                            navigate('/admin/orders');
                          }}
                          className="p-3.5 hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-between"
                        >
                          <div>
                            <p className="font-bold text-xs text-slate-800">{ord.customer_name || `Pesanan #${ord.id}`}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              Rp {Number(ord.total_amount || ord.total_price || ord.total || 0).toLocaleString('id-ID')}
                            </p>
                          </div>
                          <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-md uppercase">
                            Pending
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-2 pt-2 border-t border-slate-100 text-center">
                    <button
                      onClick={() => {
                        setIsNotifOpen(false);
                        navigate('/admin/orders');
                      }}
                      className="w-full text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 py-2 rounded-xl transition-colors flex items-center justify-center gap-1"
                    >
                      Lihat Semua Pesanan <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-sm border border-emerald-200">
              AD
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-x-hidden overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}