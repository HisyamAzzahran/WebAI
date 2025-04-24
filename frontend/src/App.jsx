import { useState } from 'react';
import axios from 'axios';
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import EssayGenerator from "./components/EssayGenerator";
import AdminDashboard from "./components/AdminDashboard";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = import.meta.env.VITE_BACKEND_URL;

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState('');
  const [tokens, setTokens] = useState(0);
  const [showRegister, setShowRegister] = useState(false);

  return (
    <div className="container mt-4">
      <ToastContainer position="top-right" autoClose={2500} />

      <h1 className="text-center text-primary fw-bold mb-4">
        🎓 Web AI Essay Generator
      </h1>

      {!isLoggedIn ? (
        <>
          {showRegister ? (
            <>
              <RegisterForm />
              <div className="text-center mt-3">
                <small>Sudah punya akun?</small><br />
                <button className="btn btn-outline-primary mt-1" onClick={() => setShowRegister(false)}>
                  Masuk
                </button>
              </div>
            </>
          ) : (
            <>
              <LoginForm
                onLogin={(premium, email, admin, tokenValue) => {
                  setIsLoggedIn(true);
                  setIsPremium(premium);
                  setEmail(email);
                  setIsAdmin(admin);
                  setTokens(tokenValue);
                }}
              />
              <div className="text-center mt-3">
                <small>Belum punya akun?</small><br />
                <button className="btn btn-outline-success mt-1" onClick={() => setShowRegister(true)}>
                  Daftar
                </button>
              </div>
            </>
          )}
        </>
      ) : (
        isAdmin ? (
          <AdminDashboard />
        ) : (
          <>
            <EssayGenerator isPremium={isPremium} email={email} />
            <div className="alert alert-info text-center mt-4">
              🎯 Token Tersisa: <strong>{tokens}</strong>
            </div>
            {!isPremium && (
              <div className="alert alert-warning mt-2 text-center">
                Kamu user basic. Untuk akses semua sub-tema, upgrade ke premium!
                <br />
                <a
                  href="https://wa.me/6282211929271"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-success mt-2"
                >
                  Upgrade ke Premium
                </a>
              </div>
            )}
          </>
        )
      )}
    </div>
  );
};

export default App;
