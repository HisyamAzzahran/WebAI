import 'animate.css'; // Pastikan animate.css sudah diimport
import './ModeSelector.css'; // Nanti kita buat CSS kecil custom

const ModeSelector = ({ onSelectMode }) => {
  return (
    <div className="row justify-content-center animate__animated animate__fadeIn">
      <div className="col-md-5 mb-3">
        <div
          className="mode-card essay-mode"
          onClick={() => onSelectMode("essay")}
        >
          <h3 className="text-primary fw-bold">📝 Essay Generator</h3>
          <p className="text-muted">
            Buat ide judul essay yang inovatif dan menarik!
          </p>
        </div>
      </div>

      <div className="col-md-5 mb-3">
        <div
          className="mode-card kti-mode"
          onClick={() => onSelectMode("kti")}
        >
          <h3 className="text-success fw-bold">📚 KTI Generator</h3>
          <p className="text-muted">
            Bangun ide Karya Tulis Ilmiah kompleks untuk project atau lomba!
          </p>
        </div>
      </div>
    </div>
  );
};

export default ModeSelector;
