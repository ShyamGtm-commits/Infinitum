// ActiveBorrows.js - ENHANCED VERSION WITH QR MODAL
import React, { useState, useEffect } from 'react';

const ActiveBorrows = ({ user }) => {
    const [activeBorrows, setActiveBorrows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [generatingQR, setGeneratingQR] = useState(null);
    const [showQRModal, setShowQRModal] = useState(false);
    const [returnQRData, setReturnQRData] = useState(null);

    useEffect(() => {
        fetchActiveBorrows();
    }, []);

    const fetchActiveBorrows = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/user/active-borrows/', {
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                setActiveBorrows(data);
            } else {
                setError('Failed to load your active borrows');
            }
        } catch (error) {
            console.error('Error fetching active borrows:', error);
            setError('Error loading your borrows');
        } finally {
            setLoading(false);
        }
    };

    const showReturnQRModal = (qrData) => {
        setReturnQRData(qrData);
        setShowQRModal(true);
    };

    const generateReturnQR = async (transactionId, bookTitle, dueDate) => {
        setGeneratingQR(transactionId);
        try {
            const response = await fetch(`http://localhost:8000/api/books/return/${transactionId}/generate-qr/`, {
                method: 'POST',
                credentials: 'include',
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Show return QR in modal
                showReturnQRModal({
                    qr_data: data.qr_data,
                    book_title: bookTitle,
                    due_date: dueDate,
                    transaction_id: transactionId
                });
            } else {
                alert(data.error || 'Failed to generate return QR');
            }
        } catch (error) {
            console.error('Error generating return QR:', error);
            alert('Error generating return QR. Please try again.');
        } finally {
            setGeneratingQR(null);
        }
    };

    if (loading) return <div className="text-center mt-4">Loading your active borrows...</div>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    return (
        <div>
            <h2>📚 Your Active Borrows</h2>
            
            {activeBorrows.length === 0 ? (
                <div className="alert alert-info">
                    You don't have any active book borrows.
                </div>
            ) : (
                <div className="row">
                    {activeBorrows.map(transaction => (
                        <div key={transaction.id} className="col-md-6 mb-3">
                            <div className={`card ${transaction.status === 'pending' ? 'border-warning' : 'border-success'}`}>
                                <div className="card-body">
                                    <h5 className="card-title">{transaction.book.title}</h5>
                                    <p className="card-text">
                                        <strong>Author:</strong> {transaction.book.author}<br/>
                                        <strong>Status:</strong> 
                                        <span className={`badge ${transaction.status === 'pending' ? 'bg-warning' : 'bg-success'}`}>
                                            {transaction.status === 'pending' ? '🕒 Awaiting Pickup' : '✅ Issued'}
                                        </span><br/>
                                        <strong>Due Date:</strong> {new Date(transaction.due_date).toLocaleDateString()}<br/>
                                        {transaction.issued_at && (
                                            <><strong>Issued On:</strong> {new Date(transaction.issued_at).toLocaleDateString()}</>
                                        )}
                                    </p>
                                    
                                    {transaction.status === 'pending' && (
                                        <div className="alert alert-warning">
                                            <small>
                                                <i className="fas fa-info-circle"></i> 
                                                Take your QR code to library for pickup
                                            </small>
                                        </div>
                                    )}
                                    
                                    {transaction.status === 'borrowed' && (
                                        <div className="alert alert-success">
                                            <small>
                                                <i className="fas fa-check-circle"></i> 
                                                Book issued on {new Date(transaction.issued_at).toLocaleDateString()}
                                            </small>
                                        </div>
                                    )}
                                    
                                    {/* Generate Return QR Button */}
                                    {transaction.status === 'borrowed' && (
                                        <div className="mt-2">
                                            <button
                                                className="btn btn-warning btn-sm"
                                                onClick={() => generateReturnQR(
                                                    transaction.id, 
                                                    transaction.book.title,
                                                    new Date(transaction.due_date).toLocaleDateString()
                                                )}
                                                disabled={generatingQR === transaction.id}
                                            >
                                                {generatingQR === transaction.id ? (
                                                    <>
                                                        <div className="spinner-border spinner-border-sm me-2" role="status">
                                                            <span className="visually-hidden">Loading...</span>
                                                        </div>
                                                        Generating QR...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="fas fa-qrcode me-2"></i>
                                                        Generate Return QR
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                    
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {/* Return QR Modal */}
            {showQRModal && returnQRData && (
                <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header bg-warning text-dark">
                                <h5 className="modal-title">
                                    <i className="fas fa-qrcode me-2"></i>
                                    Return QR Code
                                </h5>
                                <button 
                                    type="button" 
                                    className="btn-close"
                                    onClick={() => setShowQRModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body text-center">
                                <h6 className="text-primary">{returnQRData.book_title}</h6>
                                <p className="text-muted">
                                    <strong>Due Date:</strong> {returnQRData.due_date}
                                </p>
                                
                                {/* QR Code Display */}
                                <img 
                                    src={`data:image/png;base64,${returnQRData.qr_data}`} 
                                    alt="Return QR Code"
                                    className="img-fluid mb-3"
                                    style={{ 
                                        maxWidth: '250px', 
                                        border: '2px solid #dee2e6', 
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                                    }}
                                />
                                
                                <div className="alert alert-info">
                                    <small>
                                        <strong>📋 Instructions:</strong><br/>
                                        1. Show this QR to librarian<br/>
                                        2. Librarian will scan it to process return<br/>
                                        3. You'll get return confirmation
                                    </small>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button 
                                    className="btn btn-success"
                                    onClick={() => {
                                        // Download QR
                                        const link = document.createElement('a');
                                        link.href = `data:image/png;base64,${returnQRData.qr_data}`;
                                        link.download = `return_qr_${returnQRData.transaction_id}.png`;
                                        link.click();
                                    }}
                                >
                                    <i className="fas fa-download me-2"></i>
                                    Download QR
                                </button>
                                <button 
                                    className="btn btn-secondary"
                                    onClick={() => setShowQRModal(false)}
                                >
                                    <i className="fas fa-times me-2"></i>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActiveBorrows;