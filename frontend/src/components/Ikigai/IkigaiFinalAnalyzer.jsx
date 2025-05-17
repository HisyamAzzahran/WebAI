import React, { useState, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ClipLoader } from 'react-spinners';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import 'react-toastify/dist/ReactToastify.css';
import './IkigaiFinalAnalyzer.css';

const API_URL = "https://webai-production-b975.up.railway.app";

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 11, lineHeight: 1.5, fontFamily: 'Helvetica' },
  heading: { fontSize: 14, fontWeight: 'bold', marginBottom: 6 },
  paragraph: { marginBottom: 6 },
  listItem: { marginLeft: 10, marginBottom: 4, flexDirection: 'row' },
  bullet: { width: 10 },
  listText: { flex: 1 }
});

const parseMarkdownToPDF = (text) => {
  const lines = text.split('\n');
  const blocks = [];

  lines.forEach((line) => {
    if (line.startsWith('# ')) {
      blocks.push({ type: 'heading', content: line.replace('# ', '') });
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      blocks.push({ type: 'list', content: line.replace(/^[-*] /, '') });
    } else if (line.trim() !== '') {
      blocks.push({ type: 'paragraph', content: line });
    }
  });

  return blocks;
};

const IkigaiPDF = ({ hasil }) => {
  const blocks = parseMarkdownToPDF(hasil);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {blocks.map((block, index) => {
          switch (block.type) {
            case 'heading':
              return <Text key={index} style={styles.heading}>{block.content}</Text>;
            case 'list':
              return (
                <View key={index} style={styles.listItem}>
                  <Text style={styles.bullet}>\u2022</Text>
                  <Text style={styles.listText}>{block.content}</Text>
                </View>
              );
            default:
              return <Text key={index} style={styles.paragraph}>{block.content}</Text>;
          }
        })}
      </Page>
    </Document>
  );
};

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

      <button onClick={handleAnalyze} disabled={loading} className="btn btn-primary mt-3">
        {loading ? <ClipLoader size={20} color="#fff" /> : "🚀 Analyze Sweetspot Career & Business"}
      </button>

      {hasil && (
        <div>
          <div className="ikigai-hasil mt-4">
            <h5>📄 Hasil Strategi Karier dari AI:</h5>
            <div
              className="markdown-preview"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(marked.parse(hasil))
              }}
            />
          </div>

          <div className="text-center mt-3">
            <PDFDownloadLink
              document={<IkigaiPDF hasil={hasil} />}
              fileName={`ikigai-${userData.nama || "hasil"}.pdf`}
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

export default IkigaiFinalAnalyzer;