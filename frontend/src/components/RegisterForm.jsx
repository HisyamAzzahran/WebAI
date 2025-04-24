import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'animate.css';

const API_URL = "https://6ea40469-1d71-4ae9-a062-fd248795b654-00-3j49ez9d9x36p.kirk.replit.dev";

const RegisterForm = () => {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const register = async () => {
    if (!form.username || !form.email || !form.password) {
      toast.warn("Semua kolom wajib diisi!");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/register`, form);
      toast.success("🎉 Pendaftaran berhasil! Silakan login.");
      // Reset form (opsional)
      setForm({ username: '', email: '', password: '' });
    } catch {
      toast.error("❌ Registrasi gagal! Email atau username sudah digunakan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card shadow p-4 animate__animated animate__fadeInRight">
      <h4 className="text-center text-success mb-3">📝 Register</h4>
      
      <input
        className="form-control mb-2"
        type="text"
        placeholder="Username"
        value={form.username}
        onChange={e => setForm({ ...form, username: e.target.value })}
      />
      <input
        className="form-control mb-2"
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={e => setForm({ ...form, email: e.target.value })}
      />
      <input
        className="form-control mb-3"
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={e => setForm({ ...form, password: e.target.value })}
      />

      <button className="btn btn-success w-100" onClick={register} disabled={loading}>
        {loading ? "Loading..." : "Daftar"}
      </button>
    </div>
  );
};

export default RegisterForm;
