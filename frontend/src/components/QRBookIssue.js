// QRBookIssue.js (Enhanced)
import React, { useState } from 'react';
import QRScanner from './QRScanner';

const QRBookIssue = () => {
    const [scanResult, setScanResult] = useState('');
    const [error, setError] = useState('');
    const [transactionData, setTransactionData] = useState(null);

    // In QRBookIssue.js - Update handleScanSuccess
    const handleScanSuccess = async (decodedText) => {
        try {
            // Extract transaction ID from QR code
            const transactionId = decodedText.split(':')[1];

            const response = await fetch(`http://localhost:8000/api/librarian/transactions/${transactionId}/validate/`, {
                method: 'POST',
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                if (data.valid) {
                    setTransactionData(data.transaction);
                    setScanResult(`Transaction validated. Ready to issue: ${data.transaction.book_title}`);
                } else {
                    setError(data.error || 'Invalid transaction');
                }
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to validate transaction');
            }
        } catch (err) {
            setError('Error processing QR code: ' + err.message);
        }
    };

    const handleIssueBook = async () => {
        if (!transactionData) return;

        try {
            const response = await fetch(`http://localhost:8000/api/librarian/transactions/${transactionData.id}/issue/`, {
                method: 'POST',
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                setScanResult(`Book issued successfully! Due date: ${data.due_date}`);
                setTransactionData(null);
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to issue book');
            }
        } catch (err) {
            setError('Error issuing book');
        }
    };

    const handleScanError = (err) => {
        setError(`Scanning error: ${err}`);
    };

    return (
        <div className="card">
            <div className="card-header">
                <h4>QR Code Book Issue</h4>
            </div>
            <div className="card-body">
                {error && <div className="alert alert-danger">{error}</div>}
                {scanResult && <div className="alert alert-success">{scanResult}</div>}

                <QRScanner onScanSuccess={handleScanSuccess} onScanError={handleScanError} />

                {transactionData && (
                    <div className="mt-3">
                        <div className="card">
                            <div className="card-header">
                                <h5>Transaction Details</h5>
                            </div>
                            <div className="card-body">
                                <p><strong>User:</strong> {transactionData.user_name} ({transactionData.user_roll})</p>
                                <p><strong>Book:</strong> {transactionData.book_title} by {transactionData.book_author}</p>
                                <p><strong>Due Date:</strong> {transactionData.due_date}</p>
                                <button
                                    className="btn btn-success"
                                    onClick={handleIssueBook}
                                >
                                    Confirm Issue
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-3">
                    <p className="text-muted">
                        Scan a borrow transaction QR code to issue the book.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default QRBookIssue;