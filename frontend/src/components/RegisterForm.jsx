import { useState } from 'react';
import axios from 'axios';
import 'animate.css';

// URL backend langsung
const API_URL = "https://6ea40469-1d71-4ae9-a062-fd248795b654-00-3j49ez9d9x36p.kirk.replit.dev";

const RegisterForm = () => {
  const [form, setForm] = useState({ username: '', email: '', password: '' });

  const register = async () => {
    try {
      const res = await axios.post(`${API_URL}/register`, form);
      alert(res.data.message);
    } catch {
      alert("Registrasi gagal! Periksa ulang data kamu.");
    }
  };

  return (
    <div className="card shadow p-4 mt-4 animate__animated animate__fadeInRight">
      <h4 className="mb-3 text-center text-success">📝 Register</h4>

      <input className="form-control mb-2" type="text" placeholder="Username" onChange={e => setForm({ ...form, username: e.target.value })} />
      <input className="form-control mb-2" type="email" placeholder="Email" onChange={e => setForm({ ...form, email: e.target.value })} />
      <input className="form-control mb-3" type="password" placeholder="Password" onChange={e => setForm({ ...form, password: e.target.value })} />

      <button className="btn btn-success w-100" onClick={register}>Daftar</button>
    </div>
  );
};

export default RegisterForm;
