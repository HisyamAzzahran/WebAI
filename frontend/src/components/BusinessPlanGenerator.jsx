import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ClipLoader } from 'react-spinners';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = "http://asia-southeast1.registry.rlwy.net/c8cbb86a-b1ef-430c-b83c-0ce0ac333d41:dea91d7b-b45b-4ad2-92d7-069cc26d7530";

const BusinessPlanGenerator = ({ email, tokenSisa, setTokenSisa, isPremium }) => {
  const [deskripsiIde, setDeskripsiIde] = useState('');
  const [hasil, setHasil] = useState('');
  const [loading, setLoading] = useState(false);

  // Fitur Premium Checklist
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
        setHasil(res.data.title);
        toast.success("🎯 Business Plan berhasil digenerate!");
        setTokenSisa((prev) => prev - 1);
      } else {
        toast.error("❌ Gagal generate Business Plan.");
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

          {Object.keys(features).map((featureKey, index) => (
            <div className="form-check mb-2" key={index}>
              <input
                type="checkbox"
                className="form-check-input"
                id={featureKey}
                checked={features[featureKey]}
                onChange={() => handleFeatureChange(featureKey)}
              />
              <label htmlFor={featureKey} className="form-check-label">
                {featureKey
                  .replace('ringkasanEksekutif', 'Ringkasan Eksekutif')
                  .replace('analisisPasar', 'Analisis Pasar')
                  .replace('strategiPemasaran', 'Strategi Pemasaran')
                  .replace('keuangan', 'Keuangan')
                  .replace('analisisSWOT', 'Analisis SWOT')}
              </label>
            </div>
          ))}
        </div>
      )}

      {/* Tombol */}
      <button
        className="btn btn-success w-100"
        onClick={generateBusinessPlan}
        disabled={loading || !deskripsiIde}
      >
        {loading ? <ClipLoader size={20} color="#fff" /> : "🚀 Generate Business Plan"}
      </button>

      {/* Hasil */}
      {hasil && (
        <div className="alert alert-success mt-3">
          <strong>Hasil:</strong><br />
          {hasil}
        </div>
      )}
    </div>
  );
};

export default BusinessPlanGenerator;
