import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'animate.css';

const API_URL = "https://6ea40469-1d71-4ae9-a062-fd248795b654-00-3j49ez9d9x36p.kirk.replit.dev";

const LoginForm = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!email || !password) {
      toast.warn("Email dan password tidak boleh kosong!");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/login`, { email, password });

      toast.success("🎉 Login berhasil!");
      onLogin(res.data.is_premium, email, res.data.is_admin, res.data.tokens);
    } catch {
      toast.error("❌ Login gagal! Periksa kembali email dan password kamu.");
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
      />

      <input
        className="form-control mb-4"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button className="btn btn-primary w-100" onClick={login} disabled={loading}>
        {loading ? "Loading..." : "Masuk"}
      </button>
    </div>
  );
};

export default LoginForm;
