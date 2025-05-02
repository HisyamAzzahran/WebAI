import React, { useState } from 'react';
import './TopBar.css';

const TopBar = ({ email, isPremium }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="topbar-container">
      <div className="logo-title">
        <h3 className="fw-bold text-primary m-0">🎓 ElevaAI: Bestie AI Asisten Buat Lomba Kamu</h3>
      </div>

      <div
        className="d-flex align-items-center gap-3 mt-2 mt-md-0"
        onMouseLeave={() => setIsDropdownOpen(false)}
      >
        <div className="user-info text-end">
          <div><strong>👤 {email}</strong></div>
          <div className={`badge ${isPremium ? 'bg-success' : 'bg-secondary'}`}>
            {isPremium ? 'Premium User' : 'Basic User'}
          </div>
        </div>

        <div
          className="cart-icon"
          onMouseEnter={() => setIsDropdownOpen(true)}
        >
          🛒
          {isDropdownOpen && (
            <div className="dropdown-content">
              <a
                href="https://wa.me/6282211929271?text=Halo%20saya%20mau%20order%20Token%20untuk%20ElevaAI"
                target="_blank"
                rel="noreferrer"
              >
                🎯 Order Token
              </a>
              <div className="divider" />
              <p><strong>Keuntungan Premium:</strong></p>
              <ul>
                <li>✅ Akses semua sub-tema</li>
                <li>✅ Fitur KTI & Business Plan lanjutan</li>
                <li>✅ Essay Exchanges Generator</li>
              </ul>
              <a
                href="https://wa.me/6282211929271?text=Halo%20saya%20mau%20upgrade%20ke%20Premium%20ElevaAI"
                target="_blank"
                rel="noreferrer"
              >
                💎 Order Premium
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopBar;
