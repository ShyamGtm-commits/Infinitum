import React, { useState } from 'react';
import QRScanner from './QRScanner';

const QRBookIssue = () => {
    const [scanResult, setScanResult] = useState('');
    const [error, setError] = useState('');

    const handleScanSuccess = async (decodedText) => {
        try {
            // Extract book ID from QR code (assuming format: "BOOK:123")
            const bookId = decodedText.split(':')[1];

            const response = await fetch(`http://localhost:8000/api/books/${bookId}/borrow/`, {
                method: 'POST',
                credentials: 'include',
            });

            if (response.ok) {
                setScanResult(`Book borrowed successfully!`);
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to borrow book');
            }
        } catch (err) {
            setError('Error processing QR code');
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

                <div className="mt-3">
                    <p className="text-muted">
                        Scan a book's QR code to issue it to the current user.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default QRBookIssue;