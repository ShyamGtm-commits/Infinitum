// QRBookReturn.js
import React, { useState } from 'react';
import QRScanner from './QRScanner';

const QRBookReturn = () => {
    const [scanResult, setScanResult] = useState('');
    const [error, setError] = useState('');
    const [bookData, setBookData] = useState(null);

    const handleScanSuccess = async (decodedText) => {
        try {
            // Extract book ID from QR code (assuming format: "BOOK:BOOK_ID")
            const bookId = decodedText.split(':')[1];

            const response = await fetch(`http://localhost:8000/api/librarian/books/${bookId}/borrow_info/`, {
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                if (data.borrowed) {
                    setBookData(data);
                    setScanResult(`Book found. Currently borrowed by ${data.user_name}`);
                } else {
                    setError('This book is not currently borrowed');
                }
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to get book information');
            }
        } catch (err) {
            setError('Error processing QR code');
        }
    };

    const handleReturnBook = async () => {
        if (!bookData) return;

        try {
            const response = await fetch(`http://localhost:8000/api/librarian/transactions/${bookData.transaction_id}/return/`, {
                method: 'POST',
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                setScanResult(`Book returned successfully! Fine: ₹${data.fine_amount}`);
                setBookData(null);
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to return book');
            }
        } catch (err) {
            setError('Error returning book');
        }
    };

    const handleScanError = (err) => {
        setError(`Scanning error: ${err}`);
    };

    return (
        <div className="card">
            <div className="card-header">
                <h4>QR Code Book Return</h4>
            </div>
            <div className="card-body">
                {error && <div className="alert alert-danger">{error}</div>}
                {scanResult && <div className="alert alert-success">{scanResult}</div>}

                <QRScanner onScanSuccess={handleScanSuccess} onScanError={handleScanError} />

                {bookData && (
                    <div className="mt-3">
                        <div className="card">
                            <div className="card-header">
                                <h5>Book Details</h5>
                            </div>
                            <div className="card-body">
                                <p><strong>Book:</strong> {bookData.book_title} by {bookData.book_author}</p>
                                <p><strong>Borrowed by:</strong> {bookData.user_name} ({bookData.user_roll})</p>
                                <p><strong>Issue Date:</strong> {bookData.issue_date}</p>
                                <p><strong>Due Date:</strong> {bookData.due_date}</p>
                                <button 
                                    className="btn btn-success"
                                    onClick={handleReturnBook}
                                >
                                    Confirm Return
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-3">
                    <p className="text-muted">
                        Scan a book's QR code to process its return.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default QRBookReturn;