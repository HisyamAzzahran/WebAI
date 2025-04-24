import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ClipLoader } from 'react-spinners';
import 'animate.css';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = "https://6ea40469-1d71-4ae9-a062-fd248795b654-00-3j49ez9d9x36p.kirk.replit.dev";

const EssayGenerator = ({ isPremium, email, tokenSisa, setTokenSisa }) => {
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
      "Inovasi Pertanian", "Kecerdasan Buatan", "Bioteknologi", "Robotika Edukasi", "Ketahanan Pangan"
    ]
  };

  const subTemaUmum = ["Umum"];

  useEffect(() => {
    setSubTema('');
  }, [tema]);

  const getSubTemaList = () => {
    if (!tema) return [];
    const subtemas = subTemaOptions[tema] || [];
    return isPremium ? [...subTemaUmum, ...subtemas] : [...subTemaUmum];
  };

  const generate = async () => {
    if (!tema || !subTema) {
      toast.warn("Pilih tema dan sub-tema terlebih dahulu!");
      return;
    }
  
    setLoading(true);
    setJudul("");
  
    try {
      const res = await axios.post(`${API_URL}/generate-title`, {
        email,
        tema,
        sub_tema: subTema
      });
  
      const title = res?.data?.title || "";
  
      if (res.status === 200 && !title.startsWith('[ERROR') && !title.startsWith('[TOKEN HABIS')) {
        setJudul(title);
        toast.success("🎉 Judul berhasil digenerate!");
        setTokenSisa((prev) => prev - 1);
      } else if (title.startsWith('[TOKEN HABIS')) {
        setJudul(title);
        toast.error("⚠️ Token habis. Silakan upgrade ke Premium.");
      } else {
        setJudul("[ERROR] Gagal generate judul");
        toast.error("❌ Terjadi kesalahan saat generate judul.");
      }
    } catch (err) {
      console.error("🚨 Error saat generate judul:", err);
      setJudul("[ERROR] Gagal generate judul");
      toast.error("❌ Error server: gagal generate judul.");
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="mt-4 animate__animated animate__fadeInUp">
      <select
        className="form-select mb-2 animate__animated animate__fadeIn select-animated"
        onChange={(e) => setTema(e.target.value)}
        value={tema}
      >
        <option value="">Pilih Tema</option>
        <option value="soshum">Soshum</option>
        <option value="saintek">Saintek</option>
      </select>

      <select
        className="form-select mb-2 animate__animated animate__fadeIn select-animated"
        onChange={(e) => setSubTema(e.target.value)}
        disabled={!tema}
        value={subTema}
      >
        <option value="">Pilih Sub Tema</option>
        {getSubTemaList().map((st, i) => (
          <option key={i} value={st.toLowerCase()}>{st}</option>
        ))}
      </select>

      <button
        className="btn btn-primary w-100 animate__animated animate__fadeIn"
        onClick={generate}
        disabled={!subTema || tokenSisa <= 0 || loading}
      >
        {loading ? <ClipLoader size={20} color="#fff" /> : "🎯 Generate Judul"}
      </button>

      {judul && (
        <div className="alert alert-success mt-3 animate__animated animate__fadeInUp">
          <strong>Judul:</strong><br />
          {judul}
        </div>
      )}
    </div>
  );
};

export default EssayGenerator;
