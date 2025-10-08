import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';
import UserQRStatus from './UserQRStatus';

const Dashboard = ({ user }) => {
    const [stats, setStats] = useState({
        total_borrowed: 0,
        currently_borrowed: 0,
        total_fines: 0,
        outstanding_fines: 0
    });
    const [borrowedBooks, setBorrowedBooks] = useState([]);
    const [readingStats] = useState({
        books_this_month: 0,
        favorite_genre: 'None yet',
        avg_reading_time: '0 hrs/week'
    });
    const [loading, setLoading] = useState(true);
    const [recommendationInsights, setRecommendationInsights] = useState({
        favoriteGenre: '',
        favoriteAuthor: '',
        recommendationCount: 0
    });

    useEffect(() => {
        fetchUserData();
        fetchRecommendationInsights();
    }, []);

    const fetchUserData = async () => {
        try {
            // Fetch user transactions
            const transactionsResponse = await fetch('http://localhost:8000/api/transactions/', {
                credentials: 'include',
            });

            if (transactionsResponse.ok) {
                const transactionsData = await transactionsResponse.json();

                // Calculate stats
                const totalBorrowed = transactionsData.length;
                const currentlyBorrowed = transactionsData.filter(t => !t.return_date).length;
                const totalFines = transactionsData.reduce((sum, t) => sum + parseFloat(t.fine_amount || 0), 0);
                const outstandingFines = transactionsData
                    .filter(t => !t.fine_paid)
                    .reduce((sum, t) => sum + parseFloat(t.fine_amount || 0), 0);

                setStats({
                    total_borrowed: totalBorrowed,
                    currently_borrowed: currentlyBorrowed,
                    total_fines: totalFines,
                    outstanding_fines: outstandingFines
                });

                // Format borrowed books for display
                const formattedBooks = transactionsData.map(transaction => ({
                    id: transaction.id,
                    title: transaction.book.title,
                    issue_date: new Date(transaction.issue_date).toLocaleDateString(),
                    due_date: new Date(transaction.due_date).toLocaleDateString(),
                    status: transaction.return_date ? 'returned' : 'active',
                    fine_amount: transaction.fine_amount,
                    fine_paid: transaction.fine_paid
                }));

                setBorrowedBooks(formattedBooks);
            } else {
                console.error('Failed to load user transactions');
            }
        } catch (error) {
            console.error('Error fetching user data', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRecommendationInsights = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/recommendations/insights/', {
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                setRecommendationInsights(data);
            }
        } catch (error) {
            console.error('Error fetching recommendation insights:', error);
        }
    };

    const handleReturnBook = async (bookId, transactionId) => {
        try {
            const response = await fetch(`http://localhost:8000/api/transactions/${transactionId}/return/`, {
                method: 'POST',
                credentials: 'include',
            });

            if (response.ok) {
                alert('Book returned successfully!');
                // Refresh the data
                fetchUserData();
            } else {
                const errorData = await response.json();
                alert(errorData.error || 'Failed to return book');
            }
        } catch (error) {
            console.error('Return error:', error);
            alert('Error returning book');
        }
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p>Loading your dashboard...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            {/* Header Section */}
            <div className="dashboard-header">
                <div>
                    <h1>Welcome back, {user.username}!</h1>
                    <div className="user-role-badge">{user.user_type}</div>
                </div>
                <div className="header-actions">
                    <button className="btn btn-light me-2">
                        <i className="fas fa-cog"></i> Settings
                    </button>
                    <button className="btn btn-light">
                        <i className="fas fa-sign-out-alt"></i> Logout
                    </button>
                </div>
            </div>

            {/* Stats Overview Grid */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">
                        <i className="fas fa-book"></i>
                    </div>
                    <div className="stat-content">
                        <h3>{stats.total_borrowed}</h3>
                        <p>Total Books Borrowed</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <i className="fas fa-clipboard-list"></i>
                    </div>
                    <div className="stat-content">
                        <h3>{stats.currently_borrowed}</h3>
                        <p>Currently Borrowed</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <i className="fas fa-money-bill-wave"></i>
                    </div>
                    <div className="stat-content">
                        <h3>${stats.total_fines.toFixed(2)}</h3>
                        <p>Total Fine Amount</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <i className="fas fa-exclamation-triangle"></i>
                    </div>
                    <div className="stat-content">
                        <h3>${stats.outstanding_fines.toFixed(2)}</h3>
                        <p>Outstanding Fines</p>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="dashboard-content">
                {/* Borrowed Books Table */}
                <div className="content-main">
                    <div className="content-card">
                        <div className="card-header">
                            <h3>Your Borrowed Books</h3>
                        </div>
                        <div className="card-body">
                            {borrowedBooks.length === 0 ? (
                                <div className="alert alert-info">
                                    You haven't borrowed any books yet.
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table borrowed-books-table">
                                        <thead>
                                            <tr>
                                                <th>Book Title</th>
                                                <th>Issue Date</th>
                                                <th>Due Date</th>
                                                <th>Status</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {borrowedBooks.map(book => (
                                                <tr key={book.id}>
                                                    <td>{book.title}</td>
                                                    <td>{book.issue_date}</td>
                                                    <td>{book.due_date}</td>
                                                    <td>
                                                        <span className={`status-badge ${book.status}`}>
                                                            {book.status === 'active' ? 'Active' : 'Returned'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {book.status === 'active' && (
                                                            <button
                                                                className="btn btn-return"
                                                                onClick={() => handleReturnBook(book.id, book.id)}
                                                            >
                                                                Return
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recommendation Insights Card */}
                    <div className="content-card">
                        <div className="card-header">
                            <h3>Your Reading Insights</h3>
                        </div>
                        <div className="card-body">
                            <div className="insights-grid">
                                <div className="insight-item">
                                    <div className="insight-icon">
                                        <i className="fas fa-heart"></i>
                                    </div>
                                    <div className="insight-content">
                                        <h4>Favorite Genre</h4>
                                        <p>{recommendationInsights.favoriteGenre || 'Not enough data'}</p>
                                    </div>
                                </div>
                                <div className="insight-item">
                                    <div className="insight-icon">
                                        <i className="fas fa-user-edit"></i>
                                    </div>
                                    <div className="insight-content">
                                        <h4>Favorite Author</h4>
                                        <p>{recommendationInsights.favoriteAuthor || 'Not enough data'}</p>
                                    </div>
                                </div>
                                <div className="insight-item">
                                    <div className="insight-icon">
                                        <i className="fas fa-lightbulb"></i>
                                    </div>
                                    <div className="insight-content">
                                        <h4>Personalized Recommendations</h4>
                                        <p>{recommendationInsights.recommendationCount} books suggested for you</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar with Quick Actions and Reading Stats */}
                <div className="content-sidebar">
                    {/* Quick Actions Card */}
                    <div className="content-card">
                        <div className="card-header">
                            <h3>Quick Actions</h3>
                        </div>
                        <div className="card-body">
                            <div className="quick-action-item">
                                <div className="action-icon">
                                    <i className="fas fa-search"></i>
                                </div>
                                <div className="action-content">
                                    <h5>Browse Books</h5>
                                    <p>Explore our collection</p>
                                </div>
                            </div>

                            <div className="quick-action-item">
                                <div className="action-icon">
                                    <i className="fas fa-money-bill-wave"></i>
                                </div>
                                <div className="action-content">
                                    <h5>View & Pay Fines</h5>
                                    <p>Clear your dues</p>
                                </div>
                            </div>

                            <div className="sidebar-section">
                                <h5>Quick Links</h5>
                                <div className="quick-link">
                                    <i className="fas fa-question-circle"></i>
                                    <span>Help Center</span>
                                </div>
                                <div className="quick-link">
                                    <i className="fas fa-history"></i>
                                    <span>Reading History</span>
                                </div>
                                <div className="quick-link">
                                    <i className="fas fa-star"></i>
                                    <Link to="/recommendations" style={{ textDecoration: 'none', color: 'inherit' }}>
                                        <span>Recommended Books</span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Reading Stats Card */}
                    <div className="content-card">
                        <div className="card-header">
                            <h3>Your Reading Stats</h3>
                        </div>
                        <div className="card-body">
                            <div className="reading-stats-grid">
                                <div className="reading-stat">
                                    <div className="stat-value">{readingStats.books_this_month}</div>
                                    <div className="stat-label">Books Read This Month</div>
                                </div>
                                <div className="reading-stat">
                                    <div className="stat-value">{readingStats.favorite_genre}</div>
                                    <div className="stat-label">Favorite Genre</div>
                                </div>
                                <div className="reading-stat">
                                    <div className="stat-value">{readingStats.avg_reading_time}</div>
                                    <div className="stat-label">Avg. Reading Time</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Automatic Status Updates */}
                    <div className="content-card">
                        <div className="card-header">
                            <h3>Pending Actions</h3>
                        </div>
                        <div className="card-body">
                            <UserQRStatus user={user} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;