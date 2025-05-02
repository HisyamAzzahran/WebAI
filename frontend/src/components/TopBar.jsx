import React, { useState } from 'react';
import './TopBar.css';

const TopBar = ({ email, isPremium }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="topbar-container">
      <div className="topbar-left">
        <h3 className="logo-text">🎓 ElevaAI: Bestie AI Asisten Buat Lomba Kamu</h3>
      </div>

      <div
        className="topbar-right"
        onMouseEnter={() => setIsDropdownOpen(true)}
        onMouseLeave={() => setIsDropdownOpen(false)}
      >
        <div className="user-info">
          <div className="user-email">👤 <strong>{email}</strong></div>
          <div className={`user-badge ${isPremium ? 'premium' : 'basic'}`}>
            {isPremium ? 'Premium User' : 'Basic User'}
          </div>
        </div>

        <div className="cart-wrapper">
          <button className="cart-icon">🛒</button>
          {isDropdownOpen && (
            <div className="cart-dropdown animate-fade">
              <a
                href="https://wa.me/6282211929271?text=Halo%20saya%20mau%20order%20Token%20untuk%20ElevaAI"
                target="_blank"
                rel="noreferrer"
                className="dropdown-link"
              >
                🎯 <strong>Order Token</strong>
              </a>
              <div className="divider" />
              <p className="fw-bold mb-1">Keuntungan Premium:</p>
              <ul>
                <li>✅ Akses semua sub-tema</li>
                <li>✅ Fitur KTI & Business Plan lanjutan</li>
                <li>✅ Essay Exchanges Generator</li>
              </ul>
              <a
                href="https://wa.me/6282211929271?text=Halo%20saya%20mau%20upgrade%20ke%20Premium%20ElevaAI"
                target="_blank"
                rel="noreferrer"
                className="dropdown-link"
              >
                💎 <strong>Order Premium</strong>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopBar;
