import { useState, useEffect } from 'react';
import axios from 'axios';

const EssayGenerator = ({ isPremium, email }) => {
  const [tema, setTema] = useState('');
  const [subTema, setSubTema] = useState('');
  const [judul, setJudul] = useState('');

  const subTemaOptions = {
    soshum: [
      "Pengabdian Masyarakat",
      "Sosial Budaya",
      "Ekonomi Kreatif",
      "Pendidikan Inklusif",
      "Hukum dan HAM",
      "Politik Digital",
      "Budaya Lokal",
      "Gender & Kesetaraan"
    ],
    saintek: [
      "Kesehatan",
      "Lingkungan dan Energi Terbarukan",
      "Teknologi Tepat Guna",
      "Inovasi Pertanian",
      "Kecerdasan Buatan",
      "Bioteknologi",
      "Robotika Edukasi",
      "Ketahanan Pangan"
    ]
  };

  const subTemaUmum = ["Umum"];

  // Reset sub-tema saat ganti tema
  useEffect(() => {
    setSubTema('');
  }, [tema]);

  const getSubTemaList = () => {
    if (!tema) return [];
    const subPremium = subTemaOptions[tema] || [];
    return isPremium ? [...subTemaUmum, ...subPremium] : [...subTemaUmum];
  };

  const generate = async () => {
    if (!tema || !subTema) {
      alert("Pilih tema dan sub-tema terlebih dahulu!");
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/generate-title', {
        tema,
        sub_tema: subTema,
      });

      setJudul(res.data.title);
    } catch (err) {
      alert("Gagal generate judul. Silakan coba lagi.");
    }
  };

  return (
    <div className="mt-4">
      <select className="form-select mb-2" onChange={(e) => setTema(e.target.value)} value={tema}>
        <option value="">Pilih Tema</option>
        <option value="soshum">Soshum</option>
        <option value="saintek">Saintek</option>
      </select>

      <select className="form-select mb-2" onChange={(e) => setSubTema(e.target.value)} disabled={!tema} value={subTema}>
        <option value="">Pilih Sub Tema</option>
        {getSubTemaList().map((st, i) => (
          <option key={i} value={st.toLowerCase()}>{st}</option>
        ))}
      </select>

      <button className="btn btn-primary" onClick={generate} disabled={!subTema}>Generate Judul</button>

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
