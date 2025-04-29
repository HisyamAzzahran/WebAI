import 'animate.css';
import './ModeSelector.css';

const ModeSelector = ({ onSelectMode }) => {
  return (
    <div className="container animate__animated animate__fadeIn">
      <div className="row justify-content-center g-4">

        <div className="col-md-6 col-lg-4">
          <div className="mode-card essay-mode" onClick={() => onSelectMode("essay")}>
            <h3 className="text-primary fw-bold">📝 Essay Generator</h3>
            <p className="text-muted">Buat ide judul essay inovatif dan kreatif!</p>
          </div>
        </div>

        <div className="col-md-6 col-lg-4">
          <div className="mode-card kti-mode" onClick={() => onSelectMode("kti")}>
            <h3 className="text-success fw-bold">📚 KTI Generator</h3>
            <p className="text-muted">Kembangkan ide Karya Tulis Ilmiah kompetitif!</p>
          </div>
        </div>

        <div className="col-md-6 col-lg-4">
          <div className="mode-card bp-mode" onClick={() => onSelectMode("bp")}>
            <h3 className="text-warning fw-bold">💼 Business Plan Generator</h3>
            <p className="text-muted">Buat rencana bisnis baru yang impactful!</p>
          </div>
        </div>

        <div className="col-md-6 col-lg-4">
          <div className="mode-card exchange-mode" onClick={() => onSelectMode("exchange")}>
            <h3 className="text-info fw-bold">✈️ Essay Exchanges Generator (Premium)</h3>
            <p className="text-muted">Asisten AI untuk Motivation Letter Exchange!</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ModeSelector;
