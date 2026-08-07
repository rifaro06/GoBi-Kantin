import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ClipboardList, ShieldCheck } from "lucide-react"; // Import ikon

export default function Closed() {
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const loadSettings = () => {
            axios.get("/settings")
                .then(res => {
                    const rawData = res.data.data || res.data || {};
                    let normalized = {};

                    if (Array.isArray(rawData)) {
                        rawData.forEach(item => { normalized[item.key] = item.value; });
                    } else if (typeof rawData === 'object') {
                        normalized = { ...rawData };
                    }

                    const isOpen = normalized.kantin_open == 1 || normalized.kantin_open === "1" || normalized.kantin_open === true;

                    if (isOpen) {
                        navigate("/");
                    }
                })
                .catch(err => console.error("Error checking canteen status:", err));
        };

        loadSettings();
        const interval = setInterval(loadSettings, 3000);

        return () => clearInterval(interval);
    }, [navigate]);

    const handleLogin = async () => {
        setError("");
        try {
            const res = await axios.get("/settings");
            const rawData = res.data.data || res.data || {};

            let normalized = {};
            if (Array.isArray(rawData)) {
                rawData.forEach(item => { normalized[item.key] = item.value; });
            } else if (typeof rawData === 'object') {
                normalized = { ...rawData };
            }

            if (password === normalized.guru_password) {
                sessionStorage.setItem("teacher_access", "1");
                navigate("/");
            } else {
                setError("Password guru salah.");
            }
        } catch (err) {
            console.error(err);
            setError("Server tidak dapat dihubungi.");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 font-sans p-4">
            <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-sm border border-slate-100">
                <h1 className="text-2xl font-bold mb-2 text-slate-800">
                    Kantin Sedang Ditutup
                </h1>

                <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                    Pemesanan baru tidak dapat dilakukan saat kantin tutup.
                </p>

                {/* AKSES LACAK PESANAN UNTUK SISWA */}
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200/80 rounded-2xl space-y-2">
                    <p className="text-xs font-bold text-emerald-900">
                        Sudah pesan sebelum kantin tutup?
                    </p>
                    <p className="text-[11px] text-emerald-700 leading-snug">
                        Kamu tetap bisa mengecek status pengantaran makanan atau bayar QRIS.
                    </p>
                    <button
                        onClick={() => navigate('/track')}
                        className="mt-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl py-2.5 text-xs transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                        <ClipboardList className="w-4 h-4" />
                        Lacak Status Pesanan Saya
                    </button>
                </div>

                <hr className="border-slate-100 my-5" />

                {/* FORM LOGIN GURU */}
                <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <ShieldCheck className="w-4 h-4 text-slate-500" /> Akses Khusus Guru
                    </label>
                    <input
                        type="password"
                        placeholder="Masukkan Password Guru"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                        className="border border-slate-200 rounded-xl w-full p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />

                    {error && (
                        <p className="text-rose-500 font-medium text-xs">
                            {error}
                        </p>
                    )}

                    <button
                        onClick={handleLogin}
                        className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl py-3 text-sm transition-colors shadow-md"
                    >
                        Masuk Sebagai Guru
                    </button>
                </div>
            </div>
        </div>
    );
}