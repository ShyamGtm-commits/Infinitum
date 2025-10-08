// LibrarianDashboard.js
import React, { useState } from 'react';
import QRBookIssue from './QRBookIssue';
import QRBookReturn from './QRBookReturn';

const LibrarianDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('issue');

  return (
    <div>
      <h2>Librarian Dashboard</h2>

      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'issue' ? 'active' : ''}`}
            onClick={() => setActiveTab('issue')}
          >
            <i className="fas fa-qrcode me-2"></i>Issue Books (QR)
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'return' ? 'active' : ''}`}
            onClick={() => setActiveTab('return')}
          >
            <i className="fas fa-undo me-2"></i>Return Books (QR)
          </button>
        </li>
      </ul>

      {activeTab === 'issue' && (
  <div className="card">
    <div className="card-body">
      <h5>QR Book Issue Feature</h5>
      <p>This feature is coming soon...</p>
    </div>
  </div>
)}
{activeTab === 'return' && (
  <div className="card">
    <div className="card-body">
      <h5>QR Book Return Feature</h5>
      <p>This feature is coming soon...</p>
    </div>
  </div>
)}
    </div>
  );
};

export default LibrarianDashboard;