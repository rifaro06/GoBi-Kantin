import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingCart, ChefHat, LogOut, Menu, X, Bell, Users, 
  ChevronRight, Clock, Settings, ChevronDown, User, ShieldCheck 
} from 'lucide-react';
import axios from 'axios';

// ⏱️ ATUR DURASI MAKSIMAL INAKTIF DI SINI (2 Jam)
const MAX_INACTIVE_TIME = 2 * 60 * 60 * 1000; 

export default function AdminLayout() {
  const token = localStorage.getItem('admin_token');
  const navigate = useNavigate();

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  // 🟢 AMBIL ROLE SECARA DINAMIS DI DALAM KOMPONEN
  const [role, setRole] = useState(localStorage.getItem('admin_role'));

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [pendingOrders, setPendingOrders] = useState([]);
  
  // State Logo Default
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

  // Helper Logout Bersih
  const forceLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_last_activity');
    localStorage.removeItem('admin_role'); // Bersihin role juga pas keluar
    navigate('/admin/login');
  };

  // 1. 🛡️ AUTO-LOGOUT JIKA INAKTIF TERLALU LAMA
  useEffect(() => {
    const checkInactivity = () => {
      const lastActivity = localStorage.getItem('admin_last_activity');
      const now = Date.now();

      if (lastActivity) {
        if (now - parseInt(lastActivity, 10) > MAX_INACTIVE_TIME) {
          alert('Sesi login Anda telah berakhir demi keamanan. Silakan login kembali.');
          forceLogout();
          return true;
        }
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

    const interval = setInterval(() => {
      checkInactivity();
    }, 60000);

    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
      clearInterval(interval);
    };
  }, [navigate]);

  // 2. 🛡️ AUTO-LOGOUT JIKA SERVER BALAS 401 (TOKEN EXPIRED)
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          forceLogout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  // Helper format URL Gambar
  const formatImageUrl = (path) => {
    if (!path) return '/Logo.png';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    
    if (path.includes('storage') || path.includes('uploads')) {
      const backendBase = 'http://127.0.0.1:8000';
      const cleanPath = path.startsWith('/') ? path : `/${path}`;
      return `${backendBase}${cleanPath}`;
    }

    return path.startsWith('/') ? path : `/${path}`;
  };

  // Fetch Settings & Admin Data
  useEffect(() => {
    // Sinkronkan role dari localStorage saat lokasi/halaman berubah
    setRole(localStorage.getItem('admin_role'));

    axios.get('/settings')
      .then(res => {
        const data = res.data.data || res.data;
        if (data) {
          const rawLogo = data.app_logo_url || data.logo_url || data.app_logo || data.logo;
          setSettings({
            app_name: data.app_name || 'GoBI Admin',
            logo_url: rawLogo ? formatImageUrl(rawLogo) : '/Logo.png'
          });
        }
      })
      .catch(err => {
        console.error('Gagal memuat setting logo, memakai logo default public:', err);
        setSettings(prev => ({ ...prev, logo_url: '/Logo.png' }));
      });

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

  // Check Pending Orders
  const checkNotifications = async () => {
    try {
      const response = await axios.get('/admin/orders', {
        headers: { Authorization: `Bearer ${token}` }
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
    const interval = setInterval(() => checkNotifications(), 15000);
    return () => clearInterval(interval);
  }, []);

  // Close Dropdown Outside Click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    if (!window.confirm('Yakin ingin keluar?')) return;
    try {
      await axios.post('/logout', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Gagal logout', error);
    } finally {
      forceLogout();
    }
  };

  // PEMBAGIAN HAK AKSES MENU DI SINI
  const navItems = [
    { path: '/admin/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
    { path: '/admin/orders', icon: <ShoppingCart className="w-5 h-5" />, label: 'Pesanan Masuk' },
    
    // Tiga menu ini HANYA dimuat jika role === 'admin'
    ...(role === 'admin' ? [
      { path: '/admin/menus', icon: <ChefHat className="w-5 h-5" />, label: 'Kelola Menu' },
      { path: '/admin/users', icon: <Users className="w-5 h-5" />, label: 'Kelola Admin' },
      { path: '/admin/settings', icon: <Settings className="w-5 h-5" />, label: 'Pengaturan' },
    ] : [])
  ];

  const getInitials = (name) => {
    if (!name) return 'AD';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">

      {/* OVERLAY MOBILE */}
      <div
        className={`fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity lg:hidden ${isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMobileOpen(false)}
      />

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#1a1f2c] text-slate-300 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:shrink-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* LOGO ADMIN */}
        <div className="p-5 flex items-center justify-between border-b border-slate-700/50">
          <div className="flex items-center gap-3 overflow-hidden">
            {settings.logo_url ? (
              <img 
                src={settings.logo_url} 
                alt="Logo Kantin" 
                className="w-8 h-8 object-contain rounded-lg bg-slate-800 p-0.5 border border-slate-700 shrink-0" 
                onError={() => {
                  if (settings.logo_url !== '/Logo.png') {
                    setSettings(prev => ({ ...prev, logo_url: '/Logo.png' }));
                  } else {
                    setSettings(prev => ({ ...prev, logo_url: '' }));
                  }
                }}
              />
            ) : (
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shrink-0">
                <span className="text-white font-black text-xl">⚡</span>
              </div>
            )}
            <span className="font-bold text-white text-lg tracking-wide truncate">
              {settings.app_name || 'GoBI Admin'}
            </span>
          </div>

          <button onClick={() => setIsMobileOpen(false)} className="lg:hidden p-1 hover:bg-slate-700 rounded-lg text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NAVIGATION */}
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

        {/* LOGOUT BUTTON IN SIDEBAR */}
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

          <div className="flex items-center gap-3">
            
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

            {/* 👤 AVATAR PROFILE INTERAKTIF DROPDOWN */}
            <div className="relative" ref={profileRef}>
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-1 hover:bg-slate-100 rounded-xl transition-colors active:scale-95 border border-transparent hover:border-slate-200"
                title="Profil Admin"
              >
                <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-extrabold text-xs border border-emerald-200 shadow-xs">
                  {getInitials(adminUser.name)}
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 hidden sm:block ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* POPUP DROPDOWN PROFILE */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-3 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-fade-in">
                  
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="font-bold text-xs text-slate-800 truncate">{adminUser.name}</p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{adminUser.email}</p>
                    <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md mt-1 border border-emerald-200/60">
                      <ShieldCheck className="w-3 h-3" /> {adminUser.role}
                    </span>
                  </div>

                  <div className="p-1">
                    {/* HANYA MUNCUL JIKA ROLE ADMIN */}
                    {role === 'admin' && (
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          navigate('/admin/settings');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Settings className="w-4 h-4 text-slate-400" /> Pengaturan Toko
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors mt-0.5"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" /> Keluar
                    </button>
                  </div>

                </div>
              )}
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