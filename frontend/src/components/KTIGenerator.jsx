import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ClipLoader } from 'react-spinners';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = "https://6ea40469-1d71-4ae9-a062-fd248795b654-00-3j49ez9d9x36p.kirk.replit.dev";

const KTIGenerator = ({ email, tokenSisa, setTokenSisa, isPremium }) => {
  const [tema, setTema] = useState('');
  const [subTema, setSubTema] = useState('');
  const [judul, setJudul] = useState('');
  const [loading, setLoading] = useState(false);

  // Fitur premium tambahan
  const [features, setFeatures] = useState({
    backgroundUrgensi: false,
    keterbaruan: false,
    stepKonkrit: false,
    efisiensi: false,
    penelitianTerdahulu: false,
    successRate: false,
  });

  const handleFeatureChange = (feature) => {
    setFeatures((prev) => ({
      ...prev,
      [feature]: !prev[feature],
    }));
  };

  const generateTitle = async () => {
    if (!tema || !subTema) {
      toast.warning("⚠️ Tema dan Sub-Tema wajib diisi!");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/generate-kti`, {
        email,
        tema,
        sub_tema: subTema,
        features,
      });

      if (res.status === 200 && res.data.title && !res.data.title.includes("[ERROR")) {
        setJudul(res.data.title);
        toast.success("🎯 Judul berhasil digenerate!");
        setTokenSisa((prev) => prev - 1);
      } else {
        toast.error("❌ Gagal generate KTI.");
        setJudul(res.data.title);
      }
    } catch (err) {
      console.error("❌ Error:", err);
      toast.error("❌ Gagal connect ke server.");
      setJudul("[ERROR] Gagal connect ke server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      {/* Pilih Tema */}
      <select className="form-select mb-2" value={tema} onChange={(e) => setTema(e.target.value)}>
        <option value="">Pilih Tema</option>
        <option value="soshum">Soshum</option>
        <option value="saintek">Saintek</option>
      </select>

      {/* Sub-Tema Manual */}
      <input
        className="form-control mb-3"
        type="text"
        placeholder="Masukkan Sub-Tema (WAJIB)"
        value={subTema}
        onChange={(e) => setSubTema(e.target.value)}
      />

      {/* Fitur Premium */}
      {isPremium && (
        <div className="border p-3 rounded mb-3">
          <h5 className="mb-3">🔧 Fitur Premium KTI:</h5>

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
                  .replace('backgroundUrgensi', 'Latar Belakang Urgensi')
                  .replace('keterbaruan', 'Keterbaruan')
                  .replace('stepKonkrit', 'Step Konkret')
                  .replace('efisiensi', 'Efisiensi')
                  .replace('penelitianTerdahulu', 'Penelitian Terdahulu')
                  .replace('successRate', 'Success Rate + Contoh Input-Output')}
              </label>
            </div>
          ))}
        </div>
      )}

      {/* Tombol */}
      <button className="btn btn-success w-100" onClick={generateTitle} disabled={loading || !subTema}>
        {loading ? <ClipLoader size={20} color="#fff" /> : "🚀 Generate Judul KTI"}
      </button>

      {/* Hasil */}
      {judul && (
        <div className="alert alert-success mt-3">
          <strong>Judul KTI:</strong><br />
          {judul}
        </div>
      )}
    </div>
  );
};

export default KTIGenerator;
