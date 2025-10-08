// UserQRStatus.js
import React, { useState, useEffect } from 'react';

const UserQRStatus = ({ user }) => {
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingTransactions();
  }, []);

  const fetchPendingTransactions = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/user/pending-transactions/', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setPendingTransactions(data);
      }
    } catch (error) {
      console.error('Error fetching pending transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="card">
      <div className="card-header">
        <h5>Your Pending Book Reservations</h5>
      </div>
      <div className="card-body">
        {pendingTransactions.length === 0 ? (
          <p className="text-muted">You have no pending book reservations.</p>
        ) : (
          pendingTransactions.map(transaction => (
            <div key={transaction.id} className={`alert ${transaction.is_expired ? 'alert-warning' : 'alert-info'} mb-2`}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="alert-heading">{transaction.book_title}</h6>
                  <p className="mb-0">by {transaction.book_author}</p>
                  <small>
                    {transaction.is_expired ? (
                      <span className="text-danger">❌ EXPIRED - Please generate a new QR code</span>
                    ) : (
                      <span>⏳ Expires in {transaction.hours_remaining} hours</span>
                    )}
                  </small>
                </div>
                {!transaction.is_expired && transaction.qr_code_url && (
                  <a 
                    href={transaction.qr_code_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-outline-primary"
                  >
                    View QR Code
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UserQRStatus;