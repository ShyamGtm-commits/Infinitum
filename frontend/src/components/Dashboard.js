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
            case 'Returned': return 'bg-success';
            case 'Overdue': return 'bg-danger';
            default: return 'bg-primary';
        }
    };

    if (loading) {
        return <div className="text-center mt-4">Loading your books...</div>;
    }

    return (
        <div>
            <h2>Welcome, {user.username}!</h2>
            <p>Role: {user.user_type}</p>

            <div className="row mt-4">
                <div className="col-md-8">
                    <h4>Your Borrowed Books</h4>
                    {error && <div className="alert alert-danger">{error}</div>}
                    {transactions.length === 0 ? (
                        <div className="alert alert-info">
                            You haven't borrowed any books yet.
                        </div>
                    ) : (
                        <table className="table table-striped">
                            <thead>
                                <tr>
                                    <th>Book Title</th>
                                    <th>Issue Date</th>
                                    <th>Due Date</th>
                                    <th>Status</th>
                                    <th>Fine</th>
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
                                                {transaction.fine_amount > 0 ? `₹${transaction.fine_amount}` : '-'}
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
                    )}
                </div>

                <div className="col-md-4">
                    <div className="card">
                        <div className="card-header">
                            <h5>Quick Actions</h5>
                        </div>
                        <div className="card-body">
                            <Link to="/books" className="btn btn-primary w-100 mb-2">
                                Browse Books
                            </Link>
                        </div>
                    </div>

                    {/* Statistics Card */}
                    <div className="card mt-3">
                        <div className="card-header">
                            <h5>Your Reading Stats</h5>
                        </div>
                        <div className="card-body">
                            <p>Total Books Borrowed: <strong>{transactions.length}</strong></p>
                            <p>Currently Borrowed: <strong>
                                {transactions.filter(t => !t.return_date).length}
                            </strong></p>
                            <p>Total Fine Amount: <strong>
                                ₹{transactions.reduce((sum, t) => sum + parseFloat(t.fine_amount), 0)}
                            </strong></p>

                            <p>Outstanding Fines: <strong>
                                ₹{transactions.reduce((sum, t) => sum + (t.fine_paid ? 0 : parseFloat(t.fine_amount)), 0)}
                            </strong></p>

                            <Link to="/fines" className="btn btn-warning w-100 mt-2">
                                View & Pay Fines
                            </Link>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;