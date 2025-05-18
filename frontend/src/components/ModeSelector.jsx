import { useState } from 'react';
import 'animate.css';
import './ModeSelector.css';

const ModeSelector = ({ onSelectMode, isPremium }) => {
  const [selectedField, setSelectedField] = useState(null);
  const [showLoading, setShowLoading] = useState(false);

  const handleFieldClick = (field) => {
    setShowLoading(true);
    setTimeout(() => {
      setSelectedField(field);
      setShowLoading(false);
    }, 1500);
  };

  const renderFieldSelection = () => (
    <>
      <h2 className="welcome-text animate__animated animate__fadeInDown">
        Halooo, Selamat Datang 👋👋
      </h2>
      <div className="card-grid">
        <div className="mode-card field-card" onClick={() => handleFieldClick("student")}>
          <h3>📘 Student Development</h3>
          <p>Pengembangan diri, karier, dan persiapan masa depan 🎓</p>
        </div>
        <div className="mode-card field-card" onClick={() => handleFieldClick("competition")}>
          <h3>🏆 Asisten Lomba</h3>
          <p>AI Generator untuk essay, KTI, dan business plan lomba!</p>
        </div>
        <div className="mode-card field-card" onClick={() => handleFieldClick("branding")}>
          <h3>🌟 Personal Branding</h3>
          <p>Tingkatkan citra dirimu dengan AI Instagram Bio Analyzer!</p>
        </div>
      </div>
    </>
  );

  const renderStudentDevelopment = () => (
    <>
      <h3 className="section-title">📘 Student Development</h3>
      <div className="card-grid">
        <div className="mode-card ikigai-mode" onClick={() => onSelectMode("ikigai")}>
          <h3>🧭 Ikigai Self Discovery <span className="badge-premium">Premium</span></h3>
          <p>Pemetaan Ikigai dan Strategi Karier Berbasis AI!</p>
        </div>
        <div className="mode-card interview-mode" onClick={() => onSelectMode("interview")}>
          <h3>🎤 Interview Simulasi <span className="badge-premium">Premium</span></h3>
          <p>Simulasi interview beasiswa berbasis AI!</p>
        </div>
        <div className="mode-card sasaa-mode" onClick={() => onSelectMode("sasaa")}>
          <h3>🤖 Chatbot Sasaa <span className="badge-premium">Premium</span></h3>
          <p>Chatbot AI yang bantu cari lomba + analisis instan 🎯</p>
        </div>
        <div className="mode-card exchange-mode" onClick={() => onSelectMode("exchanges")}>
          <h3>✈️ Essay Exchanges <span className="badge-premium">Premium</span></h3>
          <p>Asisten AI untuk Motivation Letter Exchange!</p>
        </div>
      </div>
    </>
  );

  const renderCompetitionAssistant = () => (
    <>
      <h3 className="section-title">🏆 Asisten Lomba</h3>
      <div className="card-grid">
        <div className="mode-card essay-mode" onClick={() => onSelectMode("essay")}>
          <h3>📝 Essay Generator</h3>
          <p>Buat ide judul essay inovatif dan kreatif!</p>
        </div>
        <div className="mode-card kti-mode" onClick={() => onSelectMode("kti")}>
          <h3>📚 KTI Generator</h3>
          <p>Kembangkan ide Karya Tulis Ilmiah kompetitif!</p>
        </div>
        <div className="mode-card bp-mode" onClick={() => onSelectMode("bp")}>
          <h3>💼 Business Plan Generator</h3>
          <p>Buat rencana bisnis baru yang impactful!</p>
        </div>
      </div>
    </>
  );

  const renderPersonalBranding = () => (
    <>
      <h3 className="section-title">🌟 Personal Branding</h3>
      <div className="card-grid">
        <div className="mode-card bio-mode" onClick={() => onSelectMode("bio")}>
          <h3>📸 Instagram Bio Analyzer <span className="badge-premium">Premium</span></h3>
          <p>Optimalkan bio IG kamu sesuai gaya dan keahlian!</p>
        </div>
      </div>
    </>
  );

  return (
    <div className="mode-selector-container animate__animated animate__fadeIn">
      {showLoading && (
        <div className="loading-spinner-container">
          <div className="spinner"></div>
        </div>
      )}

      {!selectedField && !showLoading && renderFieldSelection()}

      {selectedField && !showLoading && (
        <>
          <button className="btn btn-outline-secondary mb-3" onClick={() => setSelectedField(null)}>
            ⬅️ Kembali ke Kategori
          </button>
          {selectedField === "student" && renderStudentDevelopment()}
          {selectedField === "competition" && renderCompetitionAssistant()}
          {selectedField === "branding" && renderPersonalBranding()}
        </>
      )}
    </div>
  );
};

export default ModeSelector;
