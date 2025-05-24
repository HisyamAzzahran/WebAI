// src/components/ModeSelector.js
import React, { useState } from 'react';
import { toast } from 'react-toastify'; // Pastikan ini sudah di-import jika Anda menggunakan toast
import 'animate.css';
import './ModeSelector.css'; // Pastikan file CSS ini ada dan berisi gaya yang sudah dibuat

// Konfigurasi untuk kategori (fields) dan mode-mode di dalamnya
const fieldsConfig = {
  student: {
    name: "📘 Student Development",
    description: "Pengembangan diri, karier, dan persiapan masa depan 🎓",
    modes: [
      { id: "ikigai", title: "🧭 Ikigai Self Discovery", description: "Pemetaan Ikigai dan Strategi Karier Berbasis AI!", premium: true, className: "ikigai-mode" },
      { id: "swot", title: "🧠 SWOT Self Analysis", description: "Kenali kekuatan & tantangan dirimu lewat MBTI & VIA!", premium: true, className: "swot-mode" },
      // --- Student Goals Planning DIPINDAHKAN KE SINI ---
      {
        id: "studentgoals",
        title: "🎯 Student Goals Planning",
        description: "Rencanakan tujuan studimu per semester dengan panduan AI (Membutuhkan 3 token).",
        premium: true,
        className: "studentgoals-mode"
      },
      // ----------------------------------------------------
      { id: "interview", title: "🎤 Interview Simulasi", description: "Simulasi interview beasiswa berbasis AI!", premium: true, className: "interview-mode" },
      { id: "exchanges", title: "✈️ Essay Exchanges", description: "Asisten AI untuk Motivation Letter Exchange!", premium: true, className: "exchange-mode" },
      // Object Student Goals Planning yang lama sudah dihapus dari akhir array ini
    ],
  },
  competition: {
    name: "🏆 Asisten Lomba",
    description: "AI Generator untuk essay, KTI, dan business plan lomba!",
    modes: [
      { id: "essay", title: "📝 Essay Generator", description: "Buat ide judul essay inovatif dan kreatif!", premium: false, className: "essay-mode" },
      { id: "kti", title: "📚 KTI Generator", description: "Kembangkan ide Karya Tulis Ilmiah kompetitif!", premium: false, className: "kti-mode" },
      { id: "bp", title: "💼 Business Plan Generator", description: "Buat rencana bisnis baru yang impactful!", premium: false, className: "bp-mode" },
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
    } else {
        toast.info("💡 Fitur ini khusus untuk pengguna Premium. Silakan upgrade akun Anda untuk mendapatkan akses penuh!", {
            position: "top-center",
            autoClose: 3000,
        });
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
      return null;
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
                title={isDisabled ? 'Fitur ini khusus untuk pengguna Premium. Upgrade untuk akses!' : mode.description}
              >
                <h3>
                  {mode.title}
                  {mode.premium && <span className="badge-premium">Premium</span>}
                </h3>
                <p>{mode.description}</p>
                {isDisabled && (
                    <small className="text-warning d-block mt-2 premium-access-notice">
                        🌟 Upgrade ke Premium untuk akses!
                    </small>
                )}
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
            className="btn btn-outline-secondary mb-3 back-to-category-btn"
            onClick={() => setSelectedFieldKey(null)}
          >
            ⬅️ Kembali ke Pilihan Kategori
          </button>
          {renderModesForSelectedField()}
        </>
      )}
       {!isPremium && (
        <div className="alert alert-info mt-4 text-center global-premium-notice">
          💡 Beberapa fitur ditandai dengan <span className="badge-premium">Premium</span> memerlukan akun Premium untuk akses penuh.
          <br/>
           <a
            href="https://wa.me/6282211929271"
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