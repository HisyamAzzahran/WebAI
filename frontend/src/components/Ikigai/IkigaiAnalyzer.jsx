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

    if (!isPremium || tokenSisa < 5) {
      toast.error("🚫 Token tidak cukup atau akun belum Premium.");
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

      if (res.status === 200 && res.data.hasilPrompt && res.data.spotList && res.data.sliceList) {
        setHasil(res.data.hasilPrompt);
        toast.success("✅ Berhasil generate pemetaan Ikigai!");
        onResult({
          hasilPrompt: res.data.hasilPrompt,
          spotList: res.data.spotList,
          sliceList: res.data.sliceList,
          mbti,
          via,
          career
        });
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

  return (
    <div className="ikigai-analyzer-container">
      <h4>🔍 Step 3: Input Hasil Tes & Pemetaan Ikigai</h4>

      <label>MBTI:</label>
      <input
        placeholder="Contoh: INFP"
        value={mbti}
        onChange={(e) => setMbti(e.target.value.toUpperCase())}
      />

      <label className="mt-3">Top 3 VIA Character Strength:</label>
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

      <label className="mt-3">Top 3 Career Explorer Role:</label>
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

      <button onClick={handleAnalyze} disabled={loading} className="btn btn-primary mt-3">
        {loading ? <ClipLoader size={20} color="#fff" /> : "🚀 Analyze Pemetaan Ikigai"}
      </button>

      {hasil && (
        <div className="ikigai-hasil mt-4">
          <h5>📄 Hasil Analisis AI:</h5>
          <pre className="bg-light p-3 rounded" style={{ whiteSpace: 'pre-wrap' }}>{hasil}</pre>
        </div>
      )}
    </div>
  );
};

export default IkigaiAnalyzer;
