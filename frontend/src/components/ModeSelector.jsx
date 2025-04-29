import 'animate.css'; // Sudah animate
import './ModeSelector.css'; // Buat kotak seragam dan hover effect

const ModeSelector = ({ onSelectMode }) => {
  return (
    <div className="row justify-content-center animate__animated animate__fadeIn">
      {/* Essay */}
      <div className="col-md-4 mb-3">
        <div
          className="mode-card essay-mode"
          onClick={() => onSelectMode("essay")}
        >
          <h3 className="text-primary fw-bold">📝 Essay Generator</h3>
          <p className="text-muted">
            Buat ide judul essay inovatif dan kreatif untuk lomba atau tugasmu!
          </p>
        </div>
      </div>

      {/* KTI */}
      <div className="col-md-4 mb-3">
        <div
          className="mode-card kti-mode"
          onClick={() => onSelectMode("kti")}
        >
          <h3 className="text-success fw-bold">📚 KTI Generator</h3>
          <p className="text-muted">
            Kembangkan ide Karya Tulis Ilmiah untuk kompetisi atau riset!
          </p>
        </div>
      </div>

      {/* Business Plan */}
      <div className="col-md-4 mb-3">
        <div
          className="mode-card bp-mode"
          onClick={() => onSelectMode("bp")}
        >
          <h3 className="text-warning fw-bold">💼 Business Plan Generator</h3>
          <p className="text-muted">
            Buat ide bisnis baru kekinian!
          </p>
        </div>
      </div>
    </div>
  );
};

export default ModeSelector;
