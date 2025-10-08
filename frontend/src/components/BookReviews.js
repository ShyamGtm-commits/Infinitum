import React, { useState, useEffect } from 'react';

const BookReviews = ({ bookId, user }) => {
    const [reviews, setReviews] = useState([]);
    const [userReview, setUserReview] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchReviews();
    }, [bookId]);

    const fetchReviews = async () => {
        try {
            const response = await fetch(`http://localhost:8000/api/books/${bookId}/reviews/`);
            if (response.ok) {
                const data = await response.json();
                setReviews(data);
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!userReview.trim()) return;

        setLoading(true);
        setError('');

        try {
            const response = await fetch(`http://localhost:8000/api/books/${bookId}/review/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ review_text: userReview }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('Review submitted successfully!');
                setUserReview('');
                fetchReviews(); // Refresh reviews
            } else {
                setError(data.error || 'Failed to submit review');
            }
        } catch (error) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteReview = async () => {
        if (!window.confirm('Are you sure you want to delete your review?')) return;

        try {
            const response = await fetch(`http://localhost:8000/api/books/${bookId}/review/`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (response.ok) {
                setMessage('Review deleted successfully!');
                setUserReview('');
                fetchReviews();
            }
        } catch (error) {
            setError('Failed to delete review');
        }
    };

    const existingReview = reviews.find(review => review.user_name === user?.username);

    return (
        <div className="book-reviews mt-4">
            <h5>
                <i className="fas fa-comments me-2"></i>
                Reader Reviews ({reviews.length})
            </h5>

            {message && (
                <div className="alert alert-success alert-dismissible fade show">
                    {message}
                    <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
                </div>
            )}

            {error && (
                <div className="alert alert-danger alert-dismissible fade show">
                    {error}
                    <button type="button" className="btn-close" onClick={() => setError('')}></button>
                </div>
            )}

            {/* Review Form */}
            {user && !existingReview && (
                <div className="card mb-4">
                    <div className="card-header">
                        <h6 className="mb-0">Write a Review</h6>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleSubmitReview}>
                            <div className="mb-3">
                                <textarea
                                    className="form-control"
                                    rows="4"
                                    placeholder="Share your thoughts about this book..."
                                    value={userReview}
                                    onChange={(e) => setUserReview(e.target.value)}
                                    disabled={loading}
                                    minLength="10"
                                    required
                                />
                                <small className="form-text text-muted">
                                    Minimum 10 characters
                                </small>
                            </div>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading || userReview.length < 10}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        Submitting...
                                    </>
                                ) : (
                                    'Submit Review'
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Existing User Review */}
            {existingReview && (
                <div className="card mb-4 border-primary">
                    <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                        <span>Your Review</span>
                        <button
                            className="btn btn-sm btn-outline-light"
                            onClick={handleDeleteReview}
                            title="Delete review"
                        >
                            <i className="fas fa-trash"></i>
                        </button>
                    </div>
                    <div className="card-body">
                        <p className="card-text">{existingReview.review_text}</p>
                        <small className="text-muted">
                            Posted on {new Date(existingReview.created_at).toLocaleDateString()}
                        </small>
                    </div>
                </div>
            )}

            {/* Other Users' Reviews */}
            {reviews.filter(review => review.user_name !== user?.username).map((review) => (
                <div key={review.id} className="card mb-3">
                    <div className="card-body">
                        <h6 className="card-title text-primary">{review.user_name}</h6>
                        <p className="card-text">{review.review_text}</p>
                        <small className="text-muted">
                            {new Date(review.created_at).toLocaleDateString()}
                        </small>
                    </div>
                </div>
            ))}

            {reviews.length === 0 && (
                <div className="text-center text-muted py-4">
                    <i className="fas fa-comment-slash fa-2x mb-2"></i>
                    <p>No reviews yet. Be the first to share your thoughts!</p>
                </div>
            )}
        </div>
    );
};

export default BookReviews;