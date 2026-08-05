import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";

export default function Closed() {
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [allowed, setAllowed] = useState(false);

    useEffect(() => {

    const loadSettings = () => {

        axios.get("http://127.0.0.1:8000/api/settings")
            .then(res => {

                const settings = res.data.data || {};

                if (settings.kantin_open === "1") {
                    window.location.href = "/";
                }

            });

    };

    loadSettings();

    const interval = setInterval(loadSettings, 2000);

    return () => clearInterval(interval);

}, []);

    const handleLogin = async () => {
        try {
            const res = await axios.get("http://127.0.0.1:8000/api/settings");

            const settings = res.data.data;

            if (password === settings.guru_password) {
                sessionStorage.setItem("teacher_access", "1");
    setAllowed(true);
            } else {
    setError("Password guru salah.");
            }
        } catch {
            setError("Server tidak dapat dihubungi.");
        }
    };

    if (allowed) {
        sessionStorage.setItem("teacher_access", "1");
        return <Navigate to="/" replace />;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
            <div className="bg-white rounded-3xl shadow-xl p-8 w-96">

                <h1 className="text-2xl font-bold mb-2">
                    Kantin Sedang Ditutup
                </h1>

                <p className="text-slate-500 mb-6">
                    Pemesanan hanya dapat dilakukan saat kantin dibuka.
                </p>

                <input
                    type="password"
                    placeholder="Password Guru"
                    value={password}
                    onChange={(e)=>setPassword(e.target.value)}
                    className="border rounded-xl w-full p-3"
                />

                {error && (
                    <p className="text-red-500 text-sm mt-3">
                        {error}
                    </p>
                )}

                <button
                    onClick={handleLogin}
                    className="mt-5 w-full bg-emerald-600 text-white rounded-xl py-3"
                >
                    Masuk Sebagai Guru
                </button>

            </div>
        </div>
    );
}