import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ClipLoader } from 'react-spinners';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = "https://webai-production-b975.up.railway.app";

const IkigaiAnalyzer = ({ email, isPremium, tokenSisa, setTokenSisa, userData, onResult }) => {
  const [loading, setLoading] = useState(false);
  const [hasil, setHasil] = useState('');

  const handleAnalyze = async () => {
    if (!isPremium || tokenSisa < 5) {
      toast.error("🚫 Token tidak cukup atau akun belum Premium.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/analyze-ikigai-spot`, {
        email,
        ...userData
      });

      if (res.status === 200 && res.data.spotList && res.data.sliceList) {
        setHasil(res.data.hasilPrompt);
        setTokenSisa((prev) => prev - 5);
        toast.success("✅ Rekomendasi Ikigai berhasil dibuat!");
        onResult({
          spotList: res.data.spotList,
          sliceList: res.data.sliceList,
          hasilPrompt: res.data.hasilPrompt
        });
      } else {
        toast.error("❌ Gagal generate rekomendasi Ikigai.");
      }
    } catch (err) {
      console.error(err);
      toast.error("❌ Terjadi kesalahan server.");
    } finally {
      setLoading(false);
    }
  };

  if (!isPremium) {
    return (
      <div className="alert alert-warning text-center mt-4">
        🚫 Fitur ini hanya untuk <strong>Premium Users</strong>! Silakan upgrade akunmu. 🚀
      </div>
    );
  }

  if (tokenSisa < 5) {
    return (
      <div className="alert alert-danger text-center mt-4">
        ⚠️ Token kamu tidak cukup (minimal 5 token diperlukan).
      </div>
    );
  }

  return (
    <div className="ikigai-analyzer-container mt-4">
      <h4>🧠 Step 3: Analisis Ikigai Berdasarkan Hasil Tes</h4>
      <p>Klik tombol di bawah ini untuk mulai analisis dan mendapatkan 3 Ikigai Spot & 3 Slice of Life Purpose dari AI.</p>

      <button className="btn btn-primary" onClick={handleAnalyze} disabled={loading}>
        {loading ? <ClipLoader size={20} color="#fff" /> : "🚀 Analyze Ikigai Spot & Slice"}
      </button>

      {hasil && (
        <div className="mt-4">
          <h5>📄 Ringkasan Output Awal:</h5>
          <pre className="bg-light p-3 rounded" style={{ whiteSpace: 'pre-wrap' }}>{hasil}</pre>
        </div>
      )}
    </div>
  );
};

export default IkigaiAnalyzer;