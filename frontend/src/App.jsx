import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import EssayGenerator from "./components/EssayGenerator";
import KTIGenerator from "./components/KTIGenerator";
import BusinessPlanGenerator from "./components/BusinessPlanGenerator";
import AdminDashboard from "./components/AdminDashboard";
import ModeSelector from "./components/ModeSelector";
import EssayExchangesGenerator from "./components/EssayExchangesGenerator";
import InterviewPage from './components/InterviewPage';
import ResultPage from './components/ResultPage';
import TopBar from './components/TopBar';
import BioAnalyzer from "./components/BioAnalyzer";
import IkigaiInputForm from './components/Ikigai/IkigaiInputForm';
import IkigaiTestLink from './components/Ikigai/IkigaiTestLink';
import IkigaiAnalyzer from './components/Ikigai/IkigaiAnalyzer';
import IkigaiFinalAnalyzer from './components/Ikigai/IkigaiFinalAnalyzer';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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

  return (
    <div className="container mt-4">
      <TopBar email={email} isPremium={isPremium} />
      <ToastContainer position="top-right" autoClose={2500} />

      <Routes>
        <Route
          path="/"
          element={
            !isLoggedIn ? (
              showRegister ? (
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
                  <div className="text-center mt-2">
                    <small>Belum punya akun?</small><br />
                    <button className="btn btn-outline-success mt-1" onClick={() => setShowRegister(true)}>
                      Daftar
                    </button>
                  </div>
                </>
              )
            ) : isAdmin ? (
              <AdminDashboard apiUrl={API_URL} />
            ) : (
              <>
                {!selectedMode ? (
                  <ModeSelector onSelectMode={setSelectedMode} isPremium={isPremium} />
                ) : (
                  <>
                    <div className="text-center mb-3">
                      <button
                        className="btn btn-outline-secondary"
                        onClick={() => {
                          setShowResult(false);
                          setSelectedMode(null);
                          setIkigaiStep(1);
                        }}
                      >
                        ⬅️ Kembali ke Menu
                      </button>
                    </div>

                    {selectedMode === "essay" && (
                      <EssayGenerator
                        isPremium={isPremium}
                        email={email}
                        tokenSisa={tokens}
                        setTokenSisa={setTokens}
                        apiUrl={API_URL}
                      />
                    )}
                    {selectedMode === "kti" && (
                      <KTIGenerator
                        isPremium={isPremium}
                        email={email}
                        tokenSisa={tokens}
                        setTokenSisa={setTokens}
                        apiUrl={API_URL}
                      />
                    )}
                    {selectedMode === "bp" && (
                      <BusinessPlanGenerator
                        isPremium={isPremium}
                        email={email}
                        tokenSisa={tokens}
                        setTokenSisa={setTokens}
                        apiUrl={API_URL}
                      />
                    )}
                    {selectedMode === "exchanges" && (
                      <EssayExchangesGenerator
                        isPremium={isPremium}
                        email={email}
                        tokenSisa={tokens}
                        setTokenSisa={setTokens}
                        apiUrl={API_URL}
                      />
                    )}
                    {selectedMode === "interview" && !showResult && (
                      <InterviewPage
                        isPremium={isPremium}
                        email={email}
                        tokenSisa={tokens}
                        setTokenSisa={setTokens}
                        apiUrl={API_URL}
                        onFinish={(result) => {
                          setResultData(result);
                          setShowResult(true);
                        }}
                      />
                    )}
                    {selectedMode === "interview" && showResult && (
                      <ResultPage
                        {...resultData}
                        onRestart={() => {
                          setShowResult(false);
                          setSelectedMode(null);
                        }}
                      />
                    )}
                    {selectedMode === "bio" && (
                      <BioAnalyzer
                        isPremium={isPremium}
                        email={email}
                        tokenSisa={tokens}
                        setTokenSisa={setTokens}
                        apiUrl={API_URL}
                      />
                    )}
                    {selectedMode === "ikigai" && (
                      <>
                        {ikigaiStep === 1 && (
                          <IkigaiInputForm
                            onNext={() => setIkigaiStep(2)}
                            saveUserData={setUserIkigaiData}
                          />
                        )}
                        {ikigaiStep === 2 && (
                          <IkigaiTestLink
                            onNext={() => setIkigaiStep(3)}
                          />
                        )}
                        {ikigaiStep === 3 && (
                          <IkigaiAnalyzer
                            email={email}
                            isPremium={isPremium}
                            tokenSisa={tokens}
                            setTokenSisa={setTokens}
                            userData={userIkigaiData}
                            onResult={(res) => {
                              setIkigaiSpotList(res.spotList);
                              setSliceList(res.sliceList);
                              setIkigaiStep(4);
                            }}
                          />
                        )}
                        {ikigaiStep === 4 && (
                          <IkigaiFinalAnalyzer
                            email={email}
                            isPremium={isPremium}
                            tokenSisa={tokens}
                            setTokenSisa={setTokens}
                            userData={userIkigaiData}
                            ikigaiSpotList={ikigaiSpotList}
                            sliceList={sliceList}
                          />
                        )}
                      </>
                    )}

                    <div className="alert alert-info text-center mt-4">
                      🎯 Token Tersisa: <strong>{tokens}</strong>
                    </div>

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
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export default App;