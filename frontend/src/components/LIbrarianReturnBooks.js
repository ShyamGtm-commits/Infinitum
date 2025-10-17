import React, { useState } from 'react';
import QRScanner from './QRScanner';

const LibrarianReturnBooks = () => {
    const [activeMethod, setActiveMethod] = useState('qr');
    const [manualTransactionId, setManualTransactionId] = useState('');
    const [validationData, setValidationData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Handle QR scan success
    const handleScanSuccess = async (decodedText) => {
        try {
            setLoading(true);
            setError('');
            
            // Validate the return QR
            const response = await fetch('http://localhost:8000/api/librarian/validate-return-qr/', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ qr_data: decodedText })
            });

            const data = await response.json();

            if (data.valid) {
                setValidationData(data.transaction);
            } else {
                setError(data.error || 'Invalid return QR');
                setValidationData(null);
            }
        } catch (err) {
            setError('Error validating return QR');
        } finally {
            setLoading(false);
        }
    };

    // Handle file upload for return QR
    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            setLoading(true);
            setError('');
            
            const formData = new FormData();
            formData.append('qr_image', file);
            
            const response = await fetch('http://localhost:8000/api/librarian/decode-qr-image/', {
                method: 'POST',
                credentials: 'include',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Check if it's a return QR
                if (data.decoded_text.startsWith('RETURN:')) {
                    handleScanSuccess(data.decoded_text);
                } else {
                    setError('This is a borrow QR. Please use the QR Scanner section for issuing books.');
                }
            } else {
                setError(data.error || 'Could not read QR from image');
            }
        } catch (err) {
            setError('Error processing QR image');
        } finally {
            setLoading(false);
        }
    };

    // Manual return lookup
    const handleManualLookup = async () => {
        if (!manualTransactionId) {
            setError('Please enter a transaction ID');
            return;
        }

        try {
            setLoading(true);
            setError('');
            
            // Validate transaction manually
            const response = await fetch('http://localhost:8000/api/librarian/validate-return-qr/', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ qr_data: `RETURN:${manualTransactionId}:0:0` })
            });

            const data = await response.json();

            if (data.valid) {
                setValidationData(data.transaction);
            } else {
                setError(data.error || 'Invalid transaction ID');
                setValidationData(null);
            }
        } catch (err) {
            setError('Error validating transaction');
        } finally {
            setLoading(false);
        }
    };

    // Process the return
    const handleProcessReturn = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:8000/api/librarian/process-return/', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ transaction_id: validationData.id })
            });

            const data = await response.json();

            if (response.ok) {
                alert(`✅ ${data.success}` + (data.fine_amount > 0 ? `\nFine: ₹${data.fine_amount}` : ''));
                setValidationData(null);
                setManualTransactionId('');
                setError('');
            } else {
                setError(data.error || 'Failed to process return');
            }
        } catch (err) {
            setError('Error processing return');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-4">
            <div className="card">
                <div className="card-header bg-warning text-dark">
                    <h4 className="mb-0">📚 Return Books</h4>
                </div>
                <div className="card-body">
                    {/* Enhanced Method Selection */}
                    <ul className="nav nav-pills nav-fill mb-3">
                        <li className="nav-item">
                            <button 
                                className={`nav-link ${activeMethod === 'qr' ? 'active' : ''}`}
                                onClick={() => setActiveMethod('qr')}
                            >
                                📷 Scan Return QR
                            </button>
                        </li>
                        <li className="nav-item">
                            <button 
                                className={`nav-link ${activeMethod === 'upload' ? 'active' : ''}`}
                                onClick={() => setActiveMethod('upload')}
                            >
                                📁 Upload Return QR
                            </button>
                        </li>
                        <li className="nav-item">
                            <button 
                                className={`nav-link ${activeMethod === 'manual' ? 'active' : ''}`}
                                onClick={() => setActiveMethod('manual')}
                            >
                                🔍 Manual Lookup
                            </button>
                        </li>
                    </ul>

                    {error && (
                        <div className="alert alert-danger">
                            <strong>Error:</strong> {error}
                        </div>
                    )}

                    {/* QR Scanner Method */}
                    {activeMethod === 'qr' && (
                        <QRScanner 
                            onScanSuccess={handleScanSuccess}
                            onScanError={(error) => setError(`Scan error: ${error}`)}
                        />
                    )}

                    {/* Upload Method */}
                    {activeMethod === 'upload' && (
                        <div className="text-center">
                            <div className="border rounded p-4 bg-light">
                                <i className="fas fa-cloud-upload-alt fa-3x text-primary mb-3"></i>
                                <h6>Upload Return QR Image</h6>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    className="form-control"
                                />
                                <small className="text-muted">
                                    Upload the return QR code downloaded by user
                                </small>
                                {loading && (
                                    <div className="mt-2">
                                        <div className="spinner-border spinner-border-sm" role="status">
                                            <span className="visually-hidden">Processing QR...</span>
                                        </div>
                                        <small> Processing QR image...</small>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Manual Lookup Method */}
                    {activeMethod === 'manual' && (
                        <div className="manual-return">
                            <div className="card">
                                <div className="card-body">
                                    <h5>Manual Return Lookup</h5>
                                    <div className="input-group mb-3">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Enter Transaction ID"
                                            value={manualTransactionId}
                                            onChange={(e) => setManualTransactionId(e.target.value)}
                                        />
                                        <button 
                                            className="btn btn-primary"
                                            onClick={handleManualLookup}
                                            disabled={loading}
                                        >
                                            {loading ? 'Searching...' : 'Lookup'}
                                        </button>
                                    </div>
                                    <small className="text-muted">
                                        Enter the transaction ID from the user's borrow history
                                    </small>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Return Processing (same for all methods) */}
                    {validationData && (
                        <div className="mt-3">
                            <div className="card border-warning">
                                <div className="card-header bg-warning text-dark">
                                    <h5 className="mb-0">📚 Process Book Return</h5>
                                </div>
                                <div className="card-body">
                                    <div className="row">
                                        <div className="col-md-6">
                                            <h6>User Details</h6>
                                            <p><strong>Name:</strong> {validationData.user_name}</p>
                                            <p><strong>Roll No:</strong> {validationData.user_roll}</p>
                                        </div>
                                        <div className="col-md-6">
                                            <h6>Book Details</h6>
                                            <p><strong>Title:</strong> {validationData.book_title}</p>
                                            <p><strong>Author:</strong> {validationData.book_author}</p>
                                            <p><strong>Due Date:</strong> {validationData.due_date}</p>
                                            {validationData.days_overdue > 0 && (
                                                <p className="text-danger">
                                                    <strong>Overdue:</strong> {validationData.days_overdue} days
                                                    <br/>
                                                    <strong>Fine:</strong> ₹{validationData.fine_amount}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        className="btn btn-warning btn-lg w-100"
                                        onClick={handleProcessReturn}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                Processing Return...
                                            </>
                                        ) : (
                                            '✅ Process Book Return'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LibrarianReturnBooks;