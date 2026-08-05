import React from 'react';
import { Routes, Route } from 'react-router-dom';
import axios from 'axios';

import Catalog from './pages/Catalog';
import Checkout from './pages/Checkout';
import SuccessTicket from './pages/SuccessTicket';
import OrderStatus from './pages/OrderStatus';

// Import Admin Layout & Pages
import AdminLayout from './layouts/AdminLayout';
import DashboardAdmin from './pages/admin/DashboardAdmin';
import OrdersAdmin from './pages/admin/OrdersAdmin';
import MenusAdmin from './pages/admin/MenusAdmin';
import UsersAdmin from './pages/admin/UsersAdmin';
import SettingsAdmin from './pages/admin/SettingsAdmin';
import LoginAdmin from './pages/admin/LoginAdmin';
import Closed from './pages/Closed';

// PAKSA AXIOS MENGGUNAKAN PROXY /api (MENGATASI BENTROK CORS & LOCALHOST)
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

// PASANG PEMBERSIH & PENEMPEL TOKEN OTOMATIS
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default function App() {
  return (
    <Routes>
      {/* RUTE FRONTEND (Siswa) */}
      <Route path="/" element={<Catalog />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/track/:id" element={<SuccessTicket />} />
      <Route path="/track" element={<OrderStatus />} />
      <Route path="/closed" element={<Closed />} />

      {/* RUTE LOGIN ADMIN */}
      <Route path="/admin/login" element={<LoginAdmin />} />

      {/* RUTE ADMIN (DIGEMBOK) */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<DashboardAdmin />} />
        <Route path="dashboard" element={<DashboardAdmin />} />
        <Route path="orders" element={<OrdersAdmin />} /> 
        <Route path="menus" element={<MenusAdmin />} />
        <Route path="users" element={<UsersAdmin />} />
        <Route path="settings" element={<SettingsAdmin />} />
      </Route>
    </Routes>
  );
}