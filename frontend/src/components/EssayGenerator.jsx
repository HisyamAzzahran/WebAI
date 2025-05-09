import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ClipLoader } from 'react-spinners';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/EssayGenerator.css'; // Pastikan file ini ada

const API_URL = "https://webai-production-b975.up.railway.app";

const EssayGenerator = ({ email, tokenSisa, setTokenSisa, isPremium }) => {
  const [tema, setTema] = useState('');
  const [subTema, setSubTema] = useState('');
  const [judulList, setJudulList] = useState([]);
  const [loading, setLoading] = useState(false);

  // State fitur premium
  const [useBackground, setUseBackground] = useState(false);
  const [backgroundText, setBackgroundText] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [includeExplanation, setIncludeExplanation] = useState(false);
  const [includeMethodTech, setIncludeMethodTech] = useState(false);

  const subTemaOptions = {
    soshum: [
      "Pengabdian Masyarakat", "Sosial Budaya", "Ekonomi Kreatif", "Pendidikan Inklusif",
      "Hukum dan HAM", "Politik Digital", "Budaya Lokal", "Gender & Kesetaraan", "Kearsipan"
    ],
    saintek: [
      "Kesehatan", "Lingkungan dan Energi Terbarukan", "Teknologi Tepat Guna",
      "Inovasi Pertanian", "Kecerdasan Buatan", "Bioteknologi", "Robotika Edukasi", "Ketahanan Pangan", "Teknologi Masa Depan"
    ]
  };

  const subTemaUmum = ["Umum"];

  const getSubTemaList = () => {
    const subtemas = subTemaOptions[tema] || [];
    return isPremium ? [...subTemaUmum, ...subtemas] : [...subTemaUmum];
  };

  useEffect(() => {
    setSubTema('');
  }, [tema]);

  const generateTitle = async () => {
    if (!tema || !subTema) {
      toast.warning("⚠️ Pilih tema dan subtema dulu!");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/generate-title`, {
        email,
        tema,
        sub_tema: subTema,
        background_enabled: useBackground,
        background_text: backgroundText,
        advanced_enabled: showAdvanced,
        include_explanation: includeExplanation,
        include_method_or_tech: includeMethodTech
      });

      if (res.status === 200 && res.data.title && !res.data.title.includes("[ERROR")) {
        setJudulList(prev => [...prev, res.data.title]);
        toast.success("🎉 Judul berhasil digenerate!");
        setTokenSisa(prev => prev - 1);
      } else {
        toast.error("❌ Gagal generate judul.");
        setJudulList(prev => [...prev, res.data.title]);
      }
    } catch (err) {
      toast.error("❌ Gagal connect ke server.");
      setJudulList(prev => [...prev, "[ERROR] Gagal connect ke server"]);
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

      {/* Pilih Subtema */}
      <select
        className="form-select mb-2"
        value={subTema}
        onChange={(e) => setSubTema(e.target.value)}
        disabled={!tema}
      >
        <option value="">Pilih Sub-Tema</option>
        {getSubTemaList().map((s, i) => (
          <option key={i} value={s.toLowerCase()}>{s}</option>
        ))}
      </select>

      {/* Fitur Premium */}
      {isPremium && (
        <>
          <div className="form-check mt-3">
            <input
              type="checkbox"
              className="form-check-input"
              id="bgCheck"
              checked={useBackground}
              onChange={() => setUseBackground(!useBackground)}
            />
            <label htmlFor="bgCheck" className="form-check-label">
              Tambahkan Latar Belakang
            </label>
          </div>
          {useBackground && (
            <textarea
              className="form-control mt-2"
              rows="3"
              placeholder="Masukkan latar belakang singkat..."
              value={backgroundText}
              onChange={(e) => setBackgroundText(e.target.value)}
            />
          )}

          <div className="form-check mt-3">
            <input
              type="checkbox"
              className="form-check-input"
              id="advancedCheck"
              checked={showAdvanced}
              onChange={() => setShowAdvanced(!showAdvanced)}
            />
            <label htmlFor="advancedCheck" className="form-check-label">
              Tampilkan Opsi Lanjutan
            </label>
          </div>

          {showAdvanced && (
            <div className="p-3 border rounded mt-2">
              <div className="form-check mb-2">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="explainCheck"
                  checked={includeExplanation}
                  onChange={() => setIncludeExplanation(!includeExplanation)}
                />
                <label htmlFor="explainCheck" className="form-check-label">
                  Tambahkan Penjelasan Judul
                </label>
              </div>
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="techCheck"
                  checked={includeMethodTech}
                  onChange={() => setIncludeMethodTech(!includeMethodTech)}
                />
                <label htmlFor="techCheck" className="form-check-label">
                  Tambahkan Metode (Soshum) / Teknologi (Saintek)
                </label>
              </div>
            </div>
          )}
        </>
      )}

      {/* Tombol Generate */}
      <button className="btn btn-primary w-100 mt-3" onClick={generateTitle} disabled={loading || !subTema}>
        {loading ? <ClipLoader size={20} color="#fff" /> : "🎯 Generate Judul"}
      </button>

      {/* Tombol Reset */}
      {judulList.length > 0 && (
        <button className="btn btn-outline-danger w-100 mt-2" onClick={() => setJudulList([])}>
          🔄 Reset Semua Judul
        </button>
      )}

      {/* Hasil Judul */}
      {judulList.length > 0 && (
        <div className="mt-4">
          {judulList.map((j, i) => (
            <div key={i} className="result-box mb-3">
              <h5 className="result-title">🎓 Judul {i + 1}</h5>
              <p className="result-content">{j}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EssayGenerator;
