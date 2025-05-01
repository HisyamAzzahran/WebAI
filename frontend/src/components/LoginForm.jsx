import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'animate.css';

// URL backend kamu
const API_URL = "webai-production-b975.up.railway.app";

const LoginForm = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!email || !password) {
      toast.warn("⚠️ Email dan password harus diisi!");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/login`, { email, password });
      toast.success("✅ " + res.data.message);
      onLogin(res.data.is_premium, email, res.data.is_admin, res.data.tokens);
    } catch {
      toast.error("❌ Login gagal! Cek kembali email dan password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card shadow p-4 animate__animated animate__fadeInLeft" data-aos="zoom-in">
      <h4 className="mb-3 text-center text-primary">🔐 Login</h4>

      <input
        className="form-control mb-3"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading}
      />

      <input
        className="form-control mb-4"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={loading}
      />

      <button
        className="btn btn-primary w-100"
        onClick={login}
        disabled={loading}
      >
        {loading ? "⏳ Memproses..." : "Masuk"}
      </button>
    </div>
  );
};

export default LoginForm;
