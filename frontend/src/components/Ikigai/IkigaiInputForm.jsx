import React, { useState } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './IkigaiForm.css'; // pastikan file ini dibuat juga ya!

const IkigaiInputForm = ({ onNext, saveUserData }) => {
  const [formData, setFormData] = useState({
    nama: '',
    jurusan: '',
    semester: '',
    universitas: '',
    sesuaiJurusan: 'YA',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = () => {
    const { nama, jurusan, semester, universitas } = formData;
    if (!nama || !jurusan || !semester || !universitas) {
      toast.warning("⚠️ Semua data wajib diisi lengkap!");
      return;
    }

    saveUserData(formData); // kirim data ke parent state / global
    onNext(); // lanjut ke tahap berikutnya
  };

  return (
    <div className="ikigai-form-container">
      <h4>✨ Step 1: Isi Data Diri Kamu</h4>

      <input
        type="text"
        name="nama"
        placeholder="Nama Kamu"
        value={formData.nama}
        onChange={handleChange}
      />
      <input
        type="text"
        name="jurusan"
        placeholder="Jurusan"
        value={formData.jurusan}
        onChange={handleChange}
      />
      <input
        type="text"
        name="semester"
        placeholder="Semester Saat Ini"
        value={formData.semester}
        onChange={handleChange}
      />
      <input
        type="text"
        name="universitas"
        placeholder="Universitas"
        value={formData.universitas}
        onChange={handleChange}
      />
      <label className="form-label">Ingin Berkarir Sesuai Jurusan?</label>
      <select
        name="sesuaiJurusan"
        value={formData.sesuaiJurusan}
        onChange={handleChange}
      >
        <option value="YA">YA</option>
        <option value="TIDAK">TIDAK</option>
      </select>

      <button onClick={handleNext}>➡️ Lanjut ke Tes</button>
    </div>
  );
};

export default IkigaiInputForm;
