import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingCart, ChefHat, LogOut, Menu, X, Bell, Users, 
  ChevronRight, Settings, ChevronDown, ShieldCheck, Utensils
} from 'lucide-react';
import axios from 'axios';

const MAX_INACTIVE_TIME = 2 * 60 * 60 * 1000; 

export default function AdminLayout() {
  const token = localStorage.getItem('admin_token');
  const navigate = useNavigate();

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  const [role, setRole] = useState(localStorage.getItem('admin_role'));
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [pendingOrders, setPendingOrders] = useState([]);
  
  const [settings, setSettings] = useState({
    app_name: 'GoBI Admin',
    logo_url: '/Logo.png'
  });

  const [adminUser, setAdminUser] = useState({
    name: 'Admin Kantin',
    email: 'admin@gobi.com',
    role: 'Administrator'
  });

  const location = useLocation();
  const notifRef = useRef(null);
  const profileRef = useRef(null); 

  const forceLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_last_activity');
    localStorage.removeItem('admin_role'); 
    navigate('/admin/login');
  };

  useEffect(() => {
    const checkInactivity = () => {
      const lastActivity = localStorage.getItem('admin_last_activity');
      const now = Date.now();

      if (lastActivity && (now - parseInt(lastActivity, 10) > MAX_INACTIVE_TIME)) {
        alert('Sesi login Anda telah berakhir demi keamanan. Silakan login kembali.');
        forceLogout();
        return true;
      }
      localStorage.setItem('admin_last_activity', now.toString());
      return false;
    };

    checkInactivity();

    const resetTimer = () => {
      const lastActivity = localStorage.getItem('admin_last_activity');
      const now = Date.now();
      if (!lastActivity || now - parseInt(lastActivity, 10) > 60000) {
        localStorage.setItem('admin_last_activity', now.toString());
      }
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('click', resetTimer);

    const interval = setInterval(checkInactivity, 60000);

    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
      clearInterval(interval);
    };
  }, [navigate]);

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          forceLogout();
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  const formatImageUrl = (path) => {
    if (!path) return '/Logo.png';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    if (path.includes('storage') || path.includes('uploads')) {
      return `http://127.0.0.1:8000${path.startsWith('/') ? path : `/${path}`}`;
    }
    return path.startsWith('/') ? path : `/${path}`;
  };

  useEffect(() => {
    setRole(localStorage.getItem('admin_role'));
    axios.get('/settings')
      .then(res => {
        const data = res.data?.data || res.data;
        if (data) {
          const rawLogo = data.app_logo_url || data.logo_url || data.app_logo || data.logo;
          setSettings({
            app_name: data.app_name || 'GoBI Admin',
            logo_url: rawLogo ? formatImageUrl(rawLogo) : '/Logo.png'
          });
        }
      })
      .catch(() => setSettings(prev => ({ ...prev, logo_url: '/Logo.png' })));

    const savedUser = localStorage.getItem('admin_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setAdminUser({
          name: parsed.name || 'Admin Kantin',
          email: parsed.email || 'admin@gobi.com',
          role: parsed.role || 'Administrator'
        });
      } catch (e) {
        console.error('Error parsing admin_user', e);
      }
    }
  }, [location.pathname]);

  const checkNotifications = async () => {
    try {
      const response = await axios.get('/admin/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const rawData = response.data?.data || response.data || [];
      if (Array.isArray(rawData)) {
        const pending = rawData.filter(order => {
          const status = String(order.status).toLowerCase();
          return ['pending', 'menunggu', 'unpaid', 'baru'].includes(status);
        });
        setPendingOrders(pending);
      }
    } catch (error) {
      console.error('Gagal mengecek notifikasi:', error);
    }
  };

  useEffect(() => {
    checkNotifications();
    const interval = setInterval(checkNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) setIsNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(event.target)) setIsProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    if (!window.confirm('Yakin ingin keluar?')) return;
    try {
      await axios.post('/logout', {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch (error) {
      console.error('Gagal logout', error);
    } finally {
      forceLogout();
    }
  };

  const navItems = [
    { path: '/admin/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
    { path: '/admin/orders', icon: <ShoppingCart className="w-5 h-5" />, label: 'Pesanan Masuk' },
    ...(role === 'admin' ? [
      { path: '/admin/menus', icon: <ChefHat className="w-5 h-5" />, label: 'Kelola Menu' },
      { path: '/admin/users', icon: <Users className="w-5 h-5" />, label: 'Kelola Admin' },
      { path: '/admin/settings', icon: <Settings className="w-5 h-5" />, label: 'Pengaturan' },
    ] : [])
  ];

  const getInitials = (name) => {
    if (!name) return 'AD';
    const parts = name.trim().split(' ');
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      <div
        className={`fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMobileOpen(false)}
      />

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0f172a] text-slate-300 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:shrink-0 shadow-2xl lg:shadow-none ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center gap-3 overflow-hidden">
            {settings.logo_url ? (
              <img 
                src={settings.logo_url} 
                alt="Logo Kantin" 
                className="w-9 h-9 object-contain rounded-xl bg-slate-800/50 p-1 border border-slate-700/50 shrink-0" 
                onError={() => setSettings(prev => ({ ...prev, logo_url: '/Logo.png' }))}
              />
            ) : (
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                <span className="text-white font-black text-xl">⚡</span>
              </div>
            )}
            <span className="font-extrabold text-white text-lg tracking-wide truncate">
              {settings.app_name}
            </span>
          </div>
          <button onClick={() => setIsMobileOpen(false)} className="lg:hidden p-1.5 hover:bg-slate-800 rounded-lg text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname.includes(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20 font-semibold'
                    : 'hover:bg-slate-800/80 hover:text-white font-medium text-slate-400'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`${isActive ? 'text-white' : 'text-slate-400'}`}>{item.icon}</span>
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

        <div className="p-4 border-t border-slate-800/80">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl transition-colors font-semibold group">
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Keluar
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 max-w-full">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 h-16 flex items-center justify-between px-4 lg:px-8 z-30 sticky top-0 shadow-sm shadow-slate-100/50">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileOpen(true)} className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-xl">
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden lg:flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                 <LayoutDashboard className="w-4 h-4 text-emerald-600" />
              </div>
              <h1 className="text-lg font-extrabold text-slate-800 tracking-tight">Panel Kantin</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className={`relative p-2.5 transition-colors rounded-xl ${isNotifOpen ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:text-emerald-600 bg-slate-50 hover:bg-emerald-50'}`}
              >
                <Bell className="w-5 h-5" />
                {pendingOrders.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 bg-rose-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                    {pendingOrders.length}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 py-2 z-50">
                  <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-white/50 rounded-t-3xl">
                    <span className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                      <Utensils className="w-4 h-4 text-emerald-500" /> Pesanan Masuk
                    </span>
                    <span className="text-[10px] bg-emerald-100/80 text-emerald-700 font-extrabold px-2.5 py-1 rounded-full">
                      {pendingOrders.length} Menunggu
                    </span>
                  </div>

                  <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-50/80">
                    {pendingOrders.length === 0 ? (
                      <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-2">
                           <span className="text-xl">👍</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-500">Keren! Semua beres. <br/> Tidak ada pesanan menunggu</p>
                      </div>
                    ) : (
                      pendingOrders.slice(0, 5).map((ord) => (
                        <div 
                          key={ord.id}
                          onClick={() => {
                            setIsNotifOpen(false);
                            navigate('/admin/orders');
                          }}
                          className="p-4 hover:bg-slate-50/80 cursor-pointer transition-colors flex items-center justify-between group"
                        >
                          <div className="flex flex-col gap-1">
                            <p className="font-bold text-sm text-slate-800 group-hover:text-emerald-600 transition-colors">
                              {ord.customer_name || ord.user?.name || `Pesanan #${ord.id}`}
                            </p>
                            <span className="text-xs font-semibold text-emerald-600">
                               Rp {Number(ord.total_amount || ord.total_price || ord.total || 0).toLocaleString('id-ID')}
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                        </div>
                      ))
                    )}
                  </div>
                  
                  {pendingOrders.length > 0 && (
                    <div className="p-3 border-t border-slate-100 bg-slate-50/50 rounded-b-3xl">
                      <button
                        onClick={() => {
                          setIsNotifOpen(false);
                          navigate('/admin/orders');
                        }}
                        className="w-full text-xs font-bold text-emerald-600 hover:text-white bg-emerald-50 hover:bg-emerald-500 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1 group"
                      >
                        Lihat Semua Pesanan 
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform"/>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="relative" ref={profileRef}>
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-1 hover:bg-slate-100 rounded-xl transition-colors border border-transparent hover:border-slate-200"
              >
                <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-extrabold text-xs border border-emerald-200">
                  {getInitials(adminUser.name)}
                </div>
                <ChevronDown className={`w-3.5 h-3.5 hidden sm:block text-slate-500 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-3 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="font-bold text-xs text-slate-800 truncate">{adminUser.name}</p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{adminUser.email}</p>
                    <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md mt-1 border border-emerald-200/60">
                      <ShieldCheck className="w-3 h-3"/> {adminUser.role}
                    </span>
                  </div>
                  <div className="p-1">
                    {role === 'admin' && (
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          navigate('/admin/settings');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Settings className="w-4 h-4 text-slate-400"/> Pengaturan Toko
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors mt-0.5"
                    >
                      <LogOut className="w-4 h-4 text-rose-500"/> Keluar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-x-hidden overflow-y-auto">
          <Outlet/>
        </div>
      </main>
    </div>
  );
}