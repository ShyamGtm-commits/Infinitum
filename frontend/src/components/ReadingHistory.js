// ReadingHistory.js
import React, { useState, useEffect } from 'react';
import ReadingStats from './ReadingStats';
import ReadingGoals from './ReadingGoals';

const ReadingHistory = () => {
    const [readingHistory, setReadingHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchReadingHistory();
    }, []);

    useEffect(() => {
        if (readingHistory.length > 0) {
            console.log('📖 Reading History Data:', readingHistory);
            console.log('📖 First item status:', readingHistory[0].status);
            console.log('📖 First item keys:', Object.keys(readingHistory[0]));
        }
    }, [readingHistory]);

    const fetchReadingHistory = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:8000/api/profile/history/', {
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                setReadingHistory(data);
            } else {
                setError('Failed to load reading history');
            }
        } catch (error) {
            console.error('Error fetching reading history:', error);
            setError('Error loading reading history');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="container mt-4">
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Loading your reading journey...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mt-4">
                <div className="alert alert-danger">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <div className="row">
                {/* Main Reading History */}
                <div className="col-lg-8">
                    <div className="card">
                        <div className="card-header bg-primary text-white">
                            <h4 className="mb-0">
                                <i className="fas fa-history me-2"></i>
                                Your Reading History
                            </h4>
                        </div>
                        <div className="card-body">
                            {readingHistory.length === 0 ? (
                                <div className="text-center py-4">
                                    <i className="fas fa-book-open fa-3x text-muted mb-3"></i>
                                    <h5 className="text-muted">No Reading History Yet</h5>
                                    <p className="text-muted">Start borrowing books to build your reading history!</p>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => window.location.href = '/books'}
                                    >
                                        Browse Books
                                    </button>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>Book</th>
                                                <th>Author</th>
                                                <th>Borrowed Date</th>
                                                <th>Returned Date</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {readingHistory.map((item, index) => (
                                                <tr key={index}>
                                                    <td>
                                                        <strong>{item.book?.title || 'Unknown Book'}</strong>
                                                    </td>
                                                    <td>{item.book?.author || 'Unknown Author'}</td>
                                                    <td>
                                                        {new Date(item.issue_date).toLocaleDateString()}
                                                    </td>
                                                    <td>
                                                        {item.return_date
                                                            ? new Date(item.return_date).toLocaleDateString()
                                                            : 'Not returned'
                                                        }
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${item.status === 'cancelled' ? 'bg-secondary' :
                                                            item.status === 'returned' ? 'bg-success' :
                                                                item.return_date ? 'bg-success' : // Fallback for returned books
                                                                    'bg-warning'
                                                            }`}>
                                                            {item.status === 'cancelled' ? 'Cancelled' :
                                                                item.status === 'returned' ? 'Completed' :
                                                                    item.return_date ? 'Completed' : // Fallback
                                                                        'Active'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar with Stats and Goals */}
                <div className="col-lg-4">
                    <ReadingStats />
                    <div className="mt-4">
                        <ReadingGoals />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReadingHistory;