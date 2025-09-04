import React, { useState, useEffect } from 'react';

const TransactionManagement = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: '',
        user: '',
        book: ''
    });

    useEffect(() => {
        
    const fetchTransactions = async () => {
        try {
            const params = new URLSearchParams();
            if (filters.status) params.append('status', filters.status);
            if (filters.user) params.append('user', filters.user);
            if (filters.book) params.append('book', filters.book);

            const response = await fetch(`http://localhost:8000/api/admin/transactions/?${params}`, {
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                setTransactions(data);
            } else {
                console.error('Failed to load transactions');
            }
        } catch (error) {
            console.error('Error fetching transactions', error);
        } finally {
            setLoading(false);
        }
    };
    fetchTransactions();
    }, [filters]);


    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    if (loading) {
        return <div className="text-center mt-4">Loading transactions...</div>;
    }

    return (
        <div>
            <div className="card mb-4">
                <div className="card-header">
                    <h5 className="mb-0">Transaction Filters</h5>
                </div>
                <div className="card-body">
                    <div className="row">
                        <div className="col-md-4">
                            <label className="form-label">Status</label>
                            <select
                                className="form-select"
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                            >
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="overdue">Overdue</option>
                                <option value="returned">Returned</option>
                            </select>
                        </div>
                        <div className="col-md-4">
                            <label className="form-label">User Search</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search by username"
                                value={filters.user}
                                onChange={(e) => handleFilterChange('user', e.target.value)}
                            />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label">Book Search</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search by book title"
                                value={filters.book}
                                onChange={(e) => handleFilterChange('book', e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">All Transactions</h5>
                    <span className="badge bg-primary">{transactions.length} transactions</span>
                </div>
                <div className="card-body">
                    {transactions.length === 0 ? (
                        <div className="alert alert-info">No transactions found</div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Book</th>
                                        <th>User</th>
                                        <th>Issue Date</th>
                                        <th>Due Date</th>
                                        <th>Return Date</th>
                                        <th>Fine Amount</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map(transaction => (
                                        <tr key={transaction.id}>
                                            <td>{transaction.book.title}</td>
                                            <td>{transaction.user.username}</td>
                                            <td>{formatDate(transaction.issue_date)}</td>
                                            <td>{formatDate(transaction.due_date)}</td>
                                            <td>{transaction.return_date ? formatDate(transaction.return_date) : 'Not returned'}</td>
                                            <td>₹{transaction.fine_amount}</td>
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
                </div>
            </div>
        </div>
    );
};

export default TransactionManagement;