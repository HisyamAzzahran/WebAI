import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ClipLoader } from 'react-spinners';
import 'react-toastify/dist/ReactToastify.css';
import 'animate.css';
import '../styles/EssayExchangesGenerator.css'; // jika pakai styling terpisah

const API_URL = "https://webai-production-b975.up.railway.app";

const EssayExchangesGenerator = ({ email, tokenSisa, setTokenSisa, isPremium }) => {
  const [motivasi, setMotivasi] = useState('');
  const [hasilList, setHasilList] = useState([]);
  const [loading, setLoading] = useState(false);

  const generateExchangeEssay = async () => {
    if (!motivasi) {
      toast.warning("⚠️ Masukkan motivasi atau fokus kamu!");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/log-feature`, { email, feature: "essay_exchange" });
      const res = await axios.post(`${API_URL}/generate-essay-exchange`, {
        email,
        motivasi_input: motivasi,
      });

      if (res.status === 200 && res.data.title && !res.data.title.includes("[ERROR")) {
        setHasilList((prev) => [...prev, res.data.title]);
        toast.success("🎯 Essay berhasil digenerate!");
        setTokenSisa((prev) => prev - 1);
      } else {
        toast.error("❌ Gagal generate Essay Exchange.");
        setHasilList((prev) => [...prev, res.data.title]);
      }
    } catch (err) {
      console.error("❌ Error:", err);
      toast.error("❌ Gagal connect ke server.");
      setHasilList((prev) => [...prev, "[ERROR] Gagal connect ke server"]);
    } finally {
      setLoading(false);
    }
  };

  if (!isPremium) {
    return (
      <div className="alert alert-warning text-center animate__animated animate__fadeIn">
        🚫 Fitur ini hanya untuk <strong>Premium Users</strong>!  
        Silakan upgrade akunmu untuk mengaksesnya. 🚀
      </div>
    );
  }

  return (
    <div className="mt-4 animate__animated animate__fadeIn">
      {/* Input Motivasi */}
      <textarea
        className="form-control mb-3"
        rows="4"
        placeholder="Ceritakan motivasi atau fokus kamu untuk exchange..."
        value={motivasi}
        onChange={(e) => setMotivasi(e.target.value)}
      />

      {/* Tombol Generate */}
      <button
        className="btn btn-primary w-100"
        onClick={generateExchangeEssay}
        disabled={loading || !motivasi}
      >
        {loading ? <ClipLoader size={20} color="#fff" /> : "🚀 Generate Motivation Letter"}
      </button>

      {/* Tombol Reset */}
      {hasilList.length > 0 && (
        <button className="btn btn-outline-danger w-100 mt-2" onClick={() => setHasilList([])}>
          🔄 Reset Semua Hasil
        </button>
      )}

      {/* Output */}
      {hasilList.length > 0 && (
        <div className="mt-4">
          {hasilList.map((item, index) => (
            <div key={index} className="result-box mb-3 animate__animated animate__fadeInUp">
              <h5 className="result-title">📄 Motivation Letter {index + 1}</h5>
              <p className="result-content">{item}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EssayExchangesGenerator;
