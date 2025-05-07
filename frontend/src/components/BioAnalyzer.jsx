import React, { useState } from 'react';
import axios from 'axios';
import '../styles/BioAnalyzer.css';
import { toast } from 'react-toastify';

const API_URL = "https://webai-production-b975.up.railway.app";

function BioAnalyzer({ email, tokenSisa, setTokenSisa, isPremium }) {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [selectedStyle, setSelectedStyle] = useState('');
  const [answers, setAnswers] = useState({});
  const [finalBio, setFinalBio] = useState('');

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file); // No preview shown
    }
  };

  const handleAnalyze = async () => {
    if (!image || !isPremium || tokenSisa < 3) {
      toast.warning("❌ Premium only & minimal 3 token!");
      return;
    }

    const formData = new FormData();
    formData.append('image', image);
    formData.append('email', email);

    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/analyze-bio`, formData);
      if (res.data.recommendations) {
        setReview(res.data.review);
        setRecommendations(res.data.recommendations);
        setTokenSisa(prev => prev - 3);
        toast.success("✅ Bio berhasil dianalisis!");
      } else {
        toast.error("❌ Gagal menganalisis bio.");
      }
    } catch (err) {
      console.error("Analyze error:", err);
      toast.error("⚠️ Terjadi kesalahan server.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStyle = (style) => {
    setSelectedStyle(style);
    setAnswers({});
    setFinalBio('');
    toast.info(`✨ Kamu memilih gaya: ${style}`);
  };

  const questionList = {
    "Profesional": [
      "Apa posisi atau jabatan utama kamu saat ini?",
      "Di institusi/perusahaan/organisasi mana kamu aktif?",
      "Apa keahlian utamamu?",
      "Apa tujuan kamu membuka koneksi (collaboration, hiring, dll)?"
    ],
    "Personal Branding": [
      "Apa aktivitas utama kamu saat ini yang menggambarkan dirimu?",
      "Apa nilai atau prinsip hidup yang kamu pegang?",
      "Apa pesan inspiratif yang sering kamu bagikan ke orang lain?",
      "Apa dampak yang sudah kamu berikan sejauh ini?"
    ],
    "Showcase Skill": [
      "Apa skill utamamu (MC, Desain, Coding, dll)?",
      "Sudah berapa kali kamu menjalankan skill itu?",
      "Apa pengalaman atau event paling berkesan?",
      "Kalau orang ingin kontak kamu, bagaimana caranya?"
    ]
  };

  const handleAnswerChange = (idx, value) => {
    setAnswers(prev => ({ ...prev, [idx]: value }));
  };

  const generateFinalBio = async () => {
    const prompt = `Tolong bantu saya membuat ulang bio Instagram dengan gaya ${selectedStyle}. Saya sudah memilih gaya ini sebelumnya.

Berikut informasi tentang saya berdasarkan jawaban saya:
${questionList[selectedStyle].map((q, i) => `Q: ${q}\nA: ${answers[i] || '-'}`).join('\n')}

Buat bio Instagram yang menarik, maksimal 150 karakter, mencerminkan gaya ini dan jawaban saya.`;

    try {
      const res = await axios.post(`${API_URL}/generate-final-bio`, {
        email,
        style: selectedStyle,
        prompt
      });

      if (res.data.bio) {
        setFinalBio(res.data.bio);
        toast.success("🎯 Bio akhir berhasil dibuat!");
      } else {
        toast.error("⚠️ Gagal membuat bio akhir.");
      }
    } catch (err) {
      console.error("Final bio error:", err);
      toast.error("❌ Server error saat membuat final bio.");
    }
  };

  return (
    <div className="bio-analyzer-container">
      <h2 className="title">🔍 Instagram Bio Analyzer</h2>

      <input type="file" accept="image/*" onChange={handleImageUpload} className="form-control mb-3" />

      <button
        className="btn-analyze"
        onClick={handleAnalyze}
        disabled={!image}
      >
        🔍 Analyze Bio
      </button>

      {loading && (
        <div className="loading-overlay">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      {review && (
        <div className="result-section mt-4">
          <h4>📋 Review Bio Kamu:</h4>
          <p className="review-text">{review}</p>

          <h4>🎯 Pilih Gaya Bio Baru:</h4>
          {recommendations.map((opt, idx) => (
            <div key={idx} className="bio-option">
              <strong>{opt.style}</strong>
              <p>{opt.bio}</p>
              <button className="choose-btn" onClick={() => handleSelectStyle(opt.style)}>
                Saya pilih ini
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedStyle && (
        <div className="followup-section mt-4">
          <h5>📑 Pertanyaan Lanjutan - Gaya {selectedStyle}</h5>
          {questionList[selectedStyle].map((q, i) => (
            <div key={i} className="form-group mb-2">
              <label>{q}</label>
              <textarea
                className="form-control"
                rows="2"
                placeholder="Jawaban kamu..."
                onChange={(e) => handleAnswerChange(i, e.target.value)}
              />
            </div>
          ))}
          <button className="btn btn-success mt-3" onClick={generateFinalBio}>
            🎨 Buat Bio Akhir
          </button>
        </div>
      )}

      {finalBio && (
        <div className="alert alert-success mt-4">
          <strong>✨ Bio Akhir Kamu:</strong><br />
          {finalBio}
        </div>
      )}
    </div>
  );
}

export default BioAnalyzer;
