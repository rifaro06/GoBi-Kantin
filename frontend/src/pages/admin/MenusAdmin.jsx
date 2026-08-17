import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Plus, Edit, Trash2, CheckCircle2, XCircle, Search, ChevronRight, Layers
} from 'lucide-react';

export default function MenusAdmin() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all'); // State Filter Kategori

  // State untuk Modal Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '', category_id: '', price: '', handling_fee: '', description: '', image: '', is_available: true
  });

  // HELPER: Mencegah gambar pecah
  const getImageUrl = (url) => {
    if (!url) return 'https://placehold.co/400x300?text=No+Image';
    if (typeof url !== 'string') return url;
    return url.replace(/^http:\/\/(127\.0\.0\.1|localhost):8000/, '');
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/admin/products');
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
      handling_fee: '',
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
      handling_fee: product.handling_fee || '',
      description: product.description || '',
      image: product.image,
      is_available: product.is_available
    });
    setIsModalOpen(true);
  };

  // Simpan data (Create / Update)
  const handleSave = async (e) => {
    e.preventDefault();

    const submitData = new FormData();
    submitData.append('name', formData.name);
    submitData.append('category_id', formData.category_id);
    submitData.append('price', formData.price);
    submitData.append('handling_fee', formData.handling_fee || 0);
    submitData.append('description', formData.description || '');
    submitData.append('is_available', formData.is_available ? 1 : 0);

    if (formData.image instanceof File) {
      submitData.append('image', formData.image);
    }

    try {
      if (editingId) {
        submitData.append('_method', 'PUT');
        await axios.post(`/admin/products/${editingId}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axios.post('/admin/products', submitData, {
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
        await axios.delete(`/admin/products/${id}`);
        fetchData();
      } catch (error) {
        alert('Gagal menghapus menu!');
      }
    }
  };

  // Toggle status Tersedia / Habis
  const toggleAvailability = async (product) => {
    try {
      await axios.put(`/admin/products/${product.id}`, {
        name: product.name,
        category_id: product.category_id,
        price: product.price,
        handling_fee: product.handling_fee || 0,
        description: product.description || '',
        is_available: !product.is_available ? 1 : 0
      });
      fetchData();
    } catch (error) {
      console.error('Gagal update status:', error);
      alert('Gagal mengubah status menu!');
    }
  };

  // Filter pencarian teks nama menu
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // MENGHILANGKAN KATEGORI GANDA PADA DROPDOWN FORM & TABS
  const uniqueCategories = Array.from(new Set(categories.map(c => c.name))).map(catName => {
    return categories.find(c => c.name === catName);
  }).filter(Boolean);

  // KATEGORI YANG DITAMPILKAN BERDASARKAN TAB AKTIF
  const displayedCategories = selectedCategory === 'all'
    ? uniqueCategories
    : uniqueCategories.filter(c => String(c.id) === String(selectedCategory) || c.name === selectedCategory);

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
          <button onClick={handleAdd} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 text-sm transition-colors cursor-pointer">
            <Plus className="w-4 h-4" /> Tambah Menu
          </button>
        </div>
      </div>

      {/* TAB FILTER KATEGORI (KAPSUL NAVIGASI) */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs mb-6 overflow-x-auto flex items-center gap-2 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-5 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all whitespace-nowrap cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
          }`}
        >
          Semua
        </button>

        {uniqueCategories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-5 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all whitespace-nowrap cursor-pointer ${
              String(selectedCategory) === String(cat.id)
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* LIST MENU BERDASARKAN KATEGORI */}
      {loading ? (
        <div className="text-center py-10 text-slate-500 animate-pulse font-medium">Memuat data menu...</div>
      ) : (
        <div className="space-y-8">
          {displayedCategories.map(category => {
            // Filter produk berdasarkan kategori dan urutkan HARGA TERMURAH ke TERMAHAL
            const categoryProducts = filteredProducts
              .filter(p => p.category_id === category.id || p.category?.name === category.name)
              .sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));

            // Jika kategori tidak memiliki produk yang cocok (atau hasil pencarian kosong), lewati
            if (categoryProducts.length === 0) return null;

            return (
              <div key={category.id} className="space-y-3">
                {/* JUDUL KATEGORI HEADER (DENGAN ICON PANAH >) */}
                <div className="flex items-center gap-1">
                  <h3 className="text-lg font-black text-slate-800 tracking-tight">{category.name}</h3>
                  <ChevronRight className="w-5 h-5 text-emerald-500 stroke-[3]" />
                </div>

                {/* GRID PRODUK DALAM KATEGORI TERSEBUT */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {categoryProducts.map(product => (
                    <div key={product.id} className={`bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col transition-opacity ${!product.is_available && 'opacity-70 grayscale-50'}`}>
                      <div className="h-40 bg-slate-100 relative">
                        <img 
                          src={getImageUrl(product.image)} 
                          alt={product.name} 
                          className="w-full h-full object-cover" 
                        />
                        <button
                          onClick={() => toggleAvailability(product)}
                          className={`absolute top-2 right-2 px-3 py-1 text-[10px] font-black rounded-full uppercase border backdrop-blur-md cursor-pointer ${product.is_available ? 'bg-emerald-500/90 text-white border-emerald-400 hover:bg-emerald-600' : 'bg-rose-500/90 text-white border-rose-400 hover:bg-rose-600'}`}
                        >
                          {product.is_available ? 'Tersedia' : 'Habis'}
                        </button>
                      </div>
                      <div className="p-4 flex-1 flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{product.category?.name}</span>
                        <h3 className="font-bold text-slate-800 text-sm leading-tight mb-1">{product.name}</h3>
                        
                        {/* PREVIEW DESKRIPSI DI CARD */}
                        <p className="text-xs text-slate-400 line-clamp-2 mb-3 min-h-8">
                          {product.description || 'Tidak ada deskripsi'}
                        </p>

                        {/* TAMPILAN HARGA & BIAYA KEMASAN */}
                        <div className="flex items-center justify-between mt-auto">
                          <span className="font-black text-emerald-600">Rp{Number(product.price).toLocaleString('id-ID')}</span>
                          {Number(product.handling_fee) > 0 && (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              +Kemasan Rp{Number(product.handling_fee).toLocaleString('id-ID')}
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                          <button onClick={() => handleEdit(product)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg text-xs font-bold flex justify-center items-center gap-1 transition-colors cursor-pointer">
                            <Edit className="w-3 h-3" /> Edit
                          </button>
                          <button onClick={() => handleDelete(product.id)} className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 py-2 rounded-lg text-xs font-bold flex justify-center items-center gap-1 transition-colors cursor-pointer">
                            <Trash2 className="w-3 h-3" /> Hapus
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-lg">{editingId ? 'Edit Menu' : 'Tambah Menu Baru'}</h3>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Nama Menu</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Kategori</label>
                <select required value={formData.category_id} onChange={e => setFormData({ ...formData, category_id: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white">
                  <option value="">Pilih...</option>
                  {uniqueCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Harga Menu (Rp)</label>
                  <input required type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Biaya Kemasan (Rp)</label>
                  <input type="number" value={formData.handling_fee} onChange={e => setFormData({ ...formData, handling_fee: e.target.value })} placeholder="Cth: 500" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Deskripsi Menu</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Contoh: Nasi padang porsi kenyang lengkap dengan rendang..."
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
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer">Batal</button>
                <button type="submit" className="flex-1 bg-emerald-500 text-white font-bold py-3 rounded-xl hover:bg-emerald-600 transition-colors cursor-pointer">Simpan Menu</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}