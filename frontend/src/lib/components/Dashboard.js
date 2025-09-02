// src/components/Dashboard.js (Redesigned)
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Dashboard = ({ user }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchUserTransactions();
    }, []);

    const fetchUserTransactions = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/transactions/', {
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                setTransactions(data);
            } else {
                setError('Failed to load your transactions');
            }
        } catch (error) {
            console.error('Error fetching transactions', error);
            setError('Error loading your transactions');
        } finally {
            setLoading(false);
        }
    };

    const handleReturn = async (transactionId) => {
        if (!window.confirm('Are you sure you want to return this book?')) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:8000/api/transactions/${transactionId}/return/`, {
                method: 'POST',
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                alert(data.success);
                if (data.transaction.fine_amount > 0) {
                    alert(`Fine amount: ₹${data.transaction.fine_amount}`);
                }
                fetchUserTransactions(); // Refresh the list
            } else {
                const errorData = await response.json();
                alert(errorData.error || 'Failed to return book');
            }
        } catch (error) {
            console.error('Return error:', error);
            alert('Error returning book');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    const getStatus = (transaction) => {
        if (transaction.return_date) {
            return 'Returned';
        } else if (new Date(transaction.due_date) < new Date()) {
            return 'Overdue';
        } else {
            return 'Borrowed';
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'Returned': return 'badge-success';
            case 'Overdue': return 'badge-danger';
            default: return 'badge-primary';
        }
    };

    if (loading) {
        return <div className="text-center mt-4">Loading your books...</div>;
    }

    return (
        <div className="dashboard-container">
            {/* Header Section */}
            <div className="dashboard-header">
                <div className="container">
                    <div className="row align-items-center">
                        <div className="col-md-8">
                            <h1>Welcome back, {user.username}!</h1>
                            <p className="user-role">{user.user_type.charAt(0).toUpperCase() + user.user_type.slice(1)} Account</p>
                        </div>
                        <div className="col-md-4 text-md-end">
                            <Link to="/books" className="btn btn-primary btn-explore">
                                <i className="fas fa-book me-2"></i>Explore Books
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="container mt-4">
                <div className="row">
                    <div className="col-md-3 mb-4">
                        <div className="stat-card">
                            <div className="stat-icon">
                                <i className="fas fa-book"></i>
                            </div>
                            <div className="stat-info">
                                <h3>{transactions.length}</h3>
                                <p>Total Books Borrowed</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3 mb-4">
                        <div className="stat-card">
                            <div className="stat-icon">
                                <i className="fas fa-clock"></i>
                            </div>
                            <div className="stat-info">
                                <h3>{transactions.filter(t => !t.return_date).length}</h3>
                                <p>Currently Borrowed</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3 mb-4">
                        <div className="stat-card">
                            <div className="stat-icon">
                                <i className="fas fa-coins"></i>
                            </div>
                            <div className="stat-info">
                                <h3>₹{transactions.reduce((sum, t) => sum + parseFloat(t.fine_amount), 0).toFixed(2)}</h3>
                                <p>Total Fine Amount</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3 mb-4">
                        <div className="stat-card">
                            <div className="stat-icon">
                                <i className="fas fa-exclamation-circle"></i>
                            </div>
                            <div className="stat-info">
                                <h3>₹{transactions.reduce((sum, t) => sum + (t.fine_paid ? 0 : parseFloat(t.fine_amount)), 0).toFixed(2)}</h3>
                                <p>Outstanding Fines</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container">
                <div className="row">
                    <div className="col-lg-8">
                        <div className="card dashboard-card">
                            <div className="card-header">
                                <h4>Your Borrowed Books</h4>
                            </div>
                            <div className="card-body">
                                {error && <div className="alert alert-danger">{error}</div>}
                                {transactions.length === 0 ? (
                                    <div className="alert alert-info">
                                        You haven't borrowed any books yet. <Link to="/books">Explore our collection</Link> to get started.
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-hover">
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
                                                {transactions.map(transaction => {
                                                    const status = getStatus(transaction);
                                                    return (
                                                        <tr key={transaction.id}>
                                                            <td>{transaction.book.title}</td>
                                                            <td>{formatDate(transaction.issue_date)}</td>
                                                            <td>{formatDate(transaction.due_date)}</td>
                                                            <td>
                                                                <span className={`badge ${getStatusClass(status)}`}>
                                                                    {status}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                {status === 'Borrowed' || status === 'Overdue' ? (
                                                                    <button
                                                                        className="btn btn-success btn-sm"
                                                                        onClick={() => handleReturn(transaction.id)}
                                                                    >
                                                                        Return
                                                                    </button>
                                                                ) : (
                                                                    <span className="text-muted">Returned</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-4">
                        <div className="card dashboard-card">
                            <div className="card-header">
                                <h4>Quick Actions</h4>
                            </div>
                            <div className="card-body">
                                <Link to="/books" className="btn btn-outline-primary w-100 mb-3">
                                    <i className="fas fa-search me-2"></i>Browse Books
                                </Link>
                                <Link to="/fines" className="btn btn-outline-warning w-100 mb-3">
                                    <i className="fas fa-money-bill me-2"></i>View & Pay Fines
                                </Link>
                                <div className="quick-links">
                                    <h5>Quick Links</h5>
                                    <ul className="list-unstyled">
                                        <li>
                                            <button className="btn btn-link p-0 text-decoration-none" onClick={() => console.log('Help Center clicked')}>
                                                <i className="fas fa-question-circle me-2"></i>Help Center
                                            </button>
                                        </li>
                                        <li>
                                            <button className="btn btn-link p-0 text-decoration-none" onClick={() => console.log('Reading History clicked')}>
                                                <i className="fas fa-history me-2"></i>Reading History
                                            </button>
                                        </li>
                                        <li>
                                            <button className="btn btn-link p-0 text-decoration-none" onClick={() => console.log('Recommended Books clicked')}>
                                                <i className="fas fa-star me-2"></i>Recommended Books
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Reading Stats Card */}
                        <div className="card dashboard-card mt-4">
                            <div className="card-header">
                                <h4>Your Reading Stats</h4>
                            </div>
                            <div className="card-body">
                                <div className="reading-stats">
                                    <div className="stat-item">
                                        <span className="stat-label">Books Read This Month</span>
                                        <span className="stat-value">2</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Favorite Genre</span>
                                        <span className="stat-value">Fiction</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Avg. Reading Time</span>
                                        <span className="stat-value">5.2 hrs/week</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;