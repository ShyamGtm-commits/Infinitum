// UnifiedScanner.js
import React, { useState } from 'react';
import QRScanner from './QRScanner';

const UnifiedScanner = () => {
    const [scanResult, setScanResult] = useState('');
    const [actionData, setActionData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [actionType, setActionType] = useState(''); // 'borrow' or 'return'

    const handleScanSuccess = async (decodedText) => {
        try {
            setLoading(true);
            setError('');
            setScanResult(decodedText);
            setActionData(null);

            // Determine action type from QR content
            if (decodedText.startsWith('BORROW:')) {
                setActionType('borrow');
                await validateBorrowQR(decodedText);
            } else if (decodedText.startsWith('RETURN:')) {
                setActionType('return');
                await validateReturnQR(decodedText);
            } else {
                setError('Unknown QR format. Not a library QR code.');
            }
        } catch (err) {
            setError('Error processing QR code');
        } finally {
            setLoading(false);
        }
    };

    const validateBorrowQR = async (qrData) => {
        const response = await fetch('http://localhost:8000/api/librarian/validate-qr/', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ qr_data: qrData })
        });
        const data = await response.json();

        if (data.valid) {
            setActionData(data.transaction);
        } else {
            setError(data.error || 'Invalid borrow QR');
        }
    };

    const validateReturnQR = async (qrData) => {
        const response = await fetch('http://localhost:8000/api/librarian/validate-return-qr/', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ qr_data: qrData })
        });
        const data = await response.json();

        if (data.valid) {
            setActionData(data.transaction);
        } else {
            setError(data.error || 'Invalid return QR');
        }
    };

    const handleProcessAction = async () => {
        try {
            setLoading(true);
            let response, successMessage;

            if (actionType === 'borrow') {
                response = await fetch('http://localhost:8000/api/librarian/issue-book/', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ transaction_id: actionData.id })
                });
                successMessage = 'Book issued successfully!';
            } else {
                // CHANGED ENDPOINT
                response = await fetch('http://localhost:8000/api/librarian/process-book-return/', {  // ← UPDATED
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ transaction_id: actionData.id })
                });
                successMessage = 'Book returned successfully!';
            }

            const data = await response.json();

            if (response.ok) {
                alert(`✅ ${successMessage}`);
                setActionData(null);
                setScanResult('');
                setActionType('');
            } else {
                setError(data.error || `Failed to process ${actionType}`);
            }
        } catch (err) {
            setError(`Error processing ${actionType}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-4">
            <div className="card">
                <div className="card-header bg-primary text-white">
                    <h4 className="mb-0">📱 Library QR Scanner</h4>
                    <small>Scan any library QR code - automatic detection</small>
                </div>
                <div className="card-body">
                    {error && <div className="alert alert-danger">{error}</div>}

                    <QRScanner
                        onScanSuccess={handleScanSuccess}
                        onScanError={(error) => !error.includes('NotFoundException') && setError(`Scan error: ${error}`)}
                    />

                    {/* Action Display */}
                    {actionData && (
                        <div className="mt-3">
                            <div className={`card ${actionType === 'borrow' ? 'border-success' : 'border-warning'}`}>
                                <div className={`card-header ${actionType === 'borrow' ? 'bg-success' : 'bg-warning'} text-white`}>
                                    <h5 className="mb-0">
                                        {actionType === 'borrow' ? '📚 Issue Book' : '📖 Return Book'}
                                    </h5>
                                </div>
                                <div className="card-body">
                                    <div className="row">
                                        <div className="col-md-6">
                                            <h6>User Details</h6>
                                            <p><strong>Name:</strong> {actionData.user_name}</p>
                                            <p><strong>Roll No:</strong> {actionData.user_roll}</p>
                                        </div>
                                        <div className="col-md-6">
                                            <h6>Book Details</h6>
                                            <p><strong>Title:</strong> {actionData.book_title}</p>
                                            <p><strong>Author:</strong> {actionData.book_author}</p>
                                            <p><strong>Due Date:</strong> {actionData.due_date}</p>
                                            {actionType === 'return' && actionData.days_overdue > 0 && (
                                                <p className="text-danger">
                                                    <strong>Overdue:</strong> {actionData.days_overdue} days
                                                    <br />
                                                    <strong>Fine:</strong> ₹{actionData.fine_amount}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        className={`btn ${actionType === 'borrow' ? 'btn-success' : 'btn-warning'} btn-lg w-100`}
                                        onClick={handleProcessAction}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                Processing...
                                            </>
                                        ) : (
                                            `✅ ${actionType === 'borrow' ? 'Issue Book to User' : 'Process Book Return'}`
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Instructions */}
                    <div className="mt-3">
                        <h6>📋 Universal Scanner - Accepts:</h6>
                        <ul>
                            <li>📚 <strong>Borrow QRs</strong> - For issuing books to users</li>
                            <li>📖 <strong>Return QRs</strong> - For processing book returns</li>
                        </ul>
                        <small className="text-muted">
                            Just scan any library QR code - system automatically detects the action type
                        </small>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UnifiedScanner;