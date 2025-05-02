import React, { useState } from 'react';
import './TopBar.css';
import Modal from './Modal'; // Komponen Modal buatan sendiri

const TopBar = ({ email, isPremium }) => {
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  return (
    <>
      <div className="topbar-container">
        <div className="logo-text">🎓 ElevaAI</div>

        <div className="topbar-right">
          <div className="user-info">
            <strong>👤 {email}</strong><br />
            <span className={`badge ${isPremium ? 'bg-success' : 'bg-secondary'}`}>
              {isPremium ? 'Premium User' : 'Basic User'}
            </span>
          </div>

          <div className="cart-dropdown-box">
            <div className="card-option" onClick={() => setShowTokenModal(true)}>🎯 Beli Token</div>
            <div className="card-option" onClick={() => setShowPremiumModal(true)}>💎 Premium</div>
          </div>
        </div>
      </div>

      {/* Modal Token */}
      {showTokenModal && (
        <Modal onClose={() => setShowTokenModal(false)}>
          <h5>🎯 Beli Token ElevaAI</h5>
          <p>Hubungi Admin untuk melakukan pembelian token.</p>
          <a href="https://wa.me/6282211929271" target="_blank" rel="noreferrer" className="btn-modal-green">
            Chat Admin di WhatsApp
          </a>
        </Modal>
      )}

      {/* Modal Premium */}
      {showPremiumModal && (
        <Modal onClose={() => setShowPremiumModal(false)}>
          <h5>💎 Upgrade ke Premium</h5>
          <ul className="feature-list">
            <li>✅ Akses semua sub-tema</li>
            <li>✅ KTI & Business Plan Lanjutan</li>
            <li>✅ Essay Exchanges Generator</li>
            <li>✅ Penjelasan Judul Premium</li>
          </ul>
          <a href="https://wa.me/6282211929271" target="_blank" rel="noreferrer" className="btn-modal-blue">
            Upgrade Premium di WhatsApp
          </a>
        </Modal>
      )}
    </>
  );
};

export default TopBar;
