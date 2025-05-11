import 'animate.css';
import './ModeSelector.css';

const ModeSelector = ({ onSelectMode, isPremium }) => {
  return (
    <div className="mode-selector-container animate__animated animate__fadeIn">
      <h2 className="welcome-text animate__animated animate__fadeInDown">
        Halooo, Selamat Datang 👋👋
      </h2>

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

        <div className="mode-card exchange-mode" onClick={() => onSelectMode("exchanges")}>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h3>✈️ Essay Exchanges</h3>
            <span className="badge-premium">Premium</span>
          </div>
          <p>Asisten AI untuk Motivation Letter Exchange!</p>
        </div>

        <div className="mode-card interview-mode" onClick={() => onSelectMode("interview")}>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h3>🎤 Interview Simulasi</h3>
            <span className="badge-premium">Premium</span>
          </div>
          <p>Simulasi interview beasiswa berbasis AI!</p>
        </div>

        <div className="mode-card bio-mode" onClick={() => onSelectMode("bio")}>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h3>📸 Instagram Bio Analyzer</h3>
            <span className="badge-premium">Premium</span>
          </div>
          <p>Optimalkan bio IG kamu sesuai gaya dan keahlian!</p>
        </div>
      </div>

      <div className="mode-card ikigai-mode" onClick={() => onSelectMode("ikigai")}>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h3>🧭 Ikigai Self Discovery</h3>
          <span className="badge-premium">Premium</span>
        </div>
        <p>Pemetaan Ikigai dan Strategi Karier Berbasis AI!</p>
      </div>
    </div>
  );
};

export default ModeSelector;
