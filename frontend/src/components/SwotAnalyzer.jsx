import React, { useState, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ClipLoader } from 'react-spinners';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { PDFDownloadLink, Document, Page, Text, StyleSheet } from '@react-pdf/renderer';
import './SwotAnalyzer.css';

const API_URL = "https://webai-production-b975.up.railway.app";

// 📝 PDF styling
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 11,
    lineHeight: 1.5,
    fontFamily: 'Helvetica',
    backgroundColor: '#fff'
  },
  heading: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333'
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 6,
    color: '#444',
    textDecoration: 'underline'
  },
  bullet: {
    marginBottom: 6
  }
});

// 🔍 Markdown parser for PDF blocks
const parseMarkdownToPDF = (text) => {
  const lines = text.split('\n');
  const blocks = [];

  lines.forEach((line) => {
    if (line.startsWith('# ')) {
      blocks.push({ type: 'heading', content: line.slice(2) });
    } else if (line.startsWith('🟩') || line.startsWith('🟨') || line.startsWith('🟦') || line.startsWith('🟥')) {
      blocks.push({ type: 'section', content: line });
    } else if (line.trim() !== '') {
      blocks.push({ type: 'paragraph', content: line });
    }
  });

  return blocks;
};

// 📄 PDF Component
const SwotPDF = ({ result }) => {
  const blocks = parseMarkdownToPDF(result);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {blocks.map((block, i) => {
          if (block.type === 'heading') {
            return <Text key={i} style={styles.heading}>{block.content}</Text>;
          }
          if (block.type === 'section') {
            return <Text key={i} style={styles.sectionHeader}>{block.content}</Text>;
          }
          return <Text key={i} style={styles.bullet}>• {block.content}</Text>;
        })}
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
          <div
            className="markdown-preview"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(result)) }}
          />
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
