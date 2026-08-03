import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ChefHat } from 'lucide-react';

export default function LoginAdmin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:8000/api/login', {
        email, password
      });

      // Simpan token ke brankas browser (localStorage)
      localStorage.setItem('admin_token', response.data.data.token);
      localStorage.setItem('admin_user', JSON.stringify(response.data.data.user));
      
      // Arahkan ke dashboard
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Terjadi kesalahan pada server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-3xl shadow-xl overflow-hidden">
        <div className="bg-slate-800 p-8 text-center">
          <ChefHat className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h2 className="text-2xl font-black text-white">GoBI Admin</h2>
          <p className="text-slate-400 text-sm mt-1">Masuk untuk mengelola kantin</p>
        </div>
        
        <form onSubmit={handleLogin} className="p-8 space-y-5">
          {error && (
            <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-sm font-bold border border-rose-100 text-center">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Email Address</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="email" required
                value={email} onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all font-medium"
                placeholder="admin@gobi.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Password</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="password" required
                value={password} onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all font-medium"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-70 mt-4"
          >
            {loading ? 'Memeriksa...' : 'Masuk ke Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}