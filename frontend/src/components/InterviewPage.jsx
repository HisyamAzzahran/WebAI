import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/InterviewPage.css';
import AudioRecorder from './AudioRecorder';

function InterviewPage({ isPremium, email, tokenSisa, setTokenSisa, apiUrl }) {
  const [question, setQuestion] = useState('Klik "Mulai Interview" untuk memulai.');
  const [answer, setAnswer] = useState('');
  const [answersHistory, setAnswersHistory] = useState([]);
  const [questionsHistory, setQuestionsHistory] = useState([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [username, setUsername] = useState(email || '');
  const [showTyping, setShowTyping] = useState(false);
  const navigate = useNavigate();

  const API_BASE = apiUrl || import.meta.env.VITE_API_URL || 'https://webai-production-b975.up.railway.app';

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
      const name = prompt("Halo! Siapa nama panggilan kamu?");
      if (name?.trim()) {
        setUsername(name.trim());
        alert(`Terima kasih, ${name.trim()}. Klik lagi tombol untuk memulai interview.`);
      }
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

    // Selesai: redirect dan kurangi token 5
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
