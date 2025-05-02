import 'animate.css';
import './ModeSelector.css';

const ModeSelector = ({ onSelectMode }) => {
  return (
    <div className="container animate__animated animate__fadeIn">
      <div className="row justify-content-center g-4">

        <div className="col-md-6 col-lg-4">
          <div className="mode-card essay-mode animate__animated animate__zoomIn animate__delay-1s" onClick={() => onSelectMode("essay")}>
            <h3 className="fw-bold">📝 Essay Generator</h3>
            <p>Buat ide judul essay inovatif dan kreatif!</p>
          </div>
        </div>

        <div className="col-md-6 col-lg-4">
          <div className="mode-card kti-mode animate__animated animate__zoomIn animate__delay-2s" onClick={() => onSelectMode("kti")}>
            <h3 className="fw-bold">📚 KTI Generator</h3>
            <p>Kembangkan ide Karya Tulis Ilmiah kompetitif!</p>
          </div>
        </div>

        <div className="col-md-6 col-lg-4">
          <div className="mode-card bp-mode animate__animated animate__zoomIn animate__delay-3s" onClick={() => onSelectMode("bp")}>
            <h3 className="fw-bold">💼 Business Plan Generator</h3>
            <p>Buat rencana bisnis baru yang impactful!</p>
          </div>
        </div>

        <div className="col-md-6 col-lg-4">
          <div className="mode-card exchange-mode animate__animated animate__zoomIn animate__delay-4s" onClick={() => onSelectMode("exchanges")}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h3 className="fw-bold mb-0">✈️ Essay Exchanges</h3>
              <span className="badge bg-danger">Premium</span>
            </div>
            <p>Asisten AI untuk Motivation Letter Exchange!</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ModeSelector;
