import React from 'react';
import './TopBar.css';

const TopBar = ({ email, isPremium }) => {
  return (
    <div className="topbar-container sticky-top bg-white shadow-sm py-2 px-3">
      <div className="d-flex justify-content-between align-items-center flex-wrap">
        {/* Logo */}
        <div className="logo-title">
          <h3 className="fw-bold text-primary m-0">🎓 ElevaAI</h3>
        </div>

        {/* Info Akun dan Dropdown */}
        <div className="d-flex align-items-center gap-3 mt-2 mt-md-0">
          <div className="user-info text-end">
            <div><strong>👤 {email}</strong></div>
            <div className={`badge ${isPremium ? 'bg-success' : 'bg-secondary'}`}>
              {isPremium ? 'Premium User' : 'Basic User'}
            </div>
          </div>

          {/* Cart Dropdown */}
          <div className="dropdown">
            <button className="btn btn-outline-dark dropdown-toggle" type="button" data-bs-toggle="dropdown">
              🛒
            </button>
            <div className="dropdown-menu dropdown-menu-end p-3 shadow">
              <a
                href="https://wa.me/6282211929271?text=Halo%20saya%20mau%20order%20Token%20untuk%20ElevaAI"
                target="_blank"
                rel="noreferrer"
                className="dropdown-item"
              >
                🎯 Order Token
              </a>
              <div className="dropdown-divider" />
              <p className="fw-bold mb-1">Keuntungan Premium:</p>
              <ul className="small mb-2">
                <li>✅ Akses semua sub-tema</li>
                <li>✅ Fitur KTI & Business Plan lanjutan</li>
                <li>✅ Essay Exchanges Generator</li>
              </ul>
              <a
                href="https://wa.me/6282211929271?text=Halo%20saya%20mau%20upgrade%20ke%20Premium%20ElevaAI"
                target="_blank"
                rel="noreferrer"
                className="btn btn-success btn-sm w-100"
              >
                💎 Order Premium
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
