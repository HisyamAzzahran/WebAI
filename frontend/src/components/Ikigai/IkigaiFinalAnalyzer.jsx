import React, { useState, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ClipLoader } from 'react-spinners';
import ReactToPdf from 'react-to-pdf';
import 'react-toastify/dist/ReactToastify.css';
import './IkigaiFinalAnalyzer.css';

const API_URL = "https://webai-production-b975.up.railway.app";

const IkigaiFinalAnalyzer = ({
  email,
  tokenSisa,
  setTokenSisa,
  isPremium,
  userData,
  ikigaiSpotList,
  sliceList
}) => {
  const [selectedSpot, setSelectedSpot] = useState('');
  const [selectedSlice, setSelectedSlice] = useState('');
  const [hasil, setHasil] = useState('');
  const [loading, setLoading] = useState(false);
  const pdfRef = useRef();

  const handleAnalyze = async () => {
    if (!selectedSpot || !selectedSlice) {
      toast.warning("⚠️ Pilih dulu Ikigai Spot dan Slice of Life-nya ya!");
      return;
    }

    if (!isPremium || tokenSisa < 5) {
      toast.error("🚫 Token tidak cukup atau akun belum Premium.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/analyze-ikigai-final`, {
        email,
        ikigaiSpot: selectedSpot,
        slicePurpose: selectedSlice,
        ...userData
      });

      if (res.status === 200 && res.data.result) {
        setHasil(res.data.result);
        setTokenSisa((prev) => prev - 5);
        toast.success("✅ Strategi karier berhasil dibuat!");
      } else {
        toast.error("❌ Gagal generate strategi karier.");
      }
    } catch (err) {
      console.error(err);
      toast.error("❌ Terjadi kesalahan server.");
    } finally {
      setLoading(false);
    }
  };

  if (!isPremium) {
    return (
      <div className="alert alert-warning text-center mt-4">
        🚫 Fitur ini hanya untuk <strong>Premium Users</strong>! Silakan upgrade akunmu. 🚀
      </div>
    );
  }

  if (tokenSisa < 5) {
    return (
      <div className="alert alert-danger text-center mt-4">
        ⚠️ Token kamu tidak cukup (minimal 5 token diperlukan).
      </div>
    );
  }

  return (
    <div className="ikigai-final-container">
      <h4>🎯 Step 4: Pilih Ikigai Spot & Slice of Life</h4>

      <div className="choice-section">
        <label>💡 Pilih Ikigai Spot:</label>
        {ikigaiSpotList.map((spot, index) => (
          <div key={index} className={`choice-box ${selectedSpot === spot ? 'selected' : ''}`}
            onClick={() => setSelectedSpot(spot)}>
            {spot}
          </div>
        ))}
      </div>

      <div className="choice-section">
        <label>🌱 Pilih Slice of Life Purpose:</label>
        {sliceList.map((slice, index) => (
          <div key={index} className={`choice-box ${selectedSlice === slice ? 'selected' : ''}`}
            onClick={() => setSelectedSlice(slice)}>
            {slice}
          </div>
        ))}
      </div>

      <button onClick={handleAnalyze} disabled={loading}>
        {loading ? <ClipLoader size={20} color="#fff" /> : "🚀 Analyze Sweetspot Career & Business"}
      </button>

      {hasil && (
        <div>
          <div className="ikigai-hasil mt-4" ref={pdfRef}>
            <h5>📄 Hasil Strategi Karier dari AI:</h5>
            <pre>{hasil}</pre>
          </div>

          <div className="text-center mt-3">
            <ReactToPdf targetRef={pdfRef} filename={`ikigai-${userData.nama}.pdf`} options={{ orientation: 'portrait' }} scale={0.8}>
              {({ toPdf }) => (
                <button className="btn-outline-success" onClick={toPdf}>
                  📥 Download PDF
                </button>
              )}
            </ReactToPdf>
          </div>
        </div>
      )}
    </div>
  );
};

export default IkigaiFinalAnalyzer;
