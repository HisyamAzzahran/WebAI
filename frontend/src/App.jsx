import { useState, useEffect } from 'react';
import axios from 'axios';
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import EssayGenerator from "./components/EssayGenerator";
import AdminDashboard from "./components/AdminDashboard"; // kalau kamu pisah file

const API_URL = "https://6ea40469-1d71-4ae9-a062-fd248795b654-00-3j49ez9d9x36p.kirk.replit.dev";

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState('');
  const [showRegister, setShowRegister] = useState(false); // toggle form login/register

  return (
    <div className="container mt-4">
      <h1 className="text-center text-primary fw-bold">🎓 Web AI Essay Generator</h1>

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
              <LoginForm onLogin={(premium, email, admin) => {
                setIsLoggedIn(true);
                setIsPremium(premium);
                setEmail(email);
                setIsAdmin(admin);
              }} />
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
            {!isPremium && (
              <div className="alert alert-warning mt-4 text-center">
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
