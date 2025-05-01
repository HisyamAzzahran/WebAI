import { useState } from 'react';
import axios from 'axios';
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import EssayGenerator from "./components/EssayGenerator";
import KTIGenerator from "./components/KTIGenerator";
import BusinessPlanGenerator from "./components/BusinessPlanGenerator"; // 🔥 Tambahan BusinessPlanGenerator
import AdminDashboard from "./components/AdminDashboard";
import ModeSelector from "./components/ModeSelector";
import EssayExchangesGenerator from "./components/EssayExchangesGenerator";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// URL backend kamu
const API_URL = "http://asia-southeast1.registry.rlwy.net/c8cbb86a-b1ef-430c-b83c-0ce0ac333d41:dea91d7b-b45b-4ad2-92d7-069cc26d7530";

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState('');
  const [tokens, setTokens] = useState(0);
  const [showRegister, setShowRegister] = useState(false);
  const [selectedMode, setSelectedMode] = useState(null); // Mode: essay, kti, atau bp

  return (
    <div className="container mt-4">
      <ToastContainer position="top-right" autoClose={2500} />

      <h1 className="text-center text-primary fw-bold mb-4">
        🎓 ElevaAI: Bestie AI Asisten Buat Lomba Kamu
      </h1>

      {!isLoggedIn ? (
        <>
          {showRegister ? (
            <>
              <RegisterForm apiUrl={API_URL} />
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
                apiUrl={API_URL}
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
          <AdminDashboard apiUrl={API_URL} />
        ) : (
          <>
            {!selectedMode ? (
              <ModeSelector onSelectMode={setSelectedMode} />
            ) : (
              <>
                {/* Tombol Kembali */}
                <div className="text-center mb-3">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => setSelectedMode(null)}
                  >
                    ⬅️ Kembali ke Menu
                  </button>
                </div>

                {/* Konten berdasarkan pilihan mode */}
                {selectedMode === "essay" ? (
                  <EssayGenerator
                    isPremium={isPremium}
                    email={email}
                    tokenSisa={tokens}
                    setTokenSisa={setTokens}
                    apiUrl={API_URL}
                  />
                ) : selectedMode === "kti" ? (
                  <KTIGenerator
                    isPremium={isPremium}
                    email={email}
                    tokenSisa={tokens}
                    setTokenSisa={setTokens}
                    apiUrl={API_URL}
                  />
                ) : selectedMode === "bp" ? (
                  <BusinessPlanGenerator
                    isPremium={isPremium}
                    email={email}
                    tokenSisa={tokens}
                    setTokenSisa={setTokens}
                    apiUrl={API_URL}
                  />
                ) : selectedMode === "exchanges" ? (
                  <EssayExchangesGenerator
                    isPremium={isPremium}
                    email={email}
                    tokenSisa={tokens}
                    setTokenSisa={setTokens}
                    apiUrl={API_URL}
                  />
                ) : null}

                {/* Info Token */}
                <div className="alert alert-info text-center mt-4">
                  🎯 Token Tersisa: <strong>{tokens}</strong>
                </div>

                {/* Info Upgrade Premium */}
                {!isPremium && (
                  <div className="alert alert-warning mt-2 text-center">
                    🚀 Kamu user basic. Untuk akses semua fitur premium, upgrade akunmu!
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
            )}
          </>
        )
      )}
    </div>
  );
};

export default App;
