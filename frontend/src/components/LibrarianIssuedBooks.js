// LibrarianIssuedBooks.js - NEW COMPONENT
import React, { useState, useEffect } from 'react';

const LibrarianIssuedBooks = () => {
    const [issuedBooks, setIssuedBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('today'); // today, week, all

    useEffect(() => {
        fetchIssuedBooks();
    }, [filter]);
    useEffect(() => {
        // Set to 'all' initially to see all data
        setFilter('all');
        fetchIssuedBooks();
    }, []);
    const fetchIssuedBooks = async () => {
        try {
            const response = await fetch(`http://localhost:8000/api/librarian/issued-books/?filter=${filter}`, {
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                setIssuedBooks(data);
            }
        } catch (error) {
            console.error('Error fetching issued books:', error);
        } finally {
            setLoading(false);
        }
    };

    const getFilterDisplay = () => {
        switch (filter) {
            case 'today': return "Today's Issuances";
            case 'week': return "This Week's Issuances";
            case 'all': return "All Issuances";
            default: return "Issued Books";
        }
    };

    if (loading) return <div className="text-center mt-4">Loading issued books...</div>;

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>📋 {getFilterDisplay()}</h2>
                <select
                    className="form-select w-auto"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                >
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="all">All Time</option>
                </select>
            </div>

            {issuedBooks.length === 0 ? (
                <div className="alert alert-info">
                    No books issued for the selected period.
                </div>
            ) : (
                <div className="table-responsive">
                    <table className="table table-striped">
                        <thead>
                            <tr>
                                <th>Book</th>
                                <th>User</th>
                                <th>Issued Date</th>
                                <th>Due Date</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {issuedBooks.map(transaction => (
                                <tr key={transaction.id}>
                                    <td>
                                        <strong>{transaction.book_title}</strong><br />
                                        <small className="text-muted">{transaction.book_author}</small>
                                    </td>
                                    <td>
                                        {transaction.user_name}<br />
                                        <small className="text-muted">{transaction.user_roll}</small>
                                    </td>
                                    <td>{new Date(transaction.issued_at).toLocaleDateString()}</td>
                                    <td>{new Date(transaction.due_date).toLocaleDateString()}</td>
                                    <td>
                                        <span className={`badge ${transaction.return_date ? 'bg-success' :
                                            new Date(transaction.due_date) < new Date() ? 'bg-danger' : 'bg-primary'
                                            }`}>
                                            {transaction.return_date ? 'Returned' :
                                                new Date(transaction.due_date) < new Date() ? 'Overdue' : 'Active'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="card mt-4">
                <div className="card-body">
                    <h5>📊 Issuance Statistics</h5>
                    <div className="row text-center">
                        <div className="col-md-3">
                            <div className="card bg-primary text-white">
                                <div className="card-body">
                                    <h3>{issuedBooks.length}</h3>
                                    <small>Total Issued</small>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card bg-success text-white">
                                <div className="card-body">
                                    <h3>{issuedBooks.filter(t => !t.return_date).length}</h3>
                                    <small>Currently Active</small>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card bg-warning text-white">
                                <div className="card-body">
                                    <h3>{issuedBooks.filter(t => !t.return_date && new Date(t.due_date) < new Date()).length}</h3>
                                    <small>Overdue</small>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card bg-info text-white">
                                <div className="card-body">
                                    <h3>{issuedBooks.filter(t => t.return_date).length}</h3>
                                    <small>Returned</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LibrarianIssuedBooks;