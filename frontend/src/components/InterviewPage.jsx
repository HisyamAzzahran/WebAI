import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/InterviewPage.css';
import 'animate.css';
import AudioRecorder from './AudioRecorder';

function InterviewPage({ isPremium, email, tokenSisa, setTokenSisa, apiUrl }) {
  const [question, setQuestion] = useState('Klik "Mulai Interview" untuk memulai.');
  const [answer, setAnswer] = useState('');
  const [answersHistory, setAnswersHistory] = useState([]);
  const [questionsHistory, setQuestionsHistory] = useState([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [username, setUsername] = useState('');
  const [showTyping, setShowTyping] = useState(false);
  const [showModal, setShowModal] = useState(true);
  const [tempName, setTempName] = useState('');
  const navigate = useNavigate();

  const API_BASE = apiUrl || import.meta.env.VITE_API_URL || 'https://webai-production-b975.up.railway.app';

  useEffect(() => {
    setUsername('');
    setShowModal(true);
    localStorage.removeItem('username');
  }, []);

  const handleNameSubmit = () => {
    if (tempName.trim()) {
      setUsername(tempName.trim());
      setShowModal(false);
      alert(`Terima kasih, ${tempName.trim()}. Silakan klik tombol untuk memulai interview.`);
    } else {
      alert("Nama tidak boleh kosong.");
    }
  };

  const askQuestion = async (jawaban, fullHistory = []) => {
    try {
      const res = await fetch(`${API_BASE}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: jawaban, username, history: fullHistory })
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
    if (!username) {
      alert("Nama belum dimasukkan. Silakan isi nama dulu.");
      return;
    }

    if (tokenSisa < 5) {
      alert("Token kamu tidak cukup untuk memulai sesi wawancara.");
      return;
    }

    setShowTyping(true);
    const pembukaPrompt = `Sebagai pewawancara seleksi beasiswa bergengsi, ajukan SATU pertanyaan pembuka secara formal kepada pelamar bernama Saudara ${username}. Fokuskan pada motivasi pendaftaran beasiswa tanpa memberi opini atau penjelasan tambahan.`;
    const firstQuestion = await askQuestion(pembukaPrompt);
    setTimeout(() => {
      setShowTyping(false);
      setQuestion(firstQuestion);
      setQuestionsHistory([firstQuestion]);
      speakText(firstQuestion);
    }, 1000);
  };

  const handleTranscription = async (transcript) => {
    setAnswer(transcript);
    const updatedAnswers = [...answersHistory, transcript];
    const updatedQuestions = [...questionsHistory];

    const combinedHistory = updatedQuestions.map((q, i) => ({
      q,
      a: updatedAnswers[i] || ""
    }));

    if (questionCount >= 4) {
      if (setTokenSisa && typeof tokenSisa === 'number') {
        setTokenSisa(tokenSisa - 5);
      }
      navigate('/result', { state: { username, answers: updatedAnswers } });
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
            <input
              type="text"
              className="form-control my-3"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              placeholder="Masukkan nama kamu..."
            />
            <button onClick={handleNameSubmit} className="btn btn-success">
              Mulai!
            </button>
          </div>
        </div>
      )}

      <h1 className="title">🎓 Simulasi Interview Beasiswa</h1>

      <div className="question-box fade-in">
        <p className="label">Pertanyaan:</p>
        {showTyping ? (
          <p className="typing">Mengetik...</p>
        ) : (
          <p className="fade-in-text">{question}</p>
        )}
      </div>

      <div className="button-group">
        <button onClick={handleStart} className="btn btn-primary">
          Mulai Interview
        </button>
      </div>

      <AudioRecorder onTranscription={handleTranscription} />

      <div className="answer-box">
        <p><strong>Jawaban terakhir kamu:</strong></p>
        <div className="answer-content fade-in-text">
          {answer || '-'}
        </div>
      </div>

      <div className="question-counter">
        <p><strong>Jumlah pertanyaan terjawab:</strong> {questionCount}/5</p>
      </div>
    </div>
  );
}

export default InterviewPage;
