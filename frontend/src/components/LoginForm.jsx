import { useState } from 'react';
import axios from 'axios';
import 'animate.css';

const LoginForm = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const login = async () => {
    try {
      const res = await axios.post('http://localhost:5000/login', { email, password });
      alert(res.data.message);
      onLogin(res.data.is_premium, email, res.data.is_admin);
    } catch {
      alert("Login gagal! Periksa kembali email dan password kamu.");
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

      <button className="btn btn-primary w-100" onClick={login}>
        Masuk
      </button>
    </div>
  );
};

export default LoginForm;
