import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';

function ResultPage() {
  const location = useLocation();
  const { username, answers } = location.state || {};
  const [scores, setScores] = useState([]);
  const [totalScore, setTotalScore] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);

  const API_URL = "https://webai-production-b975.up.railway.app";

  useEffect(() => {
    const evaluate = async () => {
      if (!answers || answers.length === 0) return;

      try {
        const response = await fetch(`${API_URL}/evaluate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers, username }),
        });

        const data = await response.json();
        if (data.scores) {
          setScores(data.scores);
          setTotalScore(data.total);
          setFeedback(data.feedback);
        }
      } catch (error) {
        console.error("Gagal evaluasi jawaban:", error);
      } finally {
        setLoading(false);
      }
    };

    evaluate();
  }, [answers, username]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', paddingTop: '60px' }}>
        <h2>⏳ Menilai jawaban kamu...</h2>
      </div>
    );
  }

  if (!answers || answers.length === 0) {
    return (
      <div style={{ textAlign: 'center', paddingTop: '60px' }}>
        <h2>❌ Jawaban tidak ditemukan.</h2>
        <Link to="/" className="btn btn-primary">Kembali ke Halaman Utama</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '700px', margin: 'auto', padding: '30px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>📋 Hasil Simulasi Wawancara</h1>
      <h2>Halo, <span style={{ color: '#4c6ef5' }}>{username}</span> 👋</h2>
      <p>Berikut ini adalah ringkasan jawaban kamu selama simulasi interview beasiswa:</p>

      <ol>
        {answers.map((ans, index) => (
          <li key={index} style={{ marginBottom: '10px' }}>
            <strong>Jawaban {index + 1}:</strong> {ans}
            {scores[index] !== undefined && (
              <div style={{ color: '#555' }}>Skor: {scores[index]} / 5</div>
            )}
          </li>
        ))}
      </ol>

      {totalScore !== null && (
        <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f1f3f5', borderRadius: '10px' }}>
          <h3>✨ Total Skor: {totalScore} / 25</h3>
          <p style={{ marginTop: '10px', fontStyle: 'italic' }}>{feedback}</p>

          <p style={{ marginTop: '10px' }}>
            {totalScore >= 22
              ? "💯 Sangat Baik! Kamu siap menghadapi interview nyata."
              : totalScore >= 18
              ? "👍 Baik, tapi masih bisa ditingkatkan pada bagian motivasi atau kejelasan."
              : "📝 Perlu banyak latihan agar jawabanmu lebih kuat dan terfokus."}
          </p>
        </div>
      )}

      <div style={{ marginTop: '30px', textAlign: 'center' }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'white', backgroundColor: '#4c6ef5', padding: '10px 20px', borderRadius: '8px' }}>
          🔁 Ulangi Interview
        </Link>
      </div>
    </div>
  );
}

export default ResultPage;
