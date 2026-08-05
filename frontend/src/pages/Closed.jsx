import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

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

                    // Jika kantin dibuka kembali oleh admin, kembalikan user ke katalog
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
            // Gunakan URL relatif /settings (mengikuti proxy Axios) agar bebas CORS Ngrok
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
                    Pemesanan hanya dapat dilakukan saat kantin dibuka.
                </p>

                <input
                    type="password"
                    placeholder="Masukkan Password Guru"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    className="border border-slate-200 rounded-xl w-full p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />

                {error && (
                    <p className="text-rose-500 font-medium text-xs mt-3">
                        {error}
                    </p>
                )}

                <button
                    onClick={handleLogin}
                    className="mt-5 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl py-3 text-sm transition-colors shadow-md shadow-emerald-600/20"
                >
                    Masuk Sebagai Guru
                </button>
            </div>
        </div>
    );
}