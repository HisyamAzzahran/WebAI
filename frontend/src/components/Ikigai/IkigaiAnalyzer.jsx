import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ClipLoader } from 'react-spinners';
import 'react-toastify/dist/ReactToastify.css';
import './IkigaiAnalyzer.css';

const API_URL = "https://webai-production-b975.up.railway.app";

const IkigaiAnalyzer = ({ email, tokenSisa, setTokenSisa, isPremium, userData, onResult }) => {
  const [mbti, setMbti] = useState('');
  const [via, setVia] = useState(['', '', '']);
  const [career, setCareer] = useState(['', '', '']);
  const [loading, setLoading] = useState(false);
  const [hasil, setHasil] = useState('');

  const handleAnalyze = async () => {
    if (!mbti || via.includes('') || career.includes('')) {
      toast.warning("⚠️ Lengkapi semua hasil tes dulu ya!");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/analyze-ikigai-basic`, {
        email,
        mbti,
        via,
        career,
        ...userData
      });

      if (res.status === 200 && res.data.result) {
        setHasil(res.data.result);
        setTokenSisa((prev) => prev - 5);
        onResult(res.data.result); // lempar hasil ke parent
        toast.success("✅ Berhasil generate pemetaan Ikigai!");
      } else {
        toast.error("❌ Gagal generate Ikigai.");
      }
    } catch (err) {
      console.error(err);
      toast.error("❌ Terjadi kesalahan server.");
    } finally {
      setLoading(false);
    }
  };

  // === 🚫 Premium & Token Check ===
  if (!isPremium) {
    return (
      <div className="alert alert-warning text-center mt-4">
        🚫 Fitur ini hanya tersedia untuk <strong>Premium Users</strong>!  
        Silakan upgrade akunmu untuk mengakses fitur Ikigai Analyzer. 🚀
      </div>
    );
  }

  if (tokenSisa < 5) {
    return (
      <div className="alert alert-danger text-center mt-4">
        ⚠️ Token kamu tidak mencukupi untuk mengakses fitur ini.<br />
        Diperlukan minimal <strong>5 token</strong> untuk melanjutkan.
      </div>
    );
  }

  return (
    <div className="ikigai-analyzer-container">
      <h4>🔍 Step 3: Input Hasil Tes & Pemetaan Ikigai</h4>

      <input
        placeholder="MBTI (contoh: INFP)"
        value={mbti}
        onChange={(e) => setMbti(e.target.value)}
      />

      <label>Top 3 VIA Character:</label>
      {via.map((v, i) => (
        <input
          key={i}
          placeholder={`VIA #${i + 1}`}
          value={v}
          onChange={(e) => {
            const temp = [...via];
            temp[i] = e.target.value;
            setVia(temp);
          }}
        />
      ))}

      <label>Top 3 Career Explorer Role:</label>
      {career.map((c, i) => (
        <input
          key={i}
          placeholder={`Career Role #${i + 1}`}
          value={c}
          onChange={(e) => {
            const temp = [...career];
            temp[i] = e.target.value;
            setCareer(temp);
          }}
        />
      ))}

      <button onClick={handleAnalyze} disabled={loading}>
        {loading ? <ClipLoader size={20} color="#fff" /> : "🚀 Analyze Pemetaan Ikigai"}
      </button>

      {hasil && (
        <div className="ikigai-hasil">
          <h5>📄 Hasil Analisis AI:</h5>
          <pre>{hasil}</pre>
        </div>
      )}
    </div>
  );
};

export default IkigaiAnalyzer;
