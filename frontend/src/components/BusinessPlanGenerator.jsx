import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ClipLoader } from 'react-spinners';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/BPGenerator.css'; // Optional styling

const API_URL = "https://webai-production-b975.up.railway.app";

const BusinessPlanGenerator = ({ email, tokenSisa, setTokenSisa, isPremium }) => {
  const [deskripsiIde, setDeskripsiIde] = useState('');
  const [hasilList, setHasilList] = useState([]);
  const [loading, setLoading] = useState(false);

  const [features, setFeatures] = useState({
    ringkasanEksekutif: false,
    analisisPasar: false,
    strategiPemasaran: false,
    keuangan: false,
    analisisSWOT: false,
  });

  const handleFeatureChange = (feature) => {
    setFeatures((prev) => ({
      ...prev,
      [feature]: !prev[feature],
    }));
  };

  const generateBusinessPlan = async () => {
    if (!deskripsiIde) {
      toast.warning("⚠️ Masukkan deskripsi ide bisnis dulu!");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/generate-bp`, {
        email,
        deskripsi_ide: deskripsiIde,
        features,
      });

      if (res.status === 200 && res.data.title && !res.data.title.includes("[ERROR")) {
        setHasilList((prev) => [...prev, res.data.title]);
        toast.success("🎯 Business Plan berhasil digenerate!");
        setTokenSisa((prev) => prev - 1);
      } else {
        toast.error("❌ Gagal generate Business Plan.");
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

  return (
    <div className="mt-4">
      {/* Input Ide */}
      <textarea
        className="form-control mb-3"
        rows="4"
        placeholder="Deskripsikan ide atau minat bisnis kamu..."
        value={deskripsiIde}
        onChange={(e) => setDeskripsiIde(e.target.value)}
      />

      {/* Premium Features */}
      {isPremium && (
        <div className="border p-3 rounded mb-3">
          <h5 className="mb-3">🔧 Fitur Premium Tambahan:</h5>
          {Object.entries({
            ringkasanEksekutif: 'Ringkasan Eksekutif',
            analisisPasar: 'Analisis Pasar',
            strategiPemasaran: 'Strategi Pemasaran',
            keuangan: 'Keuangan',
            analisisSWOT: 'Analisis SWOT',
          }).map(([key, label], i) => (
            <div className="form-check mb-2" key={i}>
              <input
                type="checkbox"
                className="form-check-input"
                id={key}
                checked={features[key]}
                onChange={() => handleFeatureChange(key)}
              />
              <label htmlFor={key} className="form-check-label">{label}</label>
            </div>
          ))}
        </div>
      )}

      {/* Tombol Generate */}
      <button
        className="btn btn-success w-100"
        onClick={generateBusinessPlan}
        disabled={loading || !deskripsiIde}
      >
        {loading ? <ClipLoader size={20} color="#fff" /> : "🚀 Generate Business Plan"}
      </button>

      {/* Tombol Reset */}
      {hasilList.length > 0 && (
        <button className="btn btn-outline-danger w-100 mt-2" onClick={() => setHasilList([])}>
          🔄 Reset Semua Output
        </button>
      )}

      {/* Output */}
      {hasilList.length > 0 && (
        <div className="mt-4">
          {hasilList.map((item, index) => (
            <div key={index} className="result-box mb-3">
              <h5 className="result-title">📌 Business Plan {index + 1}</h5>
              <p className="result-content">{item}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BusinessPlanGenerator;
