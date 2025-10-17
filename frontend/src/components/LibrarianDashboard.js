// LibrarianDashboard.js - CLEAN VERSION
import React, { useState } from 'react';
import UnifiedScanner from './UnifiedScanner';
import LibrarianIssuedBooks from './LibrarianIssuedBooks';

const LibrarianDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('scan'); // Start with scanner

  return (
    <div>
      <h2>Librarian Dashboard</h2>

      {/* Only 2 Tabs Needed Now */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'scan' ? 'active' : ''}`}
            onClick={() => setActiveTab('scan')}
          >
            <i className="fas fa-qrcode me-2"></i>Scan QR
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <i className="fas fa-clipboard-list me-2"></i>Issued Books
          </button>
        </li>
      </ul>

      {/* Only 2 Components Needed Now */}
      {activeTab === 'scan' && <UnifiedScanner />}
      {activeTab === 'history' && <LibrarianIssuedBooks />}
    </div>
  );
};

export default LibrarianDashboard;