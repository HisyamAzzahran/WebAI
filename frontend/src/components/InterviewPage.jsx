import React, { useState, useEffect } from 'react';
import '../styles/InterviewPage.css';
import 'animate.css';
import AudioRecorder from './AudioRecorder';
import axios from 'axios';

function InterviewPage({ isPremium, email, tokenSisa, setTokenSisa, apiUrl, onFinish }) {
  const [question, setQuestion] = useState('Klik "Mulai Interview" untuk memulai.');
  const [answer, setAnswer] = useState('');
  const [answersHistory, setAnswersHistory] = useState([]);
  const [questionsHistory, setQuestionsHistory] = useState([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [username, setUsername] = useState('');
  const [showTyping, setShowTyping] = useState(false);
  const [showModal, setShowModal] = useState(true);
  const [tempName, setTempName] = useState('');
  const [showTokenModal, setShowTokenModal] = useState(false);

  const [cvFile, setCvFile] = useState(null);
  const [cvSummary, setCvSummary] = useState('');
  const [interviewType, setInterviewType] = useState('');
  const [language, setLanguage] = useState('id');
  const [scholarshipName, setScholarshipName] = useState('');
  const [internshipPosition, setInternshipPosition] = useState('');
  const [showInterviewOptions, setShowInterviewOptions] = useState(false);

  const API_BASE = apiUrl || import.meta.env.VITE_API_URL || 'https://webai-production-b975.up.railway.app';

  useEffect(() => {
    setUsername('');
    setTempName('');
    setCvFile(null);
    setInterviewType('');
    setLanguage('id');
    setScholarshipName('');
    setInternshipPosition('');
    setCvSummary('');
    setShowModal(true);
    localStorage.removeItem('username');
    fetch(`${API_BASE}/delete_cv`, { method: 'POST' }).catch(err => console.log("CV tidak ditemukan."));
  }, []);

  const logFeature = async () => {
    try {
      await axios.post(`${API_BASE}/log-feature`, {
        email,
        feature: "Interview Simulator"
      });
    } catch (error) {
      console.error("Gagal log fitur:", error);
    }
  };

  const handleNameSubmit = () => {
    if (tempName.trim()) {
      setUsername(tempName.trim());
      setShowModal(false);
      setShowInterviewOptions(true);
    } else {
      alert("Nama tidak boleh kosong.");
    }
  };

  const askQuestion = async (jawaban, fullHistory = []) => {
    try {
      const res = await fetch(`${API_BASE}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answer: jawaban,
          username,
          history: fullHistory,
          interviewType,
          language,
          scholarshipName,
          internshipPosition,
          cv_summary: cvSummary
        })
      });
      const data = await res.json();
      return data.question;
    } catch (err) {
      console.error('Error fetching question:', err);
      return 'Terjadi kesalahan saat mengambil pertanyaan.';
    }
  };

  const speakText = async (text) => {
    try {
      const res = await fetch(`${API_BASE}/speak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const blob = await res.blob();
      const audioURL = URL.createObjectURL(blob);
      new Audio(audioURL).play();
    } catch (err) {
      console.error('Error playing TTS:', err);
    }
  };

  const handleStart = async () => {
    if (!username) return alert("Nama belum dimasukkan.");
    if (isPremium && tokenSisa < 5) return setShowTokenModal(true);

    if (cvFile) {
      const formData = new FormData();
      formData.append('cv', cvFile);
      try {
        const res = await fetch(`${API_BASE}/upload_cv`, {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (data.cv_summary) setCvSummary(data.cv_summary);
      } catch (err) {
        console.error("Gagal upload CV:", err);
      }
    }

    logFeature();
    setShowTyping(true);

    let pembukaPrompt = "Ajukan satu pertanyaan pembuka kepada pelamar bernama Saudara " + username + ".";
    if (interviewType === "beasiswa") {
      pembukaPrompt = language === "en"
        ? `As a prestigious scholarship interviewer, ask ONE formal opening question to the applicant Mr./Ms. ${username}, focusing specifically on their motivation for applying to the ${scholarshipName} scholarship.`
        : `Sebagai pewawancara seleksi beasiswa ${scholarshipName}, ajukan SATU pertanyaan pembuka secara formal kepada pelamar bernama Saudara ${username}. Fokuskan pada motivasi mendaftar beasiswa ini.`;
    } else if (interviewType === "magang") {
      pembukaPrompt = `Sebagai pewawancara dari perusahaan profesional, ajukan SATU pertanyaan pembuka kepada Saudara ${username} yang melamar posisi magang sebagai \"${internshipPosition}\".`;
    }

    const firstQuestion = await askQuestion(pembukaPrompt);
    setTimeout(() => {
      setShowTyping(false);
      setQuestion(firstQuestion);
      setQuestionsHistory([firstQuestion]);
      speakText(firstQuestion);
    }, 1000);
  };

  const handleTranscription = async (transcript) => {
    if (isPremium && tokenSisa < 5) return alert("Token tidak cukup untuk melanjutkan interview.");

    setAnswer(transcript);
    const updatedAnswers = [...answersHistory, transcript];
    const updatedQuestions = [...questionsHistory];
    const combinedHistory = updatedQuestions.map((q, i) => ({ q, a: updatedAnswers[i] || "" }));

    if (questionCount >= 4) {
      if (setTokenSisa) setTokenSisa(tokenSisa - 5);
      if (onFinish) onFinish({ username, answers: updatedAnswers, email, tokenSisa: tokenSisa - 5, isPremium, interviewType, language, scholarshipName, internshipPosition, cv_summary: cvSummary });
      return;
    }

    setShowTyping(true);
    const nextQuestion = await askQuestion(transcript, combinedHistory);
    setTimeout(() => {
      setShowTyping(false);
      setQuestion(nextQuestion);
      setAnswersHistory(updatedAnswers);
      setQuestionsHistory([...updatedQuestions, nextQuestion]);
      setQuestionCount(prev => prev + 1);
      speakText(nextQuestion);
    }, 1000);
  };

  return (
    <div className="container">
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content animate__animated animate__zoomIn">
            <h3>👋 Hai, siapa nama panggilan kamu?</h3>
            <input type="text" className="form-control my-3" value={tempName} onChange={(e) => setTempName(e.target.value)} placeholder="Masukkan nama kamu..." />
            <button onClick={handleNameSubmit} className="btn btn-success">Lanjut</button>
          </div>
        </div>
      )}

      {showInterviewOptions && (
        <div className="modal-overlay">
          <div className="modal-content animate__animated animate__fadeIn">
            <h3>📄 Upload CV (opsional)</h3>
            <input type="file" accept=".pdf,.doc,.docx" className="form-control my-2" onChange={(e) => setCvFile(e.target.files[0])} />
            <hr />
            <h4>Pilih Jenis Interview</h4>
            <label><input type="radio" name="interview" value="beasiswa" onChange={() => setInterviewType('beasiswa')} /> Beasiswa</label>
            <label className="ms-3"><input type="radio" name="interview" value="magang" onChange={() => setInterviewType('magang')} /> Magang</label>

            {interviewType === 'beasiswa' && (
              <>
                <label className="mt-2">Bahasa Interview:</label>
                <select className="form-control my-2" onChange={(e) => setLanguage(e.target.value)}>
                  <option value="id">🇮🇩 Bahasa Indonesia</option>
                  <option value="en">🇬🇧 English</option>
                </select>
                <input type="text" className="form-control" placeholder="Masukkan nama beasiswa..." value={scholarshipName} onChange={(e) => setScholarshipName(e.target.value)} />
              </>
            )}

            {interviewType === 'magang' && (
              <input type="text" className="form-control my-2" placeholder="Masukkan posisi magang..." value={internshipPosition} onChange={(e) => setInternshipPosition(e.target.value)} />
            )}

            <button onClick={() => setShowInterviewOptions(false)} className="btn btn-success mt-3">Lanjut ke Interview</button>
          </div>
        </div>
      )}

      {showTokenModal && (
        <div className="modal-overlay">
          <div className="modal-content animate__animated animate__bounceIn">
            <h3>🚫 Token Tidak Cukup</h3>
            <p>Kamu membutuhkan minimal <strong>5 token</strong> untuk memulai sesi interview.</p>
            <p>Silakan beli token atau upgrade akun untuk lanjut menggunakan fitur ini.</p>
            <button onClick={() => setShowTokenModal(false)} className="btn btn-outline-danger mt-3">Kembali</button>
          </div>
        </div>
      )}

      <h1 className="title">🎓 Simulasi Interview Beasiswa/Magang</h1>

      <div className="question-box fade-in">
        <p className="label">Pertanyaan:</p>
        {showTyping ? <p className="typing">Mengetik...</p> : <p className="fade-in-text">{question}</p>}
      </div>

      {(!isPremium || tokenSisa >= 5) && (
        <>
          <div className="button-group">
            <button onClick={handleStart} className="btn btn-primary">Mulai Interview</button>
          </div>
          <AudioRecorder onTranscription={handleTranscription} />
        </>
      )}

      {isPremium && tokenSisa < 5 && !showModal && (
        <div className="alert alert-danger mt-4 text-center">🚫 Token kamu tidak mencukupi untuk menggunakan fitur ini.</div>
      )}

      <div className="answer-box">
        <p><strong>Jawaban terakhir kamu:</strong></p>
        <div className="answer-content fade-in-text">{answer || '-'}</div>
      </div>

      <div className="question-counter">
        <p><strong>Jumlah pertanyaan terjawab:</strong> {questionCount}/5</p>
      </div>
    </div>
  );
}

export default InterviewPage;
