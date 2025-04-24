import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ClipLoader } from 'react-spinners';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = "https://6ea40469-1d71-4ae9-a062-fd248795b654-00-3j49ez9d9x36p.kirk.replit.dev"; // 🔁 Ganti ini dengan URL backend kamu

const EssayGenerator = ({ email, tokenSisa, setTokenSisa, isPremium }) => {
  const [tema, setTema] = useState('');
  const [subTema, setSubTema] = useState('');
  const [judul, setJudul] = useState('');
  const [loading, setLoading] = useState(false);

  const subTemaOptions = {
    soshum: [
      "Pengabdian Masyarakat", "Sosial Budaya", "Ekonomi Kreatif", "Pendidikan Inklusif",
      "Hukum dan HAM", "Politik Digital", "Budaya Lokal", "Gender & Kesetaraan"
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
        sub_tema: subTema
      });

      if (res.status === 200 && res.data.title && !res.data.title.includes("[ERROR")) {
        setJudul(res.data.title);
        toast.success("🎉 Judul berhasil digenerate!");
        setTokenSisa((prev) => prev - 1);
      } else {
        toast.error("❌ Gagal generate judul.");
        setJudul(res.data.title);
      }
    } catch (err) {
      console.error("❌ Gagal koneksi:", err);
      toast.error("❌ Gagal connect ke server.");
      setJudul("[ERROR] Gagal connect ke server");
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

      <button className="btn btn-primary w-100" onClick={generateTitle} disabled={loading || !subTema}>
        {loading ? <ClipLoader size={20} color="#fff" /> : "🎯 Generate Judul"}
      </button>

      {judul && (
        <div className="alert alert-success mt-3">
          <strong>Judul:</strong><br />
          {judul}
        </div>
      )}
    </div>
  );
};

export default EssayGenerator;
