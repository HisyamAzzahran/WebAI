import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ClipLoader } from 'react-spinners';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = "https://c4339e7a-eefa-4bed-869b-93375b57f9e6-00-1si4rcqukplco.sisko.replit.dev";

const EssayExchangesGenerator = ({ email, tokenSisa, setTokenSisa, isPremium }) => {
  const [motivasi, setMotivasi] = useState('');
  const [hasil, setHasil] = useState('');
  const [loading, setLoading] = useState(false);

  const generateExchangeEssay = async () => {
    if (!motivasi) {
      toast.warning("⚠️ Masukkan motivasi atau fokus kamu!");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/generate-essay-exchange`, {
        email,
        motivasi_input: motivasi,
      });

      if (res.status === 200 && res.data.title && !res.data.title.includes("[ERROR")) {
        setHasil(res.data.title);
        toast.success("🎯 Essai Exchange berhasil digenerate!");
        setTokenSisa((prev) => prev - 1);
      } else {
        toast.error("❌ Gagal generate Essay Exchange.");
        setHasil(res.data.title);
      }
    } catch (err) {
      console.error("❌ Error:", err);
      toast.error("❌ Gagal connect ke server.");
      setHasil("[ERROR] Gagal connect ke server");
    } finally {
      setLoading(false);
    }
  };

  if (!isPremium) {
    return (
      <div className="alert alert-warning text-center">
        🚫 Fitur ini hanya untuk <strong>Premium Users</strong>!  
        Silakan upgrade akunmu untuk mengaksesnya. 🚀
      </div>
    );
  }

  return (
    <div className="mt-4">
      <textarea
        className="form-control mb-3"
        rows="4"
        placeholder="Ceritakan motivasi atau fokus kamu untuk exchange..."
        value={motivasi}
        onChange={(e) => setMotivasi(e.target.value)}
      />

      <button className="btn btn-primary w-100" onClick={generateExchangeEssay} disabled={loading || !motivasi}>
        {loading ? <ClipLoader size={20} color="#fff" /> : "🚀 Generate Motivation Letter"}
      </button>

      {hasil && (
        <div className="alert alert-success mt-3">
          <strong>Hasil:</strong><br />
          {hasil}
        </div>
      )}
    </div>
  );
};

export default EssayExchangesGenerator;
