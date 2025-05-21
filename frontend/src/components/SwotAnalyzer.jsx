import React, { useState, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ClipLoader } from 'react-spinners';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import './SwotAnalyzer.css';

const API_URL = "https://webai-production-b975.up.railway.app";

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 11, lineHeight: 1.5, fontFamily: 'Helvetica' },
  heading: { fontSize: 14, fontWeight: 'bold', marginBottom: 6 },
  paragraph: { marginBottom: 6 }
});

const SwotPDF = ({ result }) => {
  const blocks = result.split('\n').map((line, index) => <Text key={index} style={styles.paragraph}>{line}</Text>);
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {blocks}
      </Page>
    </Document>
  );
};

const SwotAnalyzer = ({ email, isPremium, tokenSisa, setTokenSisa, userData }) => {
  const [hasTakenIkigai, setHasTakenIkigai] = useState(false);
  const [mbti, setMbti] = useState('');
  const [via1, setVia1] = useState('');
  const [via2, setVia2] = useState('');
  const [via3, setVia3] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!mbti || !via1 || !via2 || !via3) {
      toast.warning("⚠️ Lengkapi semua input MBTI dan VIA ya!");
      return;
    }

    if (!isPremium || tokenSisa < 1) {
      toast.error("🚫 Token tidak cukup atau akun belum Premium.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/analyze-swot`, {
        email,
        nama: userData.nama,
        mbti,
        via1,
        via2,
        via3
      });

      if (res.status === 200 && res.data.result) {
        setResult(res.data.result);
        setTokenSisa((prev) => prev - 1);

        await axios.post(`${API_URL}/log-feature`, {
            email,
            feature: 'SwotAnalyzer',
        });
        
        toast.success("✅ Analisis SWOT berhasil dibuat!");
      } else {
        toast.error("❌ Gagal generate analisis SWOT.");
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
        🚫 Fitur ini hanya tersedia untuk <strong>Premium Users</strong>! Silakan upgrade akunmu.
      </div>
    );
  }

  return (
    <div className="swot-analyzer-container">
      {!hasTakenIkigai ? (
        <div className="text-center">
          <h4>🔍 Apakah kamu sudah tes Ikigai?</h4>
          <button className="btn btn-success mt-3" onClick={() => setHasTakenIkigai(true)}>
            Saya Sudah Tes
          </button>
        </div>
      ) : (
        <>
          <h4 className="mt-3">🧠 Masukkan MBTI & Top 3 VIA Character Strengths</h4>
          <div className="form-group mt-3">
            <label>MBTI Type:</label>
            <input type="text" className="form-control" value={mbti} onChange={(e) => setMbti(e.target.value)} placeholder="Contoh: INFP" />
          </div>
          <div className="form-group mt-2">
            <label>VIA Strength 1:</label>
            <input type="text" className="form-control" value={via1} onChange={(e) => setVia1(e.target.value)} />
          </div>
          <div className="form-group mt-2">
            <label>VIA Strength 2:</label>
            <input type="text" className="form-control" value={via2} onChange={(e) => setVia2(e.target.value)} />
          </div>
          <div className="form-group mt-2">
            <label>VIA Strength 3:</label>
            <input type="text" className="form-control" value={via3} onChange={(e) => setVia3(e.target.value)} />
          </div>
          <button onClick={handleAnalyze} disabled={loading} className="btn btn-primary mt-3">
            {loading ? <ClipLoader size={20} color="#fff" /> : "🚀 Generate SWOT Analysis"}
          </button>
        </>
      )}

      {result && (
        <div className="swot-result mt-4">
          <h5>📊 Hasil Analisis SWOT:</h5>
          <div className="markdown-preview" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(result)) }} />

          <div className="text-center mt-3">
            <PDFDownloadLink
              document={<SwotPDF result={result} />}
              fileName={`swot-${userData.nama || "hasil"}.pdf`}
              className="btn btn-success"
            >
              {({ loading }) => (loading ? "⏳ Menyiapkan PDF..." : "📥 Download sebagai PDF")}
            </PDFDownloadLink>
          </div>
        </div>
      )}
    </div>
  );
};

export default SwotAnalyzer;
