import React, { useState, useEffect } from 'react';

const Fines = ({ user }) => {
  // State variables - like memory boxes for your component
  const [finesData, setFinesData] = useState({
    transactions: [],
    total_fines: 0,
    total_paid: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFine, setSelectedFine] = useState(null); // For showing details

  // 🎯 STEP 1: This runs when component loads (like opening a page)
  useEffect(() => {
    fetchFines();
  }, []);

  // 🎯 STEP 2: Function to get fines data from backend
  const fetchFines = async () => {
    try {
      console.log("🔍 Fetching fines data...");
      const response = await fetch('http://localhost:8000/api/fines/', {
        credentials: 'include', // This sends cookies for authentication
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("✅ Fines data received:", data);
        setFinesData(data);
      } else {
        setError('❌ Failed to load fines data');
      }
    } catch (error) {
      console.error('💥 Error fetching fines', error);
      setError('💥 Error loading fines data. Check if server is running.');
    } finally {
      setLoading(false); // Stop loading spinner
    }
  };

  // 🎯 STEP 3: NEW - Show fine calculation details
  const getFineBreakdown = (transaction) => {
    const dueDate = new Date(transaction.due_date);
    const returnDate = transaction.return_date ? new Date(transaction.return_date) : new Date();
    const daysOverdue = Math.max(0, Math.floor((returnDate - dueDate) / (1000 * 60 * 60 * 24)));
    
    return {
      daysOverdue,
      ratePerDay: 5, // ₹5 per day
      totalFine: daysOverdue * 5,
      dueDate: dueDate.toLocaleDateString(),
      returnDate: transaction.return_date ? returnDate.toLocaleDateString() : 'Not returned yet',
      bookTitle: transaction.book.title
    };
  };

  // 🎯 STEP 4: Pay individual fine
  const handlePayFine = async (transactionId) => {
    // Show confirmation dialog
    const fine = finesData.transactions.find(t => t.id === transactionId);
    const breakdown = getFineBreakdown(fine);
    
    if (!window.confirm(
      `Pay fine of ₹${breakdown.totalFine} for "${breakdown.bookTitle}"?\n\n` +
      `Breakdown:\n` +
      `• Due Date: ${breakdown.dueDate}\n` +
      `• Return Date: ${breakdown.returnDate}\n` +
      `• Days Overdue: ${breakdown.daysOverdue}\n` +
      `• Rate: ₹${breakdown.ratePerDay}/day`
    )) {
      return;
    }

    try {
      console.log(`💳 Paying fine for transaction ${transactionId}...`);
      const response = await fetch(`http://localhost:8000/api/transactions/${transactionId}/pay_fine/`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`✅ ${data.success}`);
        fetchFines(); // Refresh the data
      } else {
        const errorData = await response.json();
        alert(`❌ ${errorData.error || 'Failed to pay fine'}`);
      }
    } catch (error) {
      console.error('💥 Pay fine error:', error);
      alert('💥 Error paying fine. Check console for details.');
    }
  };

  // 🎯 STEP 5: Pay all fines at once
  const handlePayAllFines = async () => {
    if (finesData.total_fines === 0) {
      alert('ℹ️ You have no fines to pay!');
      return;
    }

    const unpaidFines = finesData.transactions.filter(t => !t.fine_paid);
    const fineList = unpaidFines.map(fine => {
      const breakdown = getFineBreakdown(fine);
      return `• ${fine.book.title}: ₹${breakdown.totalFine} (${breakdown.daysOverdue} days overdue)`;
    }).join('\n');

    if (!window.confirm(
      `Pay ALL fines totaling ₹${finesData.total_fines}?\n\n` +
      `Fines to be paid:\n${fineList}\n\n` +
      `Click OK to confirm payment.`
    )) {
      return;
    }

    try {
      console.log("💳 Paying ALL fines...");
      const response = await fetch('http://localhost:8000/api/fines/pay_all/', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`✅ ${data.success}`);
        fetchFines(); // Refresh data
      } else {
        const errorData = await response.json();
        alert(`❌ ${errorData.error || 'Failed to pay all fines'}`);
      }
    } catch (error) {
      console.error('💥 Pay all fines error:', error);
      alert('💥 Error paying all fines.');
    }
  };

  // 🎯 STEP 6: NEW - Generate receipt (mock)
  const generateReceipt = (transaction) => {
    const breakdown = getFineBreakdown(transaction);
    const receiptId = `FINE-${transaction.id}-${Date.now()}`;
    
    const receipt = `
🏛️ INFINITUM DIGITAL LIBRARY
📄 FINE PAYMENT RECEIPT
══════════════════════════════

Receipt ID: ${receiptId}
Issue Date: ${new Date().toLocaleDateString()}
Issue Time: ${new Date().toLocaleTimeString()}

📚 Book Details:
   Title: ${breakdown.bookTitle}
   Due Date: ${breakdown.dueDate}
   Return Date: ${breakdown.returnDate}

💰 Fine Breakdown:
   Days Overdue: ${breakdown.daysOverdue} days
   Fine Rate: ₹${breakdown.ratePerDay} per day
   Total Fine: ₹${breakdown.totalFine}

👤 User Information:
   Name: ${user?.username || 'Library User'}
   Email: ${user?.email || 'N/A'}

💳 Payment Status: PAID ✅
Payment Date: ${new Date().toLocaleDateString()}

──────────────────────────────
Total Paid: ₹${breakdown.totalFine}

Thank you for your payment!
This is a simulated receipt for academic purposes.

    `;

    // Create downloadable file
    const blob = new Blob([receipt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fine-receipt-${transaction.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('📄 Receipt downloaded! Check your downloads folder.');
  };

  // 🎯 STEP 7: Format dates nicely
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // 🎯 STEP 8: Format currency (Indian Rupees)
  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  // 🎯 STEP 9: Show loading screen
  if (loading) {
    return (
      <div className="text-center mt-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading your fines information...</p>
      </div>
    );
  }

  // 🎯 STEP 10: Show error if any
  if (error) {
    return (
      <div className="alert alert-danger">
        <h4>❌ Error Loading Fines</h4>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={fetchFines}>
          🔄 Try Again
        </button>
      </div>
    );
  }

  // 🎯 STEP 11: Main component render
  return (
    <div className="container-fluid">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">💰 Fine Management</h2>
          <p className="text-muted">View and manage your library fines</p>
        </div>
        <button 
          className="btn btn-outline-primary"
          onClick={fetchFines}
          title="Refresh fines data"
        >
          🔄 Refresh
        </button>
      </div>

      {/* 🎯 NEW: Summary Cards - Enhanced */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card text-white bg-danger h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h5 className="card-title">Outstanding Fines</h5>
                  <h3 className="card-text">{formatCurrency(finesData.total_fines)}</h3>
                  <small>
                    {finesData.transactions.filter(t => !t.fine_paid).length} unpaid fine(s)
                  </small>
                </div>
                <div className="display-4">💸</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 mb-3">
          <div className="card text-white bg-success h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h5 className="card-title">Paid Fines</h5>
                  <h3 className="card-text">{formatCurrency(finesData.total_paid)}</h3>
                  <small>
                    {finesData.transactions.filter(t => t.fine_paid).length} paid fine(s)
                  </small>
                </div>
                <div className="display-4">✅</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 mb-3">
          <div className="card text-white bg-warning h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h5 className="card-title">Overdue Books</h5>
                  <h3 className="card-text">
                    {finesData.transactions.filter(t => !t.return_date && new Date(t.due_date) < new Date()).length}
                  </h3>
                  <small>Potential future fines</small>
                </div>
                <div className="display-4">⏰</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 mb-3">
          <div className="card text-white bg-info h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h5 className="card-title">Total History</h5>
                  <h3 className="card-text">
                    {formatCurrency(finesData.total_fines + finesData.total_paid)}
                  </h3>
                  <small>All-time fines</small>
                </div>
                <div className="display-4">📊</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🎯 NEW: Pay All Fines Button */}
      {finesData.total_fines > 0 && (
        <div className="d-flex justify-content-between align-items-center mb-3 p-3 bg-light rounded">
          <div>
            <h5 className="mb-1">Quick Payment</h5>
            <p className="mb-0 text-muted">Pay all outstanding fines at once</p>
          </div>
          <button 
            className="btn btn-success btn-lg"
            onClick={handlePayAllFines}
          >
            💳 Pay All Fines ({formatCurrency(finesData.total_fines)})
          </button>
        </div>
      )}

      {/* Fines Table */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">📋 Fine Details</h5>
        </div>
        <div className="card-body">
          {finesData.transactions.length === 0 ? (
            <div className="alert alert-success text-center">
              <h4>🎉 No Fines!</h4>
              <p className="mb-0">You don't have any fines. Keep up the good work!</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead className="table-dark">
                  <tr>
                    <th>Book Title</th>
                    <th>Due Date</th>
                    <th>Return Date</th>
                    <th>Fine Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {finesData.transactions.map(transaction => {
                    const breakdown = getFineBreakdown(transaction);
                    const isOverdue = !transaction.return_date && new Date(transaction.due_date) < new Date();
                    
                    return (
                      <tr key={transaction.id}>
                        <td>
                          <strong>{transaction.book.title}</strong>
                          <br />
                          <small className="text-muted">by {transaction.book.author}</small>
                        </td>
                        <td>
                          <span className={isOverdue ? 'text-danger fw-bold' : ''}>
                            {formatDate(transaction.due_date)}
                          </span>
                        </td>
                        <td>
                          {transaction.return_date ? (
                            formatDate(transaction.return_date)
                          ) : (
                            <span className="text-warning">Not returned</span>
                          )}
                        </td>
                        <td>
                          <div>
                            <span 
                              className={`badge ${transaction.fine_paid ? 'bg-success' : 'bg-danger'} fs-6`}
                              title={`Calculation: ${breakdown.daysOverdue} days × ₹${breakdown.ratePerDay}/day`}
                            >
                              {formatCurrency(transaction.fine_amount)}
                            </span>
                            {breakdown.daysOverdue > 0 && (
                              <div>
                                <small className="text-muted">
                                  ({breakdown.daysOverdue} days overdue)
                                </small>
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div>
                            <span className={`badge ${transaction.fine_paid ? 'bg-success' : 'bg-danger'}`}>
                              {transaction.fine_paid ? '✅ Paid' : '❌ Unpaid'}
                            </span>
                            {!transaction.return_date && isOverdue && (
                              <div>
                                <small className="text-warning">⚠️ Still overdue</small>
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            {!transaction.fine_paid && transaction.fine_amount > 0 && (
                              <button
                                className="btn btn-primary"
                                onClick={() => handlePayFine(transaction.id)}
                                title="Pay this fine"
                              >
                                💳 Pay
                              </button>
                            )}
                            {transaction.fine_paid && (
                              <button
                                className="btn btn-outline-success"
                                onClick={() => generateReceipt(transaction)}
                                title="Download payment receipt"
                              >
                                📄 Receipt
                              </button>
                            )}
                            <button
                              className="btn btn-outline-info"
                              onClick={() => {
                                const breakdown = getFineBreakdown(transaction);
                                alert(
                                  `📊 Fine Breakdown for "${breakdown.bookTitle}":\n\n` +
                                  `• Due Date: ${breakdown.dueDate}\n` +
                                  `• Return Date: ${breakdown.returnDate}\n` +
                                  `• Days Overdue: ${breakdown.daysOverdue}\n` +
                                  `• Rate: ₹${breakdown.ratePerDay} per day\n` +
                                  `• Total Fine: ₹${breakdown.totalFine}`
                                );
                              }}
                              title="View fine calculation details"
                            >
                              ℹ️ Details
                            </button>
                          </div>
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

      {/* 🎯 NEW: Fine Policy Information */}
      <div className="card mt-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">📜 Fine Policy Information</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <h6>💰 Fine Rates</h6>
              <ul>
                <li><strong>Students:</strong> ₹5 per day after due date</li>
                <li><strong>Teachers:</strong> ₹2 per day after due date</li>
                <li><strong>Grace Period:</strong> 2 days (no fines)</li>
                <li><strong>Maximum Fine:</strong> No cap (for demo)</li>
              </ul>
            </div>
            <div className="col-md-6">
              <h6>📋 Important Notes</h6>
              <ul>
                <li>Fines are calculated when books are returned</li>
                <li>2-day grace period applies to all users</li>
                <li>Unpaid fines block new book reservations</li>
                <li>Contact librarian for fine disputes or waivers</li>
                <li>This is a simulated system for academic purposes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Debug Information (remove in production) */}
      <details className="mt-4">
        <summary className="text-muted">🔧 Debug Information</summary>
        <pre className="bg-light p-3 small">
          {JSON.stringify(finesData, null, 2)}
        </pre>
      </details>
    </div>
  );
};

export default Fines;