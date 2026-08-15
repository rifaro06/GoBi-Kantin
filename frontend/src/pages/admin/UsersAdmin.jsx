import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, Trash2, ShieldCheck, Mail, User, Key, Truck } from 'lucide-react';

export default function UsersAdmin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Tambahin 'role' di formData dengan default 'admin'
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'admin' });

  const token = localStorage.getItem('admin_token');
  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/admin/users', axiosConfig);
      setUsers(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/admin/users', formData, axiosConfig);
      alert('Akun berhasil ditambahkan!');
      setIsModalOpen(false);
      setFormData({ name: '', email: '', password: '', role: 'admin' });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menambah akun!');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus akun ini?')) return;
    try {
      await axios.delete(`/admin/users/${id}`, axiosConfig);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus akun!');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Kelola Pengguna</h1>
          <p className="text-sm text-slate-500">Tambah atau hapus akses Superadmin & Driver</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-lg shadow-emerald-500/20"
        >
          <UserPlus className="w-4 h-4" /> Tambah Akun Baru
        </button>
      </div>

      {/* TABEL LIST ADMIN */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Memuat data pengguna...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-xs">
                <tr>
                  <th className="p-4">Info Pengguna</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Tanggal Dibuat</th>
                  <th className="p-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="p-4 flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${u.role === 'admin' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                        {u.role === 'admin' ? <ShieldCheck className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{u.name}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${u.role === 'admin' ? 'text-emerald-500' : 'text-blue-500'}`}>
                          {u.role}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600">{u.email}</td>
                    <td className="p-4 text-slate-400 text-xs">
                      {new Date(u.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Hapus Akun"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL TAMBAH ADMIN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Tambah Akun Baru</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* PILIH ROLE */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Hak Akses (Role)</label>
                <select
                  value={formData.role} 
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="admin">Admin Utama (Akses Penuh)</option>
                  <option value="driver">Kurir / Driver (Hanya Pesanan)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Nama Lengkap</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text" required
                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Contoh: Budi Driver"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email" required
                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="budi@gobi.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Password</label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password" required minLength={6}
                    value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Minimal 6 karakter"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button" onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-600 text-sm hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm"
                >
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}