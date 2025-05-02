import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'animate.css';
import './RegisterForm.css';

const API_URL = "https://webai-production-b975.up.railway.app";

const RegisterForm = () => {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const register = async () => {
    if (!form.username || !form.email || !form.password) {
      toast.warn("⚠️ Semua kolom wajib diisi!");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/register`, form);
      toast.success("🎉 Pendaftaran berhasil! Silakan login.");
      setForm({ username: '', email: '', password: '' });
    } catch {
      toast.error("❌ Registrasi gagal! Email atau username sudah digunakan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-wrapper animate__animated animate__fadeInRight">
      <div className="register-card">
        <h3 className="text-success mb-4">📝 Daftar Akun ElevaAI</h3>

        <input
          className="form-input"
          type="text"
          placeholder="Username"
          value={form.username}
          onChange={e => setForm({ ...form, username: e.target.value })}
        />
        <input
          className="form-input"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
        />
        <input
          className="form-input"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
        />

        <button
          className="btn-register"
          onClick={register}
          disabled={loading}
        >
          {loading ? "⏳ Memproses..." : "Daftar"}
        </button>
      </div>
    </div>
  );
};

export default RegisterForm;
