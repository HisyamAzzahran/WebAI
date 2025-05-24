import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ClipLoader } from 'react-spinners';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

// --- TAMBAHKAN IMPORT UNTUK PDF ---
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
// ----------------------------------

import './StudentGoalsPlanner.css';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = "https://webai-production-b975.up.railway.app";
const TOKEN_COST_PER_GENERATION = 3;

const pdfStyles = StyleSheet.create({
  page: {
    paddingTop: 35,
    paddingBottom: 65,
    paddingHorizontal: 35,
    fontFamily: 'Helvetica', // Default, atau ganti dengan font kustom setelah didaftarkan
    fontSize: 10,
    lineHeight: 1.4,
  },
  header: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 10,
    color: '#2c3e50',
    fontWeight: 'bold',
  },
  userInfo: {
    fontSize: 11,
    marginBottom: 20,
    textAlign: 'center',
    color: '#34495e',
  },
  h1: { fontSize: 16, fontWeight: 'bold', color: '#154360', marginBottom: 10, marginTop: 8, borderBottomWidth: 0.5, borderBottomColor: '#aed6f1', paddingBottom: 2 },
  h2: { fontSize: 14, fontWeight: 'bold', color: '#1f618d', marginBottom: 8, marginTop: 6 },
  h3: { fontSize: 12, fontWeight: 'bold', color: '#2980b9', marginBottom: 6, marginTop: 4 },
  paragraph: { marginBottom: 5, textAlign: 'justify' },
  boldText: { fontWeight: 'bold' }, // Didefinisikan sebagai 'bold' di React PDF, atau daftarkan font bold
  italicText: { fontStyle: 'italic' }, // Didefinisikan sebagai 'italic' di React PDF
  listItem: { flexDirection: 'row', marginBottom: 3, paddingLeft: 10 },
  bullet: { width: 10, marginRight: 5, textAlign: 'center' },
  listItemText: { flex: 1, textAlign: 'justify'},
  actionStepItem: { flexDirection: 'row', marginBottom: 2, paddingLeft: 20 },
  actionStepNumber: { width: 15, marginRight: 3, fontWeight: 'bold' },
  quoteSection: { marginTop: 15, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#eeeeee'},
  quoteText: { fontStyle: 'italic', textAlign: 'center', color: '#566573', fontSize: 11},
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 35,
    right: 35,
    textAlign: 'center',
    color: 'grey',
    fontSize: 8,
  },
});

// Komponen untuk membuat dokumen PDF
const StudentGoalsPDFDocument = ({ plan, userData }) => {
  const { semester, content } = plan;
  // Fungsi untuk mem-parse Markdown sederhana dan mengubahnya menjadi elemen React PDF
  // Ini akan lebih kompleks jika Markdown-nya rumit.
  const renderPdfContent = (markdownContent) => {
    const elements = [];
    const lines = markdownContent.split('\n');
    let currentListLevel = 0; // Untuk indentasi list

    lines.forEach((line, index) => {
      line = line.trim(); // Hapus spasi ekstra di awal/akhir
      if (line.startsWith('# 📚')) {
        elements.push(<Text key={`pdf-h1-${index}`} style={pdfStyles.h1}>{line.replace(/^#\s*📚\s*/, '')}</Text>);
      } else if (line.startsWith('## 🎯')) {
        elements.push(<Text key={`pdf-h2-${index}`} style={pdfStyles.h2}>{line.replace(/^##\s*🎯\s*/, '')}</Text>);
      } else if (line.startsWith('### Main Mission')) {
        elements.push(<Text key={`pdf-h3-${index}`} style={pdfStyles.h3}>{line.replace(/^###\s*/, '')}</Text>);
      } else if (line.startsWith('## 💬')) {
         elements.push(<View key={`pdf-quote-section-${index}`} style={pdfStyles.quoteSection}><Text style={pdfStyles.h2}>{line.replace(/^##\s*💬\s*/, '')}</Text></View>);
      } else if (line.startsWith('- **Deskripsi Singkat:**')) {
        elements.push(<Text key={`pdf-desc-${index}`} style={pdfStyles.paragraph}><Text style={pdfStyles.boldText}>Deskripsi Singkat:</Text> {line.replace('- **Deskripsi Singkat:**', '').trim()}</Text>);
      } else if (line.startsWith('- **Target Utama:**')) {
        elements.push(<Text key={`pdf-target-${index}`} style={pdfStyles.paragraph}><Text style={pdfStyles.boldText}>Target Utama:</Text> {line.replace('- **Target Utama:**', '').trim()}</Text>);
      } else if (line.startsWith('- **Side Mission')) {
        elements.push(<Text key={`pdf-sideh-${index}`} style={{...pdfStyles.h3, fontSize: 11, color: '#5499c7', marginLeft: 10, marginTop:3, marginBottom:1}}>{line.replace(/^-\s*/, '').trim()}</Text>);
      } else if (line.startsWith('- *Action Steps:*')) {
        elements.push(<Text key={`pdf-actionlabel-${index}`} style={{...pdfStyles.italicText, marginLeft: 20, marginBottom:1, marginTop:1, fontWeight:'bold'}}>Action Steps:</Text>);
      } else if (/^\s*\d+\.\s/.test(line)) { // Item list bernomor (Action Steps)
        elements.push(
          <View key={`pdf-action-${index}`} style={pdfStyles.actionStepItem}>
            <Text style={pdfStyles.actionStepNumber}>{line.match(/^\s*(\d+\.)/)[0]}</Text>
            <Text style={pdfStyles.listItemText}>{line.replace(/^\s*\d+\.\s/, '').trim()}</Text>
          </View>
        );
      } else if (line.startsWith('- ')) { // Item list bullet biasa (jika ada)
        elements.push(
          <View key={`pdf-li-${index}`} style={pdfStyles.listItem}>
            <Text style={pdfStyles.bullet}>•</Text>
            <Text style={pdfStyles.listItemText}>{line.substring(2).trim()}</Text>
          </View>
        );
      } else if (line.trim() !== "") { // Paragraf biasa atau teks kutipan
        if (elements.length > 0 && elements[elements.length-1].props.style === pdfStyles.quoteSection) {
             elements.push(<Text key={`pdf-quote-text-${index}`} style={pdfStyles.quoteText}>{line.trim()}</Text>);
        } else {
            elements.push(<Text key={`pdf-p-${index}`} style={pdfStyles.paragraph}>{line.trim()}</Text>);
        }
      }
    });
    return elements;
  };

  return (
    <Document author="ElevaAI" title={`Rencana Studi Semester ${semester} - ${userData?.nama || 'Mahasiswa'}`}>
      <Page size="A4" style={pdfStyles.page}>
        <Text style={pdfStyles.header}>Student Goals Planning - ElevaAI</Text>
        {userData && (
          <View style={pdfStyles.userInfo}>
            <Text>Nama: {userData.nama || 'N/A'}</Text>
            <Text>Jurusan: {userData.jurusan || 'N/A'}</Text>
            <Text>Rencana untuk Semester: {semester}</Text>
          </View>
        )}
        {renderPdfContent(content)}
        <Text style={pdfStyles.footer} fixed>
          Dihasilkan oleh ElevaAI pada {new Date().toLocaleDateString('id-ID')}
        </Text>
      </Page>
    </Document>
  );
};


const StudentGoalsPlanner = ({ email, tokenSisa, setTokenSisa, isPremium }) => {
  // ... (SEMUA STATE DAN FUNGSI ANDA YANG SUDAH ADA: nama, jurusan, dll.) ...
  const [nama, setNama] = useState('');
  const [jurusan, setJurusan] = useState('');
  const [inputSemester, setInputSemester] = useState('');
  const [modeAction, setModeAction] = useState('fast');
  const [swotFile, setSwotFile] = useState(null);
  const [ikigaiFile, setIkigaiFile] = useState(null);
  const [swotFileName, setSwotFileName] = useState('');
  const [ikigaiFileName, setIkigaiFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingHistory, setIsFetchingHistory] = useState(true);
  const [generatedPlans, setGeneratedPlans] = useState([]);
  const [initialDataForSession, setInitialDataForSession] = useState(null);

  const fetchPlanHistory = useCallback(async () => {
    if (!email) return;
    setIsFetchingHistory(true);
    try {
      const response = await axios.get(`${API_URL}/student-goals/history?email=${email}`);
      if (response.data && Array.isArray(response.data.plans)) {
        const sortedPlans = response.data.plans.sort((a, b) => a.semester - b.semester || new Date(b.timestamp) - new Date(a.timestamp));
        setGeneratedPlans(sortedPlans);
        if (sortedPlans.length > 0) {
            const latestInitialDataSourcePlan = sortedPlans.find(p => p.is_initial_data_source);
            const sourceToUse = latestInitialDataSourcePlan || sortedPlans[0]; // Fallback ke plan pertama jika tidak ada flag
            
            if (sourceToUse) { // Pastikan sourceToUse tidak undefined
                setNama(sourceToUse.nama_input || '');
                setJurusan(sourceToUse.jurusan_input || '');
                setModeAction(sourceToUse.mode_action_input || 'fast');
                setInitialDataForSession({
                    nama: sourceToUse.nama_input,
                    jurusan: sourceToUse.jurusan_input,
                    modeAction: sourceToUse.mode_action_input,
                    swotFileRef: sourceToUse.swot_file_ref,
                    ikigaiFileRef: sourceToUse.ikigai_file_ref,
                });
            }
        }
      }
    } catch (error) {
      console.error("Gagal memuat riwayat Student Goals:", error);
    } finally {
      setIsFetchingHistory(false);
    }
  }, [email]);

  useEffect(() => {
    fetchPlanHistory();
  }, [fetchPlanHistory]);

  const handleFileChange = (event, fileType) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast.warn("⚠️ Hanya file PDF yang diperbolehkan.");
        event.target.value = null;
        if (fileType === 'swot') { setSwotFile(null); setSwotFileName(''); }
        else { setIkigaiFile(null); setIkigaiFileName(''); }
        return;
      }
      if (fileType === 'swot') {
        setSwotFile(file);
        setSwotFileName(file.name);
      } else if (fileType === 'ikigai') {
        setIkigaiFile(file);
        setIkigaiFileName(file.name);
      }
    } else {
        if (fileType === 'swot') { setSwotFile(null); setSwotFileName(''); }
        else { setIkigaiFile(null); setIkigaiFileName(''); }
    }
  };

  const validateBaseRequirements = () => {
    if (!isPremium) {
      toast.error("🚫 Fitur ini hanya untuk Pengguna Premium.");
      return false;
    }
    if (tokenSisa < TOKEN_COST_PER_GENERATION) {
      toast.error(`🚫 Token tidak cukup. Anda memerlukan ${TOKEN_COST_PER_GENERATION} token.`);
      return false;
    }
    return true;
  }

  const processPlanGeneration = async ({ targetSemester, isRegeneration = false, isAddingSuperPlan = false, planIdToRegenerate = null }) => {
    if (!validateBaseRequirements()) return;

    if (!isRegeneration && !isAddingSuperPlan) {
      if (!nama.trim() || !jurusan.trim() || !inputSemester.trim()) {
        toast.warn("⚠️ Nama, Jurusan, dan Semester awal harus diisi.");
        return;
      }
      if (!swotFile || !ikigaiFile) {
        toast.warn("⚠️ Harap unggah file PDF hasil SWOT dan Ikigai untuk rencana awal.");
        return;
      }
      const semesterNum = parseInt(inputSemester, 10);
       if (isNaN(semesterNum) || semesterNum < 1 || semesterNum > 14) {
        toast.warn("⚠️ Semester tidak valid (1-14).");
        return;
      }
    } else if (isAddingSuperPlan || isRegeneration) {
        if (!initialDataForSession) {
            toast.error("❌ Data sesi awal tidak ditemukan. Harap buat rencana awal terlebih dahulu.");
            return;
        }
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('email', email);

    if (!isAddingSuperPlan && !isRegeneration) {
        formData.append('nama', nama);
        formData.append('jurusan', jurusan);
        formData.append('semester_input_awal', inputSemester);
        formData.append('mode_action', modeAction);
        if (swotFile) formData.append('swot_pdf', swotFile);
        if (ikigaiFile) formData.append('ikigai_pdf', ikigaiFile);
        // Tidak setInitialDataForSession di sini, tunggu response backend
    } else if (initialDataForSession) {
        formData.append('nama', initialDataForSession.nama);
        formData.append('jurusan', initialDataForSession.jurusan);
        formData.append('mode_action', initialDataForSession.modeAction);
        if (initialDataForSession.swotFileRef && initialDataForSession.swotFileRef !== 'pending_upload') formData.append('swot_file_ref', initialDataForSession.swotFileRef);
        if (initialDataForSession.ikigaiFileRef && initialDataForSession.ikigaiFileRef !== 'pending_upload') formData.append('ikigai_file_ref', initialDataForSession.ikigaiFileRef);
    }

    formData.append('target_semester', targetSemester);
    if (isRegeneration) formData.append('is_regeneration', 'true');
    if (isAddingSuperPlan) formData.append('is_adding_super_plan', 'true');
    if (planIdToRegenerate) formData.append('plan_id_to_regenerate', planIdToRegenerate);

    try {
      const response = await axios.post(`${API_URL}/student-goals/generate`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data && response.data.plan) {
        const newPlanData = response.data.plan;
        
        setGeneratedPlans(prevPlans => {
            let updatedPlans;
            if (isRegeneration && planIdToRegenerate) {
                updatedPlans = prevPlans.map(p => p.id === planIdToRegenerate ? { ...p, ...newPlanData } : p);
            } else {
                const existingPlanIndex = prevPlans.findIndex(p => p.semester === newPlanData.semester && p.id === newPlanData.id); // Cek ID juga
                if (existingPlanIndex > -1) { 
                    updatedPlans = prevPlans.map((p, index) => index === existingPlanIndex ? { ...p, ...newPlanData } : p);
                } else {
                    updatedPlans = [...prevPlans, newPlanData];
                }
            }
            return updatedPlans.sort((a, b) => a.semester - b.semester || new Date(b.timestamp) - new Date(a.timestamp));
        });

        setTokenSisa(prev => prev - TOKEN_COST_PER_GENERATION);
        toast.success(`✅ Rencana untuk Semester ${targetSemester} berhasil di${isRegeneration ? 'perbarui' : 'buat'}!`);

        if(!isAddingSuperPlan && !isRegeneration) { // Hanya set untuk generasi awal yang sukses
             setInitialDataForSession({
                nama: nama, // Ambil dari state saat ini
                jurusan: jurusan,
                modeAction: modeAction,
                swotFileRef: response.data.initial_data_refs?.swot_file_ref || initialDataForSession?.swotFileRef, // Gunakan ref dari backend jika ada
                ikigaiFileRef: response.data.initial_data_refs?.ikigai_file_ref || initialDataForSession?.ikigaiFileRef
             });
        }

      } else {
        toast.error(response.data.error || "❌ Gagal memproses rencana.");
      }
    } catch (error) {
      console.error("Error saat generate Student Goals:", error);
      toast.error(error.response?.data?.error || "❌ Terjadi kesalahan pada server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateInitialPlan = () => {
    const semesterNum = parseInt(inputSemester, 10);
    if (!inputSemester || isNaN(semesterNum) || semesterNum < 1 || semesterNum > 14) {
      toast.warn("⚠️ Masukkan nomor semester yang valid (1-14).");
      return;
    }
    processPlanGeneration({ targetSemester: semesterNum });
  };

  const handleTambahSuperPlan = () => {
    if (generatedPlans.length === 0 && !initialDataForSession) { // Cek juga initialDataForSession
      toast.info("💡 Buat rencana awal terlebih dahulu sebelum menambah Super Plan.");
      return;
    }
    // Tentukan semester berikutnya berdasarkan plan terakhir atau input semester awal jika belum ada plan
    let nextSemester;
    if (generatedPlans.length > 0) {
        const latestPlan = generatedPlans.reduce((latest, current) => (current.semester > latest.semester ? current : latest), generatedPlans[0]);
        nextSemester = latestPlan.semester + 1;
    } else if (inputSemester && !isNaN(parseInt(inputSemester, 10))) { // Jika belum ada plan, tapi form awal sudah diisi
        nextSemester = parseInt(inputSemester, 10) + 1; // Ini skenario jika user mau tambah plan setelah isi form tapi sebelum generate
    } else {
        toast.warn("Tidak bisa menentukan semester berikutnya. Harap isi semester awal.");
        return;
    }
    
    if (nextSemester > 14) {
        toast.info("🎉 Kamu sudah mencapai batas maksimal perencanaan semester (Semester 14).");
        return;
    }
    processPlanGeneration({ targetSemester: nextSemester, isAddingSuperPlan: true });
  };

  const handleRegenerateLastPlan = () => {
    if (generatedPlans.length === 0) {
      toast.info("💡 Tidak ada rencana untuk di-regenerate.");
      return;
    }
    const latestPlan = generatedPlans.reduce((latest, current) => (current.semester > latest.semester ? current : (current.semester === latest.semester && new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest)), generatedPlans[0]);
    processPlanGeneration({ targetSemester: latestPlan.semester, isRegeneration: true, planIdToRegenerate: latestPlan.id });
  };

  if (!isPremium) {
    return (
      <div className="alert alert-warning text-center mt-4 student-goals-container">
        🚫 Fitur "Student Goals Planning" hanya untuk <strong>Pengguna Premium</strong>! Silakan upgrade akunmu. 🚀
      </div>
    );
  }

  if (isFetchingHistory) {
    return (
      <div className="student-goals-container text-center my-5">
        <ClipLoader size={50} color="#0d6efd" />
        <p className="mt-2">Memuat riwayat rencana...</p>
      </div>
    );
  }

  const isInitialFormDisabled = !!initialDataForSession;


  // --- JSX UTAMA ---
  return (
    <div className="student-goals-container card">
      <div className="card-header text-center">
        <h3>🚀 Student Goals Planning (Premium)</h3>
        <p className="text-muted mb-0">Biaya: {TOKEN_COST_PER_GENERATION} token per generasi.</p>
      </div>
      <div className="card-body">
        {/* --- Form Input Awal (Tampil jika initialDataForSession belum ada) --- */}
        {!isInitialFormDisabled && (
            <div className="initial-form-section p-3 mb-4 border rounded">
            <h5 className="mb-3">📝 Langkah 1: Isi Data Awal</h5>
            <div className="row g-3">
                <div className="col-md-4">
                <label htmlFor="sgp-nama" className="form-label">Nama Lengkap:</label>
                <input type="text" id="sgp-nama" className="form-control" value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama Kamu" />
                </div>
                <div className="col-md-4">
                <label htmlFor="sgp-jurusan" className="form-label">Jurusan:</label>
                <input type="text" id="sgp-jurusan" className="form-control" value={jurusan} onChange={(e) => setJurusan(e.target.value)} placeholder="Contoh: Ilmu Komputer" />
                </div>
                <div className="col-md-4">
                <label htmlFor="sgp-inputSemester" className="form-label">Semester Awal (Angka):</label>
                <input type="number" id="sgp-inputSemester" className="form-control" value={inputSemester} onChange={(e) => setInputSemester(e.target.value)} placeholder="Contoh: 4" min="1" max="14"/>
                </div>
            </div>

            <div className="my-3">
                <label className="form-label d-block">Mode Action (Eksekusi Misi):</label>
                <div className="form-check form-check-inline">
                <input className="form-check-input" type="radio" name="modeActionSGP" id="fastTrackSGP" value="fast" checked={modeAction === 'fast'} onChange={(e) => setModeAction(e.target.value)} />
                <label className="form-check-label" htmlFor="fastTrackSGP">Fast Track</label>
                </div>
                <div className="form-check form-check-inline">
                <input className="form-check-input" type="radio" name="modeActionSGP" id="slowTrackSGP" value="slow" checked={modeAction === 'slow'} onChange={(e) => setModeAction(e.target.value)} />
                <label className="form-check-label" htmlFor="slowTrackSGP">Slow Track</label>
                </div>
            </div>

            <div className="row g-3 mt-2">
                <div className="col-md-6">
                    <label className="form-label">Upload Hasil SWOT (PDF Wajib):</label>
                    <div className="custom-file-input-wrapper">
                        <input
                            type="file"
                            id="swotFileSGP"
                            className="custom-file-input"
                            accept=".pdf"
                            onChange={(e) => handleFileChange(e, 'swot')}
                            disabled={isLoading}
                        />
                        <label htmlFor="swotFileSGP" className="btn btn-outline-primary custom-file-label">
                            <span className="icon">📄</span> Pilih File
                        </label>
                        <span className="file-name-display ms-2">{swotFileName || "Belum ada file"}</span>
                    </div>
                </div>
                <div className="col-md-6">
                    <label className="form-label">Upload Hasil Ikigai (PDF Wajib):</label>
                    <div className="custom-file-input-wrapper">
                        <input
                            type="file"
                            id="ikigaiFileSGP"
                            className="custom-file-input"
                            accept=".pdf"
                            onChange={(e) => handleFileChange(e, 'ikigai')}
                            disabled={isLoading}
                        />
                        <label htmlFor="ikigaiFileSGP" className="btn btn-outline-primary custom-file-label">
                           <span className="icon">💡</span> Pilih File
                        </label>
                        <span className="file-name-display ms-2">{ikigaiFileName || "Belum ada file"}</span>
                    </div>
                </div>
            </div>
            <button onClick={handleGenerateInitialPlan} disabled={isLoading || !isPremium || tokenSisa < TOKEN_COST_PER_GENERATION} className="btn btn-primary w-100 mt-3">
                {isLoading ? <ClipLoader size={20} color="#fff" /> : `🎯 Buat Rencana Awal (Semester ${inputSemester || 'Target'})`}
            </button>
            </div>
        )}

        {isInitialFormDisabled && initialDataForSession && ( // Tampilkan info data terkunci jika ada
            <div className="alert alert-secondary locked-initial-data-info"> {/* Ganti ke alert-secondary atau styling lain */}
                <p className="mb-1"><strong>Data Awal Sesi Ini (Terkunci):</strong></p>
                <ul className="list-unstyled mb-0 small">
                    <li><strong>Nama:</strong> {initialDataForSession.nama}</li>
                    <li><strong>Jurusan:</strong> {initialDataForSession.jurusan}</li>
                    <li><strong>Mode:</strong> {initialDataForSession.modeAction === 'fast' ? 'Fast Track' : 'Slow Track'}</li>
                    <li><strong>SWOT:</strong> {swotFileName || (initialDataForSession.swotFileRef !== 'pending_upload' && initialDataForSession.swotFileRef ? 'File Tersimpan' : 'Belum ada file')}</li>
                    <li><strong>Ikigai:</strong> {ikigaiFileName || (initialDataForSession.ikigaiFileRef !== 'pending_upload' && initialDataForSession.ikigaiFileRef ? 'File Tersimpan' : 'Belum ada file')}</li>
                </ul>
                <small className="d-block mt-2 text-muted">Info: Data awal ini akan digunakan untuk semua rencana dalam sesi ini. Untuk mengubah, keluar dan masuk kembali ke fitur.</small>
            </div>
        )}

        {generatedPlans.length > 0 && (
          <div className="generated-plans-section mt-4">
            <h4 className="mb-3">📜 Rencana Studimu:</h4>
            {generatedPlans.map((plan, index) => (
              <div key={plan.id || `plan-${index}-${plan.semester}`} className="card mb-3 plan-card shadow-sm">
                <div className="card-header plan-card-header d-flex justify-content-between align-items-center">
                  <strong>Rencana Semester {plan.semester}</strong>
                  {/* --- TOMBOL DOWNLOAD PDF PER PLAN --- */}
                  <PDFDownloadLink
                    document={<StudentGoalsPDFDocument plan={plan} userData={initialDataForSession || {nama, jurusan}} />} // Pass userData
                    fileName={`Rencana_Semester_${plan.semester}_${(initialDataForSession?.nama || nama || 'ElevaAI').replace(/\s+/g, '_')}.pdf`}
                    className="btn btn-sm btn-outline-success"
                  >
                    {({ loading: pdfLoading }) => (pdfLoading ? 'Memuat PDF...' : '📥 Download PDF')}
                  </PDFDownloadLink>
                  {/* -------------------------------- */}
                </div>
                <div className="card-body plan-card-body">
                  <div
                    className="markdown-output"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(plan.content || 'Konten tidak tersedia.')) }}
                  />
                </div>
                <div className="card-footer text-muted small">
                  Dibuat: {plan.timestamp ? new Date(plan.timestamp).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short'}) : 'Baru saja'}
                </div>
              </div>
            ))}
          </div>
        )}

        {initialDataForSession && (
          <div className="next-steps-actions mt-4 d-flex justify-content-center flex-wrap gap-2">
            <button
              onClick={handleTambahSuperPlan}
              disabled={isLoading || !isPremium || tokenSisa < TOKEN_COST_PER_GENERATION}
              className="btn btn-success"
            >
              {isLoading ? <ClipLoader size={20} color="#fff" /> : `➕ Tambah Super Plan (Semester Berikutnya)`}
            </button>
            <button
              onClick={handleRegenerateLastPlan}
              disabled={isLoading || !isPremium || tokenSisa < TOKEN_COST_PER_GENERATION || generatedPlans.length === 0}
              className="btn btn-warning"
            >
              {isLoading ? <ClipLoader size={20} color="#fff" /> : `🔄 Regenerate Rencana Terakhir`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentGoalsPlanner;