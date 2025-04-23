import { useState } from 'react';
import axios from 'axios';
import 'animate.css';

const RegisterForm = () => {
  const [form, setForm] = useState({ username: '', email: '', password: '' });

  const register = async () => {
    try {
      const res = await axios.post('http://localhost:5000/register', form);
      alert(res.data.message);
    } catch (err) {
      alert("Registrasi gagal! Pastikan email belum terdaftar.");
    }
  };

  return (
    <div className="card p-4 shadow animate__animated animate__fadeInRight" data-aos="zoom-in">
      <h4 className="mb-3 text-center text-success">📝 Register</h4>

      <input
        className="form-control mb-3"
        type="text"
        placeholder="Username"
        onChange={(e) => setForm({ ...form, username: e.target.value })}
      />

      <input
        className="form-control mb-3"
        type="email"
        placeholder="Email"
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />

      <input
        className="form-control mb-4"
        type="password"
        placeholder="Password"
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />

      <button className="btn btn-success w-100" onClick={register}>
        Daftar
      </button>
    </div>
  );
};

export default RegisterForm;
