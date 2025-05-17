import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ClipLoader } from 'react-spinners';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/KTIGenerator.css';

const API_URL = "https://webai-production-b975.up.railway.app";

const KTIGenerator = ({ email, tokenSisa, setTokenSisa, isPremium }) => {
  const [tema, setTema] = useState('');
  const [subTema, setSubTema] = useState('');
  const [judulList, setJudulList] = useState([]);
  const [loading, setLoading] = useState(false);

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
        setJudulList((prev) => [...prev, res.data.title]);
        toast.success("🎯 Judul berhasil digenerate!");
        setTokenSisa((prev) => prev - 1);

        // 🔍 Log penggunaan fitur
        await axios.post(`${API_URL}/log-feature`, {
          email,
          feature: "KTIGenerator"
        });
      } else {
        toast.error("❌ Gagal generate KTI.");
        setJudulList((prev) => [...prev, res.data.title]);
      }
    } catch (err) {
      console.error("❌ Error:", err);
      toast.error("❌ Gagal connect ke server.");
      setJudulList((prev) => [...prev, "[ERROR] Gagal connect ke server"]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <select className="form-select mb-2" value={tema} onChange={(e) => setTema(e.target.value)}>
        <option value="">Pilih Tema</option>
        <option value="soshum">Soshum</option>
        <option value="saintek">Saintek</option>
      </select>

      <input
        className="form-control mb-3"
        type="text"
        placeholder="Masukkan Sub-Tema (WAJIB)"
        value={subTema}
        onChange={(e) => setSubTema(e.target.value)}
      />

      {isPremium && (
        <div className="border p-3 rounded mb-3">
          <h5 className="mb-3">🔧 Fitur Premium KTI:</h5>
          {Object.entries({
            backgroundUrgensi: 'Latar Belakang Urgensi',
            keterbaruan: 'Keterbaruan',
            stepKonkrit: 'Langkah Konkret',
            efisiensi: 'Efisiensi',
            penelitianTerdahulu: 'Penelitian Terdahulu',
            successRate: 'Success Rate + Contoh Input/Output',
          }).map(([key, label], index) => (
            <div className="form-check mb-2" key={index}>
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

      <button className="btn btn-success w-100" onClick={generateTitle} disabled={loading || !subTema}>
        {loading ? <ClipLoader size={20} color="#fff" /> : "🚀 Generate Judul KTI"}
      </button>

      {judulList.length > 0 && (
        <button className="btn btn-outline-danger w-100 mt-2" onClick={() => setJudulList([])}>
          🔄 Reset Semua Judul
        </button>
      )}

      {judulList.length > 0 && (
        <div className="mt-4">
          {judulList.map((j, i) => (
            <div key={i} className="result-box mb-3">
              <h5 className="result-title">📌 Judul KTI {i + 1}</h5>
              <p className="result-content">{j}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default KTIGenerator;
