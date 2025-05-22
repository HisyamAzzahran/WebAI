import React, { useState } from 'react';
import './TopBar.css'; // Kita akan membuat file CSS ini
import Modal from './Modal'; // Asumsi komponen Modal ini sudah ada dan berfungsi

// Mendefinisikan link WhatsApp sebagai konstanta
const WHATSAPP_LINK_ADMIN = "https://wa.me/6282211929271";

const TopBar = ({ email, isPremium, onLogout }) => { // Menambahkan prop onLogout
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  return (
    <>
      <div className="topbar-container">
        <div className="logo-text">🎓 ElevaAI</div>

        <div className="topbar-nav-items">
          {/* Tombol Beli Token dan Jadi Premium */}
          <button className="topbar-action-btn token-btn" onClick={() => setShowTokenModal(true)}>
            🎯 Beli Token
          </button>
          {/* Hanya tampilkan tombol Jadi Premium jika pengguna belum premium */}
          {!isPremium && (
            <button className="topbar-action-btn premium-btn" onClick={() => setShowPremiumModal(true)}>
              💎 Jadi Premium
            </button>
          )}
        </div>

        <div className="topbar-right">
          <div className="user-info">
            <span className="user-email">👤 {email}</span>
            <span className={`user-status-badge ${isPremium ? 'premium' : 'basic'}`}>
              {isPremium ? 'Premium' : 'Basic'}
            </span>
          </div>
          {/* Tombol Logout hanya muncul jika fungsi onLogout disediakan */}
          {onLogout && (
            <button onClick={onLogout} className="logout-btn" title="Keluar dari akun Anda">
              Logout
            </button>
          )}
        </div>
      </div>

      {/* Modal untuk Beli Token */}
      {showTokenModal && (
        <Modal onClose={() => setShowTokenModal(false)}>
          <div className="modal-header">
            <h5>🎯 Beli Token ElevaAI</h5>
          </div>
          <div className="modal-body">
            <p>Dapatkan lebih banyak token untuk terus menggunakan fitur-fitur canggih ElevaAI!</p>
            <p>Silakan hubungi Admin untuk melakukan pembelian token dan dapatkan penawaran spesial.</p>
          </div>
          <div className="modal-footer">
            <a href={WHATSAPP_LINK_ADMIN} target="_blank" rel="noopener noreferrer" className="btn-modal btn-modal-green">
              Chat Admin (WhatsApp)
            </a>
            <button className="btn-modal btn-modal-secondary" onClick={() => setShowTokenModal(false)}>Tutup</button>
          </div>
        </Modal>
      )}

      {/* Modal untuk Upgrade Premium */}
      {showPremiumModal && (
        <Modal onClose={() => setShowPremiumModal(false)}>
          <div className="modal-header">
            <h5>💎 Upgrade ke Akun Premium</h5>
          </div>
          <div className="modal-body">
            <p>Nikmati semua keunggulan ElevaAI dengan akun Premium:</p>
            <ul className="feature-list">
              <li>Akses semua fitur dan sub-tema tanpa batas.</li>
              <li>Dukungan prioritas dari tim kami.</li>
              <li>KTI & Business Plan Generator tingkat lanjut.</li>
              <li>Essay Exchanges Generator eksklusif.</li>
              <li>Analisis dan penjelasan judul yang lebih mendalam.</li>
              <li>Dan banyak lagi keuntungan lainnya!</li>
            </ul>
            <p>Jangan lewatkan kesempatan untuk memaksimalkan potensi Anda bersama ElevaAI!</p>
          </div>
          <div className="modal-footer">
            <a href={WHATSAPP_LINK_ADMIN} target="_blank" rel="noopener noreferrer" className="btn-modal btn-modal-blue">
              Upgrade via WhatsApp
            </a>
            <button className="btn-modal btn-modal-secondary" onClick={() => setShowPremiumModal(false)}>Nanti Saja</button>
          </div>
        </Modal>
      )}
    </>
  );
};

export default TopBar;