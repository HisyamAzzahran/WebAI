import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'animate.css';
import './LoginForm.css';

const API_URL = "https://webai-production-b975.up.railway.app";

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
    <div className="login-wrapper animate__animated animate__fadeInUp">
      <div className="login-card">
        <h3 className="text-primary mb-4">🔐 Masuk ke ElevaAI</h3>

        <input
          className="login-input"
          type="email"
          placeholder="Email kamu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />

        <input
          className="login-input"
          type="password"
          placeholder="Kata sandi"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />

        <button
          className="login-button"
          onClick={login}
          disabled={loading}
        >
          {loading ? "⏳ Memproses..." : "Masuk"}
        </button>
      </div>
    </div>
  );
};

export default LoginForm;
