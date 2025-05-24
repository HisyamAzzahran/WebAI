import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ClipLoader } from 'react-spinners';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
// Import dari @react-pdf/renderer
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import './SwotAnalyzer.css'; // Pastikan CSS ini ada atau sesuaikan
import 'react-toastify/dist/ReactToastify.css';

const API_URL = "https://webai-production-b975.up.railway.app";

// --- STYLING BARU UNTUK PDF SWOT ---
// Font.register({ ... }); // Daftarkan font kustom jika perlu

const swotPdfStyles = StyleSheet.create({
  page: {
    paddingTop: 35,
    paddingBottom: 65,
    paddingHorizontal: 40,
    fontFamily: 'Helvetica', // Atau font kustom Anda
    fontSize: 10,
    lineHeight: 1.5, // Tingkatkan sedikit untuk keterbacaan
    color: '#34495e' // Warna teks default yang lebih lembut
  },
  header: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 10,
    color: '#2c3e50',
    fontWeight: 'bold',
    // fontFamily: 'Poppins_Bold', // Jika menggunakan font kustom
  },
  subHeader: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
    color: '#7f8c8d',
  },
  userDataSection: {
    marginBottom: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: '#eaeded',
    borderRadius: 4,
    backgroundColor: '#fcfdfd',
  },
  userDataTitle: {
    fontSize: 13,
    fontWeight: 'bold', // bold dari font family jika ada, atau 'bold'
    marginBottom: 8,
    color: '#1f618d',
  },
  userDataText: {
    fontSize: 10,
    marginBottom: 4,
  },
  // Styling untuk bagian narasi awal dan CTA
  introNarration: {
    fontStyle: 'italic',
    color: '#566573',
    marginBottom: 10,
    textAlign: 'justify',
  },
  transitionText: {
    marginBottom: 15,
    textAlign: 'justify',
  },
  closingCTA: {
    fontStyle: 'italic',
    color: '#566573',
    marginTop: 20,
    textAlign: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eaeded'
  },
  // Styling untuk bagian SWOT
  swotSectionContainer: {
    marginTop: 10,
    marginBottom: 10,
  },
  sectionHeader: { // Untuk S, W, O, T headers
    fontSize: 16,
    fontWeight: 'bold', // bold dari font family jika ada, atau 'bold'
    color: '#2980b9', // Warna berbeda untuk setiap section header bisa diatur di renderer
    marginBottom: 8,
    paddingBottom: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: '#aed6f1',
  },
  swotPoint: {
    marginBottom: 10,
    paddingLeft: 10, // Indent untuk setiap poin SWOT
  },
  pointTitle: { // Untuk "⭐ [Judul Point]: Penjelasan..."
    fontSize: 11,
    fontWeight: 'bold', // bold dari font family jika ada, atau 'bold'
    marginBottom: 3,
  },
  pointExplanation: { // Teks setelah judul poin
    // Ini akan digabungkan dengan pointTitle jika dalam baris yang sama
  },
  pointDetailLabel: { // Untuk "**Contoh:**" dan "**Strategi:**"
    fontWeight: 'bold', // bold dari font family jika ada, atau 'bold'
    color: '#2c3e50',
    marginTop: 2,
  },
  pointDetailText: { // Teks setelah label Contoh/Strategi
    paddingLeft: 15, // Indent untuk detail di bawah label
    marginBottom: 4,
    textAlign: 'justify',
  },
  paragraph: { // Untuk teks umum jika ada
    marginBottom: 6,
    textAlign: 'justify',
  },
  boldText: { fontWeight: 'bold' }, // Default bold
  italicText: { fontStyle: 'italic' }, // Default italic
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#95a5a6',
    fontSize: 8,
  },
});


// Komponen untuk membuat dokumen PDF SWOT
const SwotPDFDocument = ({ result, userData, mbti, via1, via2, via3 }) => {

  // Helper untuk render text dengan inline bold/italic (sederhana)
  const renderStyledText = (textLine, baseStyle = swotPdfStyles.paragraph) => {
    const parts = textLine.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return (
      <Text style={baseStyle}>
        {parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <Text key={i} style={swotPdfStyles.boldText}>{part.slice(2, -2)}</Text>;
          }
          if (part.startsWith('*') && part.endsWith('*')) {
            return <Text key={i} style={swotPdfStyles.italicText}>{part.slice(1, -1)}</Text>;
          }
          return <Text key={i}>{part}</Text>;
        })}
      </Text>
    );
  };

  const renderSwotPdfContent = (markdownContent) => {
    const elements = [];
    const lines = markdownContent.split('\n');
    let inSwotSection = false; // Flag untuk tahu jika kita di dalam blok S/W/O/T
    let sectionTypeColor = '#2980b9'; // Default color

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith('1. ') && elements.length < 2) { // Narasi awal
        elements.push(renderStyledText(trimmedLine.replace(/^1\.\s*/, ''), swotPdfStyles.introNarration));
        inSwotSection = false;
      } else if (trimmedLine.startsWith('2. ') && elements.length < 4) { // Kalimat transisi
        elements.push(renderStyledText(trimmedLine.replace(/^2\.\s*/, ''), swotPdfStyles.transitionText));
        inSwotSection = false;
      } else if (trimmedLine.startsWith('🟩 S –') || trimmedLine.startsWith('🟨 W –') || trimmedLine.startsWith('🟦 O –') || trimmedLine.startsWith('🟥 T –')) {
        inSwotSection = true;
        if (trimmedLine.startsWith('🟩')) sectionTypeColor = '#27ae60'; // Green
        else if (trimmedLine.startsWith('🟨')) sectionTypeColor = '#f39c12'; // Yellow/Orange
        else if (trimmedLine.startsWith('🟦')) sectionTypeColor = '#3498db'; // Blue
        else if (trimmedLine.startsWith('🟥')) sectionTypeColor = '#e74c3c'; // Red
        elements.push(<Text key={`section-${index}`} style={{...swotPdfStyles.sectionHeader, color: sectionTypeColor}}>{trimmedLine}</Text>);
      } else if (inSwotSection && /^[⭐⚠️🚀🔥]/.test(trimmedLine)) { // Judul Poin SWOT
        const match = trimmedLine.match(/^([⭐⚠️🚀🔥]\s*.*?):(.*)/);
        if (match) {
          elements.push(
            <View key={`point-${index}`} style={swotPdfStyles.swotPoint}>
              <Text style={swotPdfStyles.pointTitle}>
                <Text style={swotPdfStyles.boldText}>{match[1].trim()}:</Text>
                {match[2] ? renderStyledText(match[2].trim(), swotPdfStyles.pointExplanation) : ''}
              </Text>
            </View>
          );
        } else { // Fallback jika format sedikit berbeda
            elements.push(<View key={`point-${index}`} style={swotPdfStyles.swotPoint}><Text style={swotPdfStyles.pointTitle}>{renderStyledText(trimmedLine)}</Text></View>);
        }
      } else if (inSwotSection && trimmedLine.toLowerCase().startsWith('**contoh:**')) {
        elements.push(<View key={`contoh-${index}`} style={swotPdfStyles.swotPoint}><Text style={swotPdfStyles.pointDetailLabel}>Contoh:</Text>{renderStyledText(trimmedLine.replace(/\*\*contoh:\*\*/i, '').trim(), swotPdfStyles.pointDetailText)}</View>);
      } else if (inSwotSection && trimmedLine.toLowerCase().startsWith('**strategi:**')) {
        elements.push(<View key={`strategi-${index}`} style={swotPdfStyles.swotPoint}><Text style={swotPdfStyles.pointDetailLabel}>Strategi:</Text>{renderStyledText(trimmedLine.replace(/\*\*strategi:\*\*/i, '').trim(), swotPdfStyles.pointDetailText)}</View>);
      } else if (trimmedLine.toLowerCase().includes("relate nggak sama swot ini")) { // CTA Penutup
        elements.push(renderStyledText(trimmedLine, swotPdfStyles.closingCTA));
        inSwotSection = false;
      } else if (trimmedLine !== "" && !trimmedLine.startsWith('3. ')) { // Paragraf lain (hindari nomor section)
        elements.push(renderStyledText(trimmedLine, swotPdfStyles.paragraph));
        inSwotSection = false; // Asumsi paragraf umum bukan bagian dari poin SWOT spesifik
      }
    });
    return elements;
  };

  return (
    <Document author="ElevaAI" title={`Analisis SWOT - ${userData?.nama || 'Hasil'}`}>
      <Page size="A4" style={swotPdfStyles.page}>
        <Text style={swotPdfStyles.header}>Analisis SWOT Diri</Text>
        <Text style={swotPdfStyles.subHeader}>Powered by ElevaAI</Text>

        {userData && (
          <View style={swotPdfStyles.userDataSection}>
            <Text style={swotPdfStyles.userDataTitle}>Data Diri untuk Analisis:</Text>
            <Text style={swotPdfStyles.userDataText}><Text style={swotPdfStyles.boldText}>Nama:</Text> {userData.nama || 'N/A'}</Text>
            <Text style={swotPdfStyles.userDataText}><Text style={swotPdfStyles.boldText}>MBTI:</Text> {mbti || 'N/A'}</Text>
            <Text style={swotPdfStyles.userDataText}><Text style={swotPdfStyles.boldText}>VIA Strengths:</Text> {`${via1 || 'N/A'}, ${via2 || 'N/A'}, ${via3 || 'N/A'}`}</Text>
          </View>
        )}
        
        {renderSwotPdfContent(result)}

        <Text style={swotPdfStyles.footer} fixed>
          Dihasilkan oleh ElevaAI untuk {userData?.nama || 'Anda'} pada {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
        </Text>
      </Page>
    </Document>
  );
};


// ✅ Komponen Utama
const SwotAnalyzer = ({ email, isPremium, tokenSisa, setTokenSisa, userData }) => {
  const [hasTakenIkigai, setHasTakenIkigai] = useState(false); // State ini mungkin perlu dipertimbangkan lagi relevansinya
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

    if (!isPremium || tokenSisa < 1) { // Asumsi biaya token SWOT adalah 1
      toast.error("🚫 Token tidak cukup atau akun belum Premium (Perlu 1 token).");
      return;
    }

    setLoading(true);
    try {
      // Log penggunaan fitur
      await axios.post(`${API_URL}/log-feature`, { email, feature: 'swot_analyzer' });

      const res = await axios.post(`${API_URL}/analyze-swot`, {
        email,
        nama: userData.nama, // Pastikan userData.nama tersedia
        mbti,
        via1,
        via2,
        via3
      });

      if (res.status === 200 && res.data.result) {
        setResult(res.data.result);
        setTokenSisa((prev) => prev - 1); // Sesuaikan dengan biaya token sebenarnya
        toast.success("✅ Analisis SWOT berhasil dibuat!");
      } else {
        toast.error(res.data.error || "❌ Gagal generate analisis SWOT.");
      }
    } catch (err) {
      console.error("Error analyze-swot:", err);
      toast.error(err.response?.data?.error || "❌ Terjadi kesalahan server.");
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
  
  // Bagian "hasTakenIkigai" ini mungkin bisa disederhanakan atau dihilangkan
  // jika tidak ada ketergantungan langsung ke data Ikigai untuk input SWOT.
  // Untuk sekarang, saya biarkan sesuai kode asli Anda.
  return (
    <div className="swot-analyzer-container card"> {/* Tambahkan class card */}
      <div className="card-header text-center"> {/* Tambahkan card-header */}
         <h4>Analisis SWOT Diri (Premium)</h4>
      </div>
      <div className="card-body"> {/* Tambahkan card-body */}
        {!hasTakenIkigai && !result ? ( // Hanya tampilkan pertanyaan Ikigai jika belum ada hasil
          <div className="text-center ikigai-prompt-swot p-4 border rounded bg-light">
            <h5 className="mb-3">Sebelum Mulai Analisis SWOT...</h5>
            <p className="text-muted">Untuk hasil analisis SWOT yang lebih mendalam dan personal, idealnya kamu sudah mengetahui gambaran Ikigai-mu. Ini membantu AI memahami aspirasi dan nilai-nilaimu.</p>
            <p>Apakah kamu sudah mengambil tes Ikigai atau memiliki pemahaman tentang Ikigai-mu?</p>
            <button className="btn btn-primary mt-2" onClick={() => setHasTakenIkigai(true)}>
              Ya, Saya Paham / Sudah Tes Ikigai
            </button>
             <p className="mt-3 mb-0"><small>Jika belum, kamu tetap bisa melanjutkan, namun hasilnya mungkin lebih umum.</small></p>
          </div>
        ) : (
          <>
            <h5 className="mt-2 mb-3">🧠 Masukkan MBTI & Top 3 VIA Character Strengths</h5>
            <div className="form-group mb-3"> {/* Gunakan mb-3 untuk spacing */}
              <label className="form-label">MBTI Type:</label>
              <input type="text" className="form-control" value={mbti} onChange={(e) => setMbti(e.target.value.toUpperCase())} placeholder="Contoh: INFP (4 Huruf Kapital)" maxLength="4" />
            </div>
            <div className="form-group mb-2">
              <label className="form-label">VIA Character Strength #1:</label>
              <input type="text" className="form-control" value={via1} onChange={(e) => setVia1(e.target.value)} placeholder="Misal: Creativity" />
            </div>
            <div className="form-group mb-2">
              <label className="form-label">VIA Character Strength #2:</label>
              <input type="text" className="form-control" value={via2} onChange={(e) => setVia2(e.target.value)} placeholder="Misal: Honesty" />
            </div>
            <div className="form-group mb-3"> {/* Beri margin bawah lebih */}
              <label className="form-label">VIA Character Strength #3:</label>
              <input type="text" className="form-control" value={via3} onChange={(e) => setVia3(e.target.value)} placeholder="Misal: Kindness" />
            </div>
            <button onClick={handleAnalyze} disabled={loading || !mbti || !via1 || !via2 || !via3} className="btn btn-primary w-100 mt-3">
              {loading ? <ClipLoader size={20} color="#fff" /> : "🚀 Generate SWOT Analysis"}
            </button>
          </>
        )}

        {result && (
          <div className="swot-result mt-4 card shadow-sm"> {/* Hasil dalam card */}
            <div className="card-header">
              <h5 className="mb-0">📊 Hasil Analisis SWOT Anda:</h5>
            </div>
            <div className="card-body">
              <div
                className="markdown-output" // Gunakan kelas yang sama dengan fitur lain
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(result)) }}
              />
            </div>
            <div className="card-footer text-center"> {/* Footer untuk tombol download */}
              <PDFDownloadLink
                document={<SwotPDFDocument 
                            result={result} 
                            userData={userData} 
                            mbti={mbti} 
                            via1={via1} 
                            via2={via2} 
                            via3={via3} 
                          />}
                fileName={`Analisis_SWOT_${(userData?.nama || "ElevaAI").replace(/\s+/g, '_')}.pdf`}
                className="btn btn-success"
              >
                {({ loading: pdfLoading }) => (pdfLoading ? "⏳ Menyiapkan PDF..." : "📥 Download Analisis PDF")}
              </PDFDownloadLink>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SwotAnalyzer;