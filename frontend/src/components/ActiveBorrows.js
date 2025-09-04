import React, { useState, useEffect } from 'react';

const ActiveBorrows = ({ user }) => {
  const [borrows, setBorrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchActiveBorrows();
  }, []);

  const fetchActiveBorrows = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/user/active-borrows/', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setBorrows(data);
      } else {
        setError('Failed to load your active borrows');
      }
    } catch (error) {
      console.error('Error fetching active borrows', error);
      setError('Error loading your active borrows');
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (transactionId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/transactions/${transactionId}/return/`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        alert('Book returned successfully!');
        fetchActiveBorrows(); // Refresh the list
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to return book');
      }
    } catch (error) {
      console.error('Return error:', error);
      alert('Error returning book');
    }
  };

  if (loading) {
    return <div className="text-center mt-4">Loading your active borrows...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div>
      <h2>Your Active Borrows</h2>
      
      {borrows.length === 0 ? (
        <div className="alert alert-info">
          You don't have any active borrows.
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
                <th>Days Remaining</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {borrows.map(transaction => {
                const dueDate = new Date(transaction.due_date);
                const today = new Date();
                const daysRemaining = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                
                return (
                  <tr key={transaction.id}>
                    <td>{transaction.book.title}</td>
                    <td>{transaction.book.author}</td>
                    <td>{new Date(transaction.issue_date).toLocaleDateString()}</td>
                    <td>{dueDate.toLocaleDateString()}</td>
                    <td>
                      <span className={daysRemaining < 0 ? 'text-danger' : daysRemaining < 3 ? 'text-warning' : 'text-success'}>
                        {daysRemaining < 0 ? `Overdue by ${Math.abs(daysRemaining)} days` : `${daysRemaining} days`}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleReturn(transaction.id)}
                      >
                        Return Book
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ActiveBorrows;