import React, { useState, useEffect } from 'react';

const Fines = ({ user }) => {
  const [finesData, setFinesData] = useState({
    transactions: [],
    total_fines: 0,
    total_paid: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFines();
  }, []);

  const fetchFines = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/fines/', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setFinesData(data);
      } else {
        setError('Failed to load fines data');
      }
    } catch (error) {
      console.error('Error fetching fines', error);
      setError('Error loading fines data');
    } finally {
      setLoading(false);
    }
  };

  const handlePayFine = async (transactionId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/transactions/${transactionId}/pay_fine/`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(data.success);
        fetchFines(); // Refresh fines data
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to pay fine');
      }
    } catch (error) {
      console.error('Pay fine error:', error);
      alert('Error paying fine');
    }
  };

  const handlePayAllFines = async () => {
    if (!window.confirm(`Are you sure you want to pay all fines totaling ₹${finesData.total_fines}?`)) {
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/fines/pay_all/', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(data.success);
        fetchFines(); // Refresh fines data
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to pay all fines');
      }
    } catch (error) {
      console.error('Pay all fines error:', error);
      alert('Error paying all fines');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  if (loading) {
    return <div className="text-center mt-4">Loading fines information...</div>;
  }

  return (
    <div>
      <h2>Fine Management</h2>
      
      {/* Fines Summary */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card text-white bg-danger">
            <div className="card-body">
              <h5 className="card-title">Outstanding Fines</h5>
              <h3 className="card-text">{formatCurrency(finesData.total_fines)}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-white bg-success">
            <div className="card-body">
              <h5 className="card-title">Paid Fines</h5>
              <h3 className="card-text">{formatCurrency(finesData.total_paid)}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-white bg-info">
            <div className="card-body">
              <h5 className="card-title">Total Fines</h5>
              <h3 className="card-text">{formatCurrency(finesData.total_fines + finesData.total_paid)}</h3>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Pay All Fines Button */}
      {finesData.total_fines > 0 && (
        <div className="d-flex justify-content-end mb-3">
          <button 
            className="btn btn-success"
            onClick={handlePayAllFines}
          >
            Pay All Fines ({formatCurrency(finesData.total_fines)})
          </button>
        </div>
      )}

      {/* Fines Table */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Fine Details</h5>
        </div>
        <div className="card-body">
          {finesData.transactions.length === 0 ? (
            <div className="alert alert-info">
              You don't have any fines.
            </div>
          ) : (
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Book Title</th>
                  <th>Due Date</th>
                  <th>Return Date</th>
                  <th>Days Overdue</th>
                  <th>Fine Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {finesData.transactions.map(transaction => {
                  const dueDate = new Date(transaction.due_date);
                  const returnDate = transaction.return_date ? new Date(transaction.return_date) : new Date();
                  const daysOverdue = Math.max(0, Math.floor((returnDate - dueDate) / (1000 * 60 * 60 * 24)));
                  
                  return (
                    <tr key={transaction.id}>
                      <td>{transaction.book.title}</td>
                      <td>{formatDate(transaction.due_date)}</td>
                      <td>{transaction.return_date ? formatDate(transaction.return_date) : 'Not returned'}</td>
                      <td>{daysOverdue}</td>
                      <td>{formatCurrency(transaction.fine_amount)}</td>
                      <td>
                        <span className={`badge ${transaction.fine_paid ? 'bg-success' : 'bg-danger'}`}>
                          {transaction.fine_paid ? 'Paid' : 'Unpaid'}
                        </span>
                      </td>
                      <td>
                        {!transaction.fine_paid && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handlePayFine(transaction.id)}
                          >
                            Pay Fine
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Fine Policy Information */}
      <div className="card mt-4">
        <div className="card-header">
          <h5 className="mb-0">Fine Policy</h5>
        </div>
        <div className="card-body">
          <ul>
            <li>Fine rate: ₹5 per day for overdue books</li>
            <li>Fines are calculated when books are returned</li>
            <li>Fines must be paid to borrow additional books</li>
            <li>Payment is simulated for this demo system</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Fines;