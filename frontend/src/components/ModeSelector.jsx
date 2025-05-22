// src/components/ModeSelector.js
import { useState } from 'react';
import 'animate.css';
import './ModeSelector.css'; // Pastikan file CSS ini ada dan berisi gaya yang sudah dibuat

// Konfigurasi untuk kategori (fields) dan mode-mode di dalamnya
// Tambahkan properti 'premium: true/false' untuk setiap mode
const fieldsConfig = {
  student: {
    name: "📘 Student Development",
    description: "Pengembangan diri, karier, dan persiapan masa depan 🎓",
    modes: [
      { id: "ikigai", title: "🧭 Ikigai Self Discovery", description: "Pemetaan Ikigai dan Strategi Karier Berbasis AI!", premium: true, className: "ikigai-mode" },
      { id: "swot", title: "🧠 SWOT Self Analysis", description: "Kenali kekuatan & tantangan dirimu lewat MBTI & VIA!", premium: true, className: "swot-mode" },
      { id: "interview", title: "🎤 Interview Simulasi", description: "Simulasi interview beasiswa berbasis AI!", premium: true, className: "interview-mode" },
      { id: "exchanges", title: "✈️ Essay Exchanges", description: "Asisten AI untuk Motivation Letter Exchange!", premium: true, className: "exchange-mode" },
    ],
  },
  competition: {
    name: "🏆 Asisten Lomba",
    description: "AI Generator untuk essay, KTI, dan business plan lomba!",
    modes: [
      { id: "essay", title: "📝 Essay Generator", description: "Buat ide judul essay inovatif dan kreatif!", premium: false, className: "essay-mode" },
      { id: "kti", title: "📚 KTI Generator", description: "Kembangkan ide Karya Tulis Ilmiah kompetitif!", premium: false, className: "kti-mode" },
      { id: "bp", title: "💼 Business Plan Generator", description: "Buat rencana bisnis baru yang impactful!", premium: false, className: "bp-mode" }, // Sesuaikan jika BP adalah premium
      { id: "sasaa", title: "🤖 Chatbot Elmo", description: "Chatbot AI yang bantu cari lomba + analisis instan 🎯", premium: true, className: "sasaa-mode" },
    ],
  },
  branding: {
    name: "🌟 Personal Branding",
    description: "Tingkatkan citra dirimu dengan AI Instagram Bio Analyzer!",
    modes: [
      { id: "bio", title: "📸 Instagram Bio Analyzer", description: "Optimalkan bio IG kamu sesuai gaya dan keahlian!", premium: true, className: "bio-mode" },
    ],
  },
};


const ModeSelector = ({ onSelectMode, isPremium }) => {
  const [selectedFieldKey, setSelectedFieldKey] = useState(null);

  const handleFieldClick = (fieldKey) => {
    setSelectedFieldKey(fieldKey);
  };

  const handleModeClick = (mode) => {
    const isDisabled = mode.premium && !isPremium;
    if (!isDisabled) {
      onSelectMode(mode.id);
    }
  };

  const renderFieldSelection = () => (
    <>
      <h2 className="welcome-text animate__animated animate__fadeInDown">
        Halooo, Selamat Datang 👋👋
      </h2>
      <div className="card-grid">
        {Object.entries(fieldsConfig).map(([key, field]) => (
          <div
            key={key}
            className="mode-card field-card"
            onClick={() => handleFieldClick(key)}
          >
            <h3>{field.name}</h3>
            <p>{field.description}</p>
          </div>
        ))}
      </div>
    </>
  );

  const renderModesForSelectedField = () => {
    if (!selectedFieldKey || !fieldsConfig[selectedFieldKey]) {
      return null; // Atau tampilkan pesan error/fallback
    }

    const field = fieldsConfig[selectedFieldKey];

    return (
      <>
        <h3 className="section-title">{field.name}</h3>
        <div className="card-grid">
          {field.modes.map((mode) => {
            const isDisabled = mode.premium && !isPremium;
            return (
              <div
                key={mode.id}
                className={`mode-card ${mode.className || ''} ${isDisabled ? 'disabled' : ''}`}
                onClick={() => handleModeClick(mode)}
                title={isDisabled ? 'Fitur ini khusus untuk pengguna Premium' : mode.description}
              >
                <h3>
                  {mode.title}
                  {mode.premium && <span className="badge-premium">Premium</span>}
                </h3>
                <p>{mode.description}</p>
                {/* Anda bisa menambahkan pesan tambahan jika disabled */}
                {isDisabled && <small className="text-muted d-block mt-2">Upgrade ke Premium untuk mengakses.</small>}
              </div>
            );
          })}
        </div>
      </>
    );
  };

  return (
    <div className="mode-selector-container animate__animated animate__fadeIn">
      {!selectedFieldKey ? (
        renderFieldSelection()
      ) : (
        <>
          <button 
            className="btn btn-outline-secondary mb-3" 
            onClick={() => setSelectedFieldKey(null)}
          >
            ⬅️ Kembali ke Kategori
          </button>
          {renderModesForSelectedField()}
        </>
      )}
       {!isPremium && (
        <div className="alert alert-warning mt-4 text-center">
          💡 Beberapa fitur ditandai dengan <span className="badge-premium">Premium</span> memerlukan akun Premium untuk akses penuh.
          <br/>
           <a
            href="https://wa.me/6282211929271" // Ganti dengan link upgrade Anda
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-success btn-sm mt-2"
          >
            Upgrade ke Premium Sekarang
          </a>
        </div>
      )}
    </div>
  );
};

export default ModeSelector;