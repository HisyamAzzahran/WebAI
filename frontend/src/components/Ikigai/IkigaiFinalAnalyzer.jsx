import React, { useState, useRef } from 'react'; // useRef tidak terpakai, bisa dihapus jika tidak ada rencana lain
import axios from 'axios';
import { toast } from 'react-toastify';
import { ClipLoader } from 'react-spinners';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
// Import dari @react-pdf/renderer
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import 'react-toastify/dist/ReactToastify.css';
import './IkigaiFinalAnalyzer.css'; // Pastikan CSS ini ada atau sesuaikan

const API_URL = "https://webai-production-b975.up.railway.app";

// --- STYLING BARU UNTUK PDF IKIGAI ---
// Anda bisa mendaftarkan font kustom jika mau, contoh:
// Font.register({
//   family: 'Poppins',
//   fonts: [
//     { src: '/path/to/Poppins-Regular.ttf' }, 
//     { src: '/path/to/Poppins-Bold.ttf', fontWeight: 'bold' },
//   ]
// });

const ikigaiPdfStyles = StyleSheet.create({
  page: {
    paddingTop: 35,
    paddingBottom: 65,
    paddingHorizontal: 40, // Sedikit lebih lebar padding horizontal
    fontFamily: 'Helvetica', // Default, ganti jika sudah register font
    fontSize: 10,
    lineHeight: 1.5, // Line height lebih lega
    color: '#333333'
  },
  header: {
    fontSize: 22, // Ukuran judul utama lebih besar
    textAlign: 'center',
    marginBottom: 15,
    color: '#1A5276', // Warna biru tua untuk header
    fontWeight: 'bold',
    // fontFamily: 'Poppins', // Jika menggunakan font kustom
  },
  subHeader: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 25,
    color: '#566573',
  },
  userDataSection: {
    marginBottom: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EAECEE',
    borderRadius: 5,
    backgroundColor: '#FBFCFC',
  },
  userDataTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1F618D',
  },
  userDataText: {
    fontSize: 10,
    marginBottom: 3,
    color: '#283747',
  },
  h1: { fontSize: 18, fontWeight: 'bold', color: '#154360', marginBottom: 12, marginTop: 15, borderBottomWidth: 1, borderBottomColor: '#D4E6F1', paddingBottom: 4 },
  h2: { fontSize: 15, fontWeight: 'bold', color: '#1F618D', marginBottom: 10, marginTop: 10 },
  h3: { fontSize: 13, fontWeight: 'bold', color: '#2980B9', marginBottom: 8, marginTop: 8, paddingLeft: 5 }, // H3 dengan sedikit indent
  paragraph: { marginBottom: 6, textAlign: 'justify' }, // Justify paragraf
  boldText: { fontWeight: 'bold' },
  italicText: { fontStyle: 'italic' },
  listItem: { flexDirection: 'row', marginBottom: 4, paddingLeft: 15 }, // List item dengan indent lebih
  bullet: { width: 10, marginRight: 5, textAlign: 'center', fontWeight: 'bold', color: '#2980B9' }, // Bullet lebih menarik
  listItemText: { flex: 1, textAlign: 'justify'},
  ctaSection: { marginTop: 20, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#EAECEE'},
  ctaText: { fontStyle: 'italic', textAlign: 'center', color: '#566573', fontSize: 11},
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#7F8C8D',
    fontSize: 8,
  },
});

// Komponen untuk membuat dokumen PDF Ikigai
const IkigaiPDFDocument = ({ hasil, userData, selectedSpot, selectedSlice }) => {
  // Fungsi untuk mem-parse Markdown sederhana dan mengubahnya menjadi elemen React PDF
  const renderIkigaiPdfContent = (markdownContent) => {
    const elements = [];
    const lines = markdownContent.split('\n');

    // Helper untuk render text dengan inline bold/italic (sederhana)
    const renderStyledText = (textLine, baseStyle = ikigaiPdfStyles.paragraph) => {
      // Ini adalah parser inline yang sangat sederhana, bisa dikembangkan
      const parts = textLine.split(/(\*\*.*?\*\*|\*.*?\*)/g); // Pisahkan berdasarkan **bold** atau *italic*
      return (
        <Text style={baseStyle}>
          {parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <Text key={i} style={ikigaiPdfStyles.boldText}>{part.slice(2, -2)}</Text>;
            }
            if (part.startsWith('*') && part.endsWith('*')) {
              return <Text key={i} style={ikigaiPdfStyles.italicText}>{part.slice(1, -1)}</Text>;
            }
            return <Text key={i}>{part}</Text>;
          })}
        </Text>
      );
    };
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('1. Tabel Strategi Realistis Awal per Track') || trimmedLine.startsWith('## Tabel Strategi') || line.startsWith('# Tabel Strategi')) {
        elements.push(<Text key={`pdf-h2-${index}`} style={ikigaiPdfStyles.h2}>{trimmedLine.replace(/^[\d#.]+\s*/, '')}</Text>);
      } else if (trimmedLine.startsWith('2. Penjabaran Per Track') || trimmedLine.startsWith('## Penjabaran') || line.startsWith('# Penjabaran')) {
        elements.push(<Text key={`pdf-h2-${index}`} style={ikigaiPdfStyles.h2}>{trimmedLine.replace(/^[\d#.]+\s*/, '')}</Text>);
      } else if (trimmedLine.startsWith('3. CTA Penutup') || trimmedLine.startsWith('## CTA') || line.startsWith('# CTA')) {
         elements.push(<View key={`pdf-cta-section-${index}`} style={ikigaiPdfStyles.ctaSection}><Text style={ikigaiPdfStyles.h2}>{trimmedLine.replace(/^[\d#.]+\s*/, '')}</Text></View>);
      } else if (trimmedLine.match(/^###\s*(Employee Track|Self-Employed Track|Business Owner Track|Jurusan-Based Track)/i)) {
        elements.push(<Text key={`pdf-h3-${index}`} style={ikigaiPdfStyles.h3}>{trimmedLine.replace(/^###\s*/, '')}</Text>);
      } else if (trimmedLine.startsWith('- **') || trimmedLine.startsWith('* **')) { // Untuk poin seperti "- **Langkah Awal:**"
         elements.push(renderStyledText(trimmedLine.replace(/^[-*]\s*/, ''), {...ikigaiPdfStyles.paragraph, paddingLeft: 10}));
      } else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) { // List item biasa
        elements.push(
          <View key={`pdf-li-${index}`} style={ikigaiPdfStyles.listItem}>
            <Text style={ikigaiPdfStyles.bullet}>•</Text>
            {renderStyledText(trimmedLine.substring(2), ikigaiPdfStyles.listItemText)}
          </View>
        );
      } else if (trimmedLine.startsWith('# ')) { // Heading generik (jika ada)
        elements.push(<Text key={`pdf-h1-gen-${index}`} style={ikigaiPdfStyles.h1}>{trimmedLine.replace(/^#\s*/, '')}</Text>);
      } else if (trimmedLine !== "") { // Paragraf atau teks CTA
         if (elements.length > 0 && elements[elements.length-1].props.style === ikigaiPdfStyles.ctaSection) {
            elements.push(renderStyledText(trimmedLine, ikigaiPdfStyles.ctaText));
         } else {
            elements.push(renderStyledText(trimmedLine, ikigaiPdfStyles.paragraph));
         }
      }
    });
    return elements;
  };

  return (
    <Document author="ElevaAI" title={`Analisis Ikigai - ${userData?.nama || 'Hasil'}`}>
      <Page size="A4" style={ikigaiPdfStyles.page}>
        <Text style={ikigaiPdfStyles.header}>Analisis Sweet Spot Career & Business</Text>
        <Text style={ikigaiPdfStyles.subHeader}>Powered by ElevaAI</Text>

        {userData && (
          <View style={ikigaiPdfStyles.userDataSection}>
            <Text style={ikigaiPdfStyles.userDataTitle}>Data Analisis:</Text>
            <Text style={ikigaiPdfStyles.userDataText}><Text style={ikigaiPdfStyles.boldText}>Nama:</Text> {userData.nama || 'N/A'}</Text>
            <Text style={ikigaiPdfStyles.userDataText}><Text style={ikigaiPdfStyles.boldText}>Jurusan:</Text> {userData.jurusan || 'N/A'}</Text>
            {userData.mbti && <Text style={ikigaiPdfStyles.userDataText}><Text style={ikigaiPdfStyles.boldText}>MBTI:</Text> {userData.mbti}</Text>}
            {userData.via && Array.isArray(userData.via) && <Text style={ikigaiPdfStyles.userDataText}><Text style={ikigaiPdfStyles.boldText}>VIA Strengths:</Text> {userData.via.join(', ')}</Text>}
            {userData.career && Array.isArray(userData.career) && <Text style={ikigaiPdfStyles.userDataText}><Text style={ikigaiPdfStyles.boldText}>Career Roles:</Text> {userData.career.join(', ')}</Text>}
            {selectedSpot && <Text style={ikigaiPdfStyles.userDataText}><Text style={ikigaiPdfStyles.boldText}>Ikigai Spot Dipilih:</Text> {selectedSpot}</Text>}
            {selectedSlice && <Text style={ikigaiPdfStyles.userDataText}><Text style={ikigaiPdfStyles.boldText}>Slice of Life Dipilih:</Text> {selectedSlice}</Text>}
          </View>
        )}

        {renderIkigaiPdfContent(hasil)}

        <Text style={ikigaiPdfStyles.footer} fixed>
          Dihasilkan oleh ElevaAI untuk {userData?.nama || 'Anda'} pada {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
        </Text>
      </Page>
    </Document>
  );
};


const IkigaiFinalAnalyzer = ({
  email,
  tokenSisa,
  setTokenSisa,
  isPremium,
  userData, // Ini sudah berisi: nama, jurusan, mbti, via, career dari step sebelumnya
  ikigaiSpotList,
  sliceList
}) => {
  const [selectedSpot, setSelectedSpot] = useState('');
  const [selectedSlice, setSelectedSlice] = useState('');
  const [hasil, setHasil] = useState('');
  const [loading, setLoading] = useState(false);
  // const pdfRef = useRef(); // Tidak terpakai, bisa dihapus

  const handleAnalyze = async () => {
    if (!selectedSpot || !selectedSlice) {
      toast.warning("⚠️ Pilih dulu Ikigai Spot dan Slice of Life-nya ya!");
      return;
    }

    if (!isPremium || tokenSisa < 5) { // Asumsi biaya token Ikigai adalah 5
      toast.error("🚫 Token tidak cukup atau akun belum Premium (Perlu 5 token).");
      return;
    }

    setLoading(true);
    try {
      // Log penggunaan fitur
      await axios.post(`${API_URL}/log-feature`, { email, feature: "ikigai_final_analysis" });

      const res = await axios.post(`${API_URL}/analyze-ikigai-final`, {
        email,
        ikigaiSpot: selectedSpot,
        slicePurpose: selectedSlice,
        ...userData // Mengirim semua data user yang sudah terkumpul
      });

      if (res.status === 200 && res.data.result) {
        setHasil(res.data.result);
        setTokenSisa((prev) => prev - 5); // Sesuaikan dengan biaya token sebenarnya
        toast.success("✅ Strategi karier berhasil dibuat!");
      } else {
        toast.error(res.data.error || "❌ Gagal generate strategi karier.");
      }
    } catch (err) {
      console.error("Error analyze-ikigai-final:", err);
      toast.error(err.response?.data?.error || "❌ Terjadi kesalahan server.");
    } finally {
      setLoading(false);
    }
  };

  // ... (renderan kondisional untuk !isPremium dan tokenSisa < 5 tetap sama) ...
  if (!isPremium) {
    return (
      <div className="alert alert-warning text-center mt-4">
        🚫 Fitur ini hanya untuk <strong>Premium Users</strong>! Silakan upgrade akunmu. 🚀
      </div>
    );
  }

  if (tokenSisa < 5) { // Sesuaikan jika biaya token berbeda
    return (
      <div className="alert alert-danger text-center mt-4">
        ⚠️ Token kamu tidak cukup (minimal 5 token diperlukan untuk fitur ini).
      </div>
    );
  }

  return (
    <div className="ikigai-final-container card"> {/* Tambahkan class card untuk konsistensi */}
      <div className="card-header text-center"> {/* Tambahkan card-header */}
        <h4>🎯 Step 4: Pilih Ikigai Spot & Slice of Life</h4>
      </div>
      <div className="card-body"> {/* Tambahkan card-body */}
        <div className="choice-section">
          <label className="form-label">💡 Pilih Ikigai Spot:</label> {/* Gunakan form-label */}
          <div className="choice-grid"> {/* Wrapper untuk grid jika banyak item */}
            {ikigaiSpotList.map((spot, index) => (
              <div key={index} className={`choice-box ${selectedSpot === spot ? 'selected' : ''}`}
                onClick={() => setSelectedSpot(spot)}>
                {spot}
              </div>
            ))}
          </div>
        </div>

        <div className="choice-section mt-3"> {/* Tambah margin top */}
          <label className="form-label">🌱 Pilih Slice of Life Purpose:</label>
          <div className="choice-grid">
            {sliceList.map((slice, index) => (
              <div key={index} className={`choice-box ${selectedSlice === slice ? 'selected' : ''}`}
                onClick={() => setSelectedSlice(slice)}>
                {slice}
              </div>
            ))}
          </div>
        </div>

        <button onClick={handleAnalyze} disabled={loading || !selectedSpot || !selectedSlice} className="btn btn-primary w-100 mt-4"> {/* Tombol full width */}
          {loading ? <ClipLoader size={20} color="#fff" /> : "🚀 Analyze Sweetspot Career & Business"}
        </button>

        {hasil && (
          <div className="mt-4"> {/* Wrapper untuk hasil dan tombol download */}
            <div className="ikigai-hasil card shadow-sm"> {/* Hasil dalam card lagi */}
              <div className="card-header">
                 <h5>📄 Hasil Strategi Karier dari AI:</h5>
              </div>
              <div className="card-body">
                <div
                  className="markdown-output" // Gunakan kelas yang sama dengan StudentGoalsPlanner
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(marked.parse(hasil))
                  }}
                />
              </div>
            </div>

            <div className="text-center mt-3 mb-2"> {/* Tombol download di tengah */}
              <PDFDownloadLink
                document={<IkigaiPDFDocument 
                            hasil={hasil} 
                            userData={userData} 
                            selectedSpot={selectedSpot} 
                            selectedSlice={selectedSlice} 
                          />}
                fileName={`Analisis_Ikigai_${(userData?.nama || "ElevaAI").replace(/\s+/g, '_')}.pdf`}
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

export default IkigaiFinalAnalyzer;