import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ConfirmationModal from './ConfirmationModal';
import ErrorModal from './ErrorModal';
import StarRating from './StarRating';  // Add this import
import BookReviews from './BookReviews'; // Add this import

const BookDetail = ({ user }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [hasBorrowed, setHasBorrowed] = useState(false);

    // Modal states
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [confirmBorrow, setConfirmBorrow] = useState(null);

    // QR states
    const [existingQRInfo, setExistingQRInfo] = useState(null);
    const [qrLoading, setQrLoading] = useState(false);

    // Rating states
    const [userRating, setUserRating] = useState(0);
    const [averageRating, setAverageRating] = useState(0);
    const [ratingCount, setRatingCount] = useState(0);
    const [ratingLoading, setRatingLoading] = useState(false);

    useEffect(() => {
        fetchBookDetails();
        checkIfBorrowed();
        fetchMyQR();
    }, [id]);

    const fetchBookDetails = async () => {
        try {
            const response = await fetch(`http://localhost:8000/api/books/${id}/`, {
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                setBook(data);
                setAverageRating(data.average_rating || 0);
                setRatingCount(data.rating_count || 0);
                setUserRating(data.user_rating || 0);
            } else {
                setError('Book not found');
            }
        } catch (error) {
            setError('Error loading book details');
        } finally {
            setLoading(false);
        }
    };

    const checkIfBorrowed = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/user/transactions/', {
                credentials: 'include',
            });

            if (response.ok) {
                const transactions = await response.json();
                const borrowed = transactions.some(t =>
                    t.book.id === parseInt(id) && t.return_date === null
                );
                setHasBorrowed(borrowed);
            }
        } catch (error) {
            console.error('Error checking borrow status:', error);
        }
    };

    const fetchMyQR = async () => {
        setQrLoading(true);
        try {
            const response = await fetch(`http://localhost:8000/api/books/${id}/get_my_qr/`, {
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setExistingQRInfo(data);
                }
            }
        } catch (error) {
            console.error('Error fetching QR:', error);
        } finally {
            setQrLoading(false);
        }
    };

    // NEW: Handle rating submission
    const handleRatingChange = async (newRating) => {
        if (!user) {
            setErrorMessage('Please login to rate books');
            setShowErrorModal(true);
            return;
        }

        setRatingLoading(true);
        try {
            const response = await fetch(`http://localhost:8000/api/books/${id}/rate/`, {
                method: userRating ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ rating: newRating }),
            });

            const data = await response.json();

            if (response.ok) {
                setUserRating(newRating);
                // Refresh book details to get updated average
                fetchBookDetails();
            } else {
                setErrorMessage(data.error || 'Failed to submit rating');
                setShowErrorModal(true);
            }
        } catch (error) {
            setErrorMessage('Error submitting rating');
            setShowErrorModal(true);
        } finally {
            setRatingLoading(false);
        }
    };

    // NEW: Handle rating deletion
    const handleDeleteRating = async () => {
        setRatingLoading(true);
        try {
            const response = await fetch(`http://localhost:8000/api/books/${id}/rate/`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (response.ok) {
                setUserRating(0);
                fetchBookDetails(); // Refresh to update averages
            }
        } catch (error) {
            setErrorMessage('Error deleting rating');
            setShowErrorModal(true);
        } finally {
            setRatingLoading(false);
        }
    };

    // Your existing borrow functions remain the same...
    const handleBorrow = async () => {
        try {
            const response = await fetch(`http://localhost:8000/api/books/${id}/borrow/`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (data.requires_confirmation) {
                setConfirmBorrow({
                    message: data.message,
                    bookDetails: data.book_details
                });
                setShowConfirmation(true);
            } else if (data.error) {
                if (data.error.includes('already have a pending QR')) {
                    fetchMyQR();
                } else {
                    setErrorMessage(data.error);
                    setShowErrorModal(true);
                }
            } else if (data.success) {
                alert('Book borrowed successfully!');
                setHasBorrowed(true);
                fetchBookDetails();
            }
        } catch (error) {
            setErrorMessage('Error borrowing book. Please try again.');
            setShowErrorModal(true);
        }
    };

    const handleConfirmBorrow = async () => {
        try {
            const response = await fetch(`http://localhost:8000/api/books/${id}/borrow/`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ confirmation: true })
            });

            const data = await response.json();

            if (data.success) {
                alert('Book borrowed successfully!');
                setHasBorrowed(true);
                setShowConfirmation(false);
                fetchBookDetails();
            } else if (data.error) {
                setErrorMessage(data.error);
                setShowErrorModal(true);
            }
        } catch (error) {
            setErrorMessage('Error confirming borrow. Please try again.');
            setShowErrorModal(true);
        }
    };

    const handleGenerateQR = async () => {
        try {
            setQrLoading(true);
            const response = await fetch(`http://localhost:8000/api/books/${id}/generate_borrow_qr/`, {
                method: 'POST',
                credentials: 'include',
            });

            const data = await response.json();

            if (response.ok) {
                setExistingQRInfo({
                    qr_url: data.qr_code_url,
                    generated_at: data.expiry_time,
                    expires_at: data.expiry_time,
                    hours_remaining: data.hours_remaining
                });
            } else if (data.error && data.has_existing) {
                fetchMyQR();
            } else {
                setErrorMessage(data.error || 'Failed to generate QR code');
                setShowErrorModal(true);
            }
        } catch (error) {
            console.error('QR Generation error:', error);
            setErrorMessage('Error generating QR code');
            setShowErrorModal(true);
        } finally {
            setQrLoading(false);
        }
    };

    if (loading) return <div className="text-center mt-4">Loading book details...</div>;
    if (error) return <div className="alert alert-danger">{error}</div>;
    if (!book) return <div className="alert alert-warning">Book not found</div>;

    return (
        <div className="container mt-4">
            <button className="btn btn-outline-secondary mb-3" onClick={() => navigate(-1)}>
                ← Back to Books
            </button>

            <div className="row">
                {/* Book Cover Column */}
                <div className="col-md-4">
                    <div className="book-cover-detail">
                        {book.cover_image_url ? (
                            <img
                                src={`http://localhost:8000${book.cover_image_url}`}
                                alt={book.title}
                                className="img-fluid rounded shadow"
                                style={{ maxHeight: '400px', width: '100%', objectFit: 'contain' }}
                            />
                        ) : (
                            <div className="book-placeholder-detail text-center py-5">
                                <i className="fas fa-book fa-5x text-muted"></i>
                            </div>
                        )}
                    </div>
                </div>

                {/* Book Details Column */}
                <div className="col-md-8">
                    <div className="book-details">
                        <h1 className="book-title-detail">{book.title}</h1>
                        <h4 className="book-author-detail text-muted">by {book.author}</h4>

                        {/* NEW: Rating Section */}
                        <div className="rating-section mb-3">
                            <div className="d-flex align-items-center mb-2">
                                <StarRating 
                                    rating={averageRating} 
                                    editable={false}
                                    size="lg"
                                />
                                <span className="ms-2 text-muted">
                                    ({averageRating > 0 ? averageRating.toFixed(1) : 'No'} rating{ratingCount !== 1 ? 's' : ''})
                                </span>
                            </div>
                            
                            {user && (
                                <div className="user-rating-section">
                                    <p className="mb-1">
                                        <strong>Your Rating:</strong>
                                    </p>
                                    <div className="d-flex align-items-center">
                                        <StarRating 
                                            rating={userRating} 
                                            onRatingChange={handleRatingChange}
                                            editable={!ratingLoading}
                                            size="md"
                                        />
                                        {userRating > 0 && (
                                            <button
                                                className="btn btn-sm btn-outline-danger ms-2"
                                                onClick={handleDeleteRating}
                                                disabled={ratingLoading}
                                                title="Remove your rating"
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        )}
                                        {ratingLoading && (
                                            <div className="spinner-border spinner-border-sm ms-2" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="book-metadata mb-3">
                            <span className="badge bg-info me-2">{book.genre}</span>
                            {book.publication_year && (
                                <span className="badge bg-secondary me-2">{book.publication_year}</span>
                            )}
                            {book.isbn && (
                                <small className="text-muted">ISBN: {book.isbn}</small>
                            )}
                        </div>

                        <div className="availability-status mb-3">
                            <strong>Availability: </strong>
                            <span className={hasBorrowed ? 'text-success' : book.available_copies === 0 ? 'text-danger' : 'text-primary'}>
                                {hasBorrowed ? 'Already Borrowed' :
                                    book.available_copies === 0 ? 'Out of Stock' :
                                        `${book.available_copies} of ${book.total_copies} available`}
                            </span>
                        </div>

                        {book.description && (
                            <div className="book-description mb-4">
                                <h5>Description</h5>
                                <p className="text-muted">{book.description}</p>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="action-buttons">
                            <div className="d-grid gap-2 d-md-block">
                                <button
                                    className={`btn ${hasBorrowed ? 'btn-success' : 'btn-primary'} me-2 mb-2`}
                                    onClick={handleBorrow}
                                    disabled={book.available_copies === 0 || hasBorrowed}
                                    style={{ minWidth: '120px' }}
                                >
                                    {hasBorrowed ? '✓ Borrowed' :
                                        book.available_copies === 0 ? 'Out of Stock' : 'Borrow Digitally'}
                                </button>
                            </div>

                            {/* QR Code Section */}
                            <div className="qr-section mt-3 p-3 border rounded">
                                <h6 className="mb-2">📋 Library Pickup</h6>

                                {qrLoading ? (
                                    <div className="text-center">
                                        <div className="spinner-border spinner-border-sm" role="status">
                                            <span className="visually-hidden">Loading QR info...</span>
                                        </div>
                                    </div>
                                ) : existingQRInfo ? (
                                    <div className="existing-qr">
                                        <p className="mb-1">
                                            <small>Generated: {new Date(existingQRInfo.generated_at).toLocaleString()}</small>
                                        </p>
                                        <p className="mb-2">
                                            <small>Expires: {new Date(existingQRInfo.expires_at).toLocaleString()}</small>
                                        </p>
                                        <button
                                            className="btn btn-success btn-sm"
                                            onClick={() => window.open(existingQRInfo.qr_url, '_blank')}
                                        >
                                            <i className="fas fa-eye me-1"></i> View My QR Code
                                        </button>
                                    </div>
                                ) : book.available_copies === 0 ? (
                                    <div className="text-center text-muted">
                                        <small>No copies available for QR generation</small>
                                    </div>
                                ) : (
                                    <div>
                                        <button
                                            className="btn btn-outline-primary btn-sm"
                                            onClick={handleGenerateQR}
                                            disabled={book.available_copies === 0}
                                        >
                                            <i className="fas fa-qrcode me-1"></i> Get QR Code
                                        </button>
                                        <small className="text-muted d-block mt-1">
                                            For physical library pickup
                                        </small>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* NEW: Reviews Section */}
                    <div className="reviews-section mt-5">
                        <BookReviews bookId={id} user={user} />
                    </div>
                </div>
            </div>

            {/* Modals */}
            <ConfirmationModal
                show={showConfirmation}
                title="Confirm Borrow"
                message={confirmBorrow?.message}
                details={confirmBorrow?.bookDetails || {}}
                confirmText="Yes, Borrow Book"
                cancelText="Cancel"
                onConfirm={handleConfirmBorrow}
                onCancel={() => setShowConfirmation(false)}
            />

            <ErrorModal
                show={showErrorModal}
                message={errorMessage}
                onClose={() => setShowErrorModal(false)}
            />
        </div>
    );
};

export default BookDetail;