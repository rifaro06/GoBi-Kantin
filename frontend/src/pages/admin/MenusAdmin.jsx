import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Plus, Edit, Trash2, CheckCircle2, XCircle, Search
} from 'lucide-react';

export default function MenusAdmin() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // State untuk Modal Form (Sudah ditambah description)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '', category_id: '', price: '', description: '', image: '', is_available: true
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8000/api/admin/products');
      setProducts(response.data.data.products);
      setCategories(response.data.data.categories);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Buka modal untuk nambah menu
  const handleAdd = () => {
    setEditingId(null);
    setFormData({ 
      name: '', 
      category_id: categories[0]?.id || '', 
      price: '', 
      description: '', 
      image: '', 
      is_available: true 
    });
    setIsModalOpen(true);
  };

  // Buka modal untuk edit menu
  const handleEdit = (product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      category_id: product.category_id,
      price: product.price,
      description: product.description || '', // Pre-fill deskripsi
      image: product.image,
      is_available: product.is_available
    });
    setIsModalOpen(true);
  };

  // Simpan data (Create / Update)
  const handleSave = async (e) => {
    e.preventDefault();

    // Pakai FormData biar bisa ngirim file
    const submitData = new FormData();
    submitData.append('name', formData.name);
    submitData.append('category_id', formData.category_id);
    submitData.append('price', formData.price);
    submitData.append('description', formData.description || ''); // Append deskripsi
    // Ubah boolean jadi angka 1/0 karena FormData cuma nerima teks
    submitData.append('is_available', formData.is_available ? 1 : 0);

    // Cek kalau image itu beneran file (bukan cuma link string bawaan database)
    if (formData.image instanceof File) {
      submitData.append('image', formData.image);
    }

    try {
      if (editingId) {
        // TRIK LARAVEL: Buat update file, pakai POST + method PUT
        submitData.append('_method', 'PUT');
        await axios.post(`http://localhost:8000/api/admin/products/${editingId}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axios.post('http://localhost:8000/api/admin/products', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      alert('Gagal menyimpan menu!');
      console.error(error);
    }
  };

  // Hapus Menu
  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus menu ini?')) {
      try {
        await axios.delete(`http://localhost:8000/api/admin/products/${id}`);
        fetchData();
      } catch (error) {
        alert('Gagal menghapus menu!');
      }
    }
  };

  // Toggle status Tersedia / Habis dengan satu klik
  const toggleAvailability = async (product) => {
    try {
      await axios.put(`http://localhost:8000/api/admin/products/${product.id}`, {
        is_available: !product.is_available
      });
      fetchData();
    } catch (error) {
      console.error('Gagal update status:', error);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 p-4 lg:p-6 font-sans">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800">Kelola Menu</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Tambah, ubah, atau hapus daftar menu kantin.</p>
        </div>

        <div className="flex gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text" placeholder="Cari menu..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-50"
            />
          </div>
          <button onClick={handleAdd} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 text-sm transition-colors">
            <Plus className="w-4 h-4" /> Tambah Menu
          </button>
        </div>
      </div>

      {/* LIST MENU GRID */}
      {loading ? (
        <div className="text-center py-10 text-slate-500 animate-pulse font-medium">Memuat data menu...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map(product => (
            <div key={product.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col transition-opacity ${!product.is_available && 'opacity-70 grayscale-50'}`}>
              <div className="h-40 bg-slate-100 relative">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                <button
                  onClick={() => toggleAvailability(product)}
                  className={`absolute top-2 right-2 px-3 py-1 text-[10px] font-black rounded-full uppercase border backdrop-blur-md ${product.is_available ? 'bg-emerald-500/90 text-white border-emerald-400 hover:bg-emerald-600' : 'bg-rose-500/90 text-white border-rose-400 hover:bg-rose-600'}`}
                >
                  {product.is_available ? 'Tersedia' : 'Habis'}
                </button>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{product.category?.name}</span>
                <h3 className="font-bold text-slate-800 text-sm leading-tight mb-1">{product.name}</h3>
                
                {/* PREVIEW DESKRIPSI DI CARD */}
                <p className="text-xs text-slate-400 line-clamp-2 mb-3 min-h-[2rem]">
                  {product.description || 'Tidak ada deskripsi'}
                </p>

                <span className="font-black text-emerald-600 mt-auto">Rp{Number(product.price).toLocaleString('id-ID')}</span>

                <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                  <button onClick={() => handleEdit(product)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg text-xs font-bold flex justify-center items-center gap-1 transition-colors">
                    <Edit className="w-3 h-3" /> Edit
                  </button>
                  <button onClick={() => handleDelete(product.id)} className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 py-2 rounded-lg text-xs font-bold flex justify-center items-center gap-1 transition-colors">
                    <Trash2 className="w-3 h-3" /> Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-lg">{editingId ? 'Edit Menu' : 'Tambah Menu Baru'}</h3>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Nama Menu</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Kategori</label>
                  <select required value={formData.category_id} onChange={e => setFormData({ ...formData, category_id: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white">
                    <option value="">Pilih...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Harga (Rp)</label>
                  <input required type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                </div>
              </div>

              {/* INPUT TEXTAREA DESKRIPSI MENU */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Deskripsi Menu</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
        s          placeholder="Contoh: Nasi padang porsi kenyang lengkap dengan rendang, sayur nangka, dan sambal hijau..."
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Upload Gambar Menu</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setFormData({ ...formData, image: e.target.files[0] })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Biarkan kosong jika tidak ingin mengubah gambar (saat edit).
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors">Batal</button>
                <button type="submit" className="flex-1 bg-emerald-500 text-white font-bold py-3 rounded-xl hover:bg-emerald-600 transition-colors">Simpan Menu</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}