import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import EssayGenerator from "./components/EssayGenerator";
import KTIGenerator from "./components/KTIGenerator";
import BusinessPlanGenerator from "./components/BusinessPlanGenerator";
import AdminDashboard from "./components/AdminDashboard";
import ModeSelector from "./components/ModeSelector"; // Akan kita modifikasi sedikit
import EssayExchangesGenerator from "./components/EssayExchangesGenerator";
import InterviewPage from './components/InterviewPage';
import ResultPage from './components/ResultPage';
import TopBar from './components/TopBar'; // Akan kita modifikasi sedikit
import BioAnalyzer from "./components/BioAnalyzer";
import IkigaiInputForm from './components/Ikigai/IkigaiInputForm';
import IkigaiTestLink from './components/Ikigai/IkigaiTestLink';
import IkigaiAnalyzer from './components/Ikigai/IkigaiAnalyzer';
import IkigaiFinalAnalyzer from './components/Ikigai/IkigaiFinalAnalyzer';
import TrackIkigai from './components/TrackIkigai';
import ElmoChatPage from './components/ElmoChatPage';
import SwotAnalyzer from './components/SwotAnalyzer';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css'; // IMPORT CSS KUSTOM ANDA

const API_URL = "https://webai-production-b975.up.railway.app";

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState('');
  const [tokens, setTokens] = useState(0);
  const [showRegister, setShowRegister] = useState(false);
  const [selectedMode, setSelectedMode] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [resultData, setResultData] = useState(null);

  // Ikigai State
  const [ikigaiStep, setIkigaiStep] = useState(1);
  const [userIkigaiData, setUserIkigaiData] = useState({});
  const [ikigaiSpotList, setIkigaiSpotList] = useState([]);
  const [sliceList, setSliceList] = useState([]);

  const handleLogin = (premium, userEmail, admin, tokenValue) => {
    setIsLoggedIn(true);
    setIsPremium(premium);
    setEmail(userEmail);
    setIsAdmin(admin);
    setTokens(tokenValue);
    setSelectedMode(null); // Reset mode on login
    setShowRegister(false);
  };

  const handleLogout = () => { // Fungsi Logout sederhana
    setIsLoggedIn(false);
    setIsPremium(false);
    setIsAdmin(false);
    setEmail('');
    setTokens(0);
    setSelectedMode(null);
    // Anda mungkin ingin membersihkan localStorage/sessionStorage jika ada
  };

  const resetToMenu = () => {
    setShowResult(false);
    setSelectedMode(null);
    setIkigaiStep(1);
    // Reset state lain yang relevan dengan mode jika ada
  };


  const renderAuthForms = () => (
    <div className="auth-wrapper">
      <div className="auth-card">
        {showRegister ? (
          <>
            <h3>Buat Akun Baru</h3>
            <RegisterForm apiUrl={API_URL} onRegisterSuccess={() => setShowRegister(false)} />
            <div className="text-center mt-3">
              <small>Sudah punya akun? </small>
              <span className="auth-toggle-link" onClick={() => setShowRegister(false)}>
                Masuk di sini
              </span>
            </div>
          </>
        ) : (
          <>
            <h3>Selamat Datang!</h3>
            <LoginForm
              apiUrl={API_URL}
              onLogin={handleLogin}
            />
            <div className="text-center mt-3">
              <small>Belum punya akun? </small>
              <span className="auth-toggle-link" onClick={() => setShowRegister(true)}>
                Daftar sekarang
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const renderSelectedModeContent = () => (
    <div className="main-content-wrapper">
      <button
        className="btn btn-outline-secondary back-to-menu-btn"
        onClick={resetToMenu}
      >
        {/* Ganti dengan ikon jika ada, misal dari react-icons */}
        ⬅️ Kembali ke Menu Utama
      </button>

      {selectedMode === "essay" && (
        <EssayGenerator isPremium={isPremium} email={email} tokenSisa={tokens} setTokenSisa={setTokens} apiUrl={API_URL} />
      )}
      {selectedMode === "kti" && (
        <KTIGenerator isPremium={isPremium} email={email} tokenSisa={tokens} setTokenSisa={setTokens} apiUrl={API_URL} />
      )}
      {selectedMode === "bp" && (
        <BusinessPlanGenerator isPremium={isPremium} email={email} tokenSisa={tokens} setTokenSisa={setTokens} apiUrl={API_URL} />
      )}
      {selectedMode === "exchanges" && (
        <EssayExchangesGenerator isPremium={isPremium} email={email} tokenSisa={tokens} setTokenSisa={setTokens} apiUrl={API_URL} />
      )}
      {selectedMode === "interview" && !showResult && (
        <InterviewPage isPremium={isPremium} email={email} tokenSisa={tokens} setTokenSisa={setTokens} apiUrl={API_URL}
          onFinish={(result) => {
            setResultData(result);
            setShowResult(true);
          }}
        />
      )}
      {selectedMode === "interview" && showResult && (
        <ResultPage {...resultData} onRestart={resetToMenu} />
      )}
      {selectedMode === "bio" && (
        <BioAnalyzer isPremium={isPremium} email={email} tokenSisa={tokens} setTokenSisa={setTokens} apiUrl={API_URL} />
      )}
      {selectedMode === "ikigai" && (
        <>
          {ikigaiStep === 1 && <IkigaiInputForm onNext={() => setIkigaiStep(2)} saveUserData={setUserIkigaiData} />}
          {ikigaiStep === 2 && <IkigaiTestLink onNext={() => setIkigaiStep(3)} />}
          {ikigaiStep === 3 && (
            <IkigaiAnalyzer email={email} isPremium={isPremium} tokenSisa={tokens} setTokenSisa={setTokens} userData={userIkigaiData}
              onResult={(res) => {
                setIkigaiSpotList(res.spotList || []);
                setSliceList(res.sliceList || []);
                setUserIkigaiData((prev) => ({ ...prev, mbti: res.mbti, via: res.via, career: res.career }));
                setIkigaiStep(4);
              }}
            />
          )}
          {ikigaiStep === 4 && (
            <IkigaiFinalAnalyzer email={email} isPremium={isPremium} tokenSisa={tokens} setTokenSisa={setTokens} userData={userIkigaiData} ikigaiSpotList={ikigaiSpotList} sliceList={sliceList} />
          )}
        </>
      )}
      {selectedMode === "swot" && (
        <SwotAnalyzer isPremium={isPremium} email={email} tokenSisa={tokens} setTokenSisa={setTokens} userData={{ nama: email.split("@")[0] }} />
      )}
      {selectedMode === "sasaa" && (
        <ElmoChatPage email={email} isPremium={isPremium} tokenSisa={tokens} setTokenSisa={setTokens} />
      )}

      <div className="alert alert-info text-center mt-4 token-info-alert">
        🎯 Token Tersisa: <strong>{tokens}</strong>
      </div>

      {!isPremium && (
        <div className="alert alert-warning mt-3 text-center premium-alert">
          <strong>🚀 Upgrade ke Premium!</strong>
          <p className="mb-2 mt-1">Akses semua fitur premium dan dapatkan lebih banyak token.</p>
          <a
            href="https://wa.me/6282211929271"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-success btn-sm"
          >
            Upgrade Sekarang
          </a>
        </div>
      )}
    </div>
  );


  return (
    <div className="app-container container mt-3"> {/* Menggunakan app-container dan mt-3 bukan mt-4 */}
      {isLoggedIn && <TopBar email={email} isPremium={isPremium} onLogout={handleLogout} />}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored"/>

      <Routes>
        <Route
          path="/"
          element={
            !isLoggedIn ? (
              renderAuthForms()
            ) : isAdmin ? (
              <AdminDashboard apiUrl={API_URL} />
            ) : !selectedMode ? (
              <ModeSelector onSelectMode={setSelectedMode} isPremium={isPremium} />
            ) : (
              renderSelectedModeContent()
            )
          }
        />
        <Route path="/admin/track-ikigai" element={isLoggedIn && isAdmin ? <TrackIkigai /> : <Navigate to="/" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export default App;