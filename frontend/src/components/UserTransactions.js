import React, { useState, useEffect } from 'react';

const UserTransactions = ({ user }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUserTransactions();
  }, []);

  const fetchUserTransactions = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/user/transactions/', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      } else {
        setError('Failed to load your transactions');
      }
    } catch (error) {
      console.error('Error fetching user transactions', error);
      setError('Error loading your transactions');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <div className="text-center mt-4">Loading your transactions...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div>
      <h2>Your Borrowing History</h2>

      {transactions.length === 0 ? (
        <div className="alert alert-info">
          You haven't borrowed any books yet.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Book Title</th>
                <th>Author</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Return Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(transaction => (
                <tr key={transaction.id}>
                  <td>{transaction.book.title}</td>
                  <td>{transaction.book.author}</td>
                  <td>{formatDate(transaction.issue_date)}</td>
                  <td>{formatDate(transaction.due_date)}</td>
                  <td>{transaction.return_date ? formatDate(transaction.return_date) : 'Not returned'}</td>
                  <td>
                    <span className={`badge ${transaction.return_date ? 'bg-success' :
                      new Date(transaction.due_date) < new Date() ? 'bg-danger' : 'bg-primary'}`}>
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
  );
};

export default UserTransactions;