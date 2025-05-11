import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ClipLoader } from 'react-spinners';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = "https://webai-production-b975.up.railway.app";

const IkigaiAnalyzer = ({ email, isPremium, tokenSisa, setTokenSisa, userData, onResult }) => {
  const [loading, setLoading] = useState(false);
  const [hasil, setHasil] = useState('');
  const { mbti, via = [], career = [] } = userData || {};

  const handleAnalyze = async () => {
    if (!isPremium || tokenSisa < 5) {
      toast.error("🚫 Token tidak cukup atau akun belum Premium.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/analyze-ikigai-basic`, {
        email,
        ...userData
      });

      if (res.status === 200 && res.data.result) {
        setHasil(res.data.result);
        setTokenSisa((prev) => prev - 5);
        toast.success("✅ Rekomendasi Ikigai berhasil dibuat!");
        onResult(res.data.result); // simpan hasil untuk step 4
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

      {/* Ringkasan data input */}
      <div className="mb-4">
  <h5>🧾 Ringkasan Data Tes Ikigai</h5>
  <ul>
    <li><strong>MBTI:</strong> {mbti || 'Belum diisi'}</li>
    <li><strong>Top 3 VIA:</strong> {via.join(', ') || 'Belum diisi'}</li>
    <li><strong>Top 3 Career Explorer:</strong> {career.join(', ') || 'Belum diisi'}</li>
  </ul>
</div>

      <button className="btn btn-primary" onClick={handleAnalyze} disabled={loading}>
        {loading ? <ClipLoader size={20} color="#fff" /> : "🚀 Analyze Ikigai Spot & Slice"}
      </button>

      {hasil && (
        <div className="mt-4">
          <h5>📄 Hasil Rekomendasi Awal:</h5>
          <pre className="bg-light p-3 rounded" style={{ whiteSpace: 'pre-wrap' }}>{hasil}</pre>
        </div>
      )}
    </div>
  );
};

export default IkigaiAnalyzer;
