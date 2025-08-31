import React, { useState, useEffect } from 'react';
// eslint-disable-next-line
import { Link } from 'react-router-dom';

const AdminDashboard = ({ user }) => {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/admin/stats/', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        console.error('Failed to load admin stats');
      }
    } catch (error) {
      console.error('Error fetching admin stats', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center mt-4">Loading admin dashboard...</div>;
  }

  return (
    <div>
      <h2>Admin Dashboard</h2>
      
      {/* Navigation Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            User Management
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveTab('transactions')}
          >
            Transactions
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            Reports
          </button>
        </li>
      </ul>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div>
          <div className="row mb-4">
            <div className="col-md-4">
              <div className="card text-white bg-primary">
                <div className="card-body">
                  <h5 className="card-title">Total Books</h5>
                  <h3 className="card-text">{stats.total_books}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card text-white bg-success">
                <div className="card-body">
                  <h5 className="card-title">Total Users</h5>
                  <h3 className="card-text">{stats.total_users}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card text-white bg-info">
                <div className="card-body">
                  <h5 className="card-title">Active Borrows</h5>
                  <h3 className="card-text">{stats.active_borrows}</h3>
                </div>
              </div>
            </div>
          </div>

          <div className="row mb-4">
            <div className="col-md-4">
              <div className="card text-white bg-warning">
                <div className="card-body">
                  <h5 className="card-title">Overdue Books</h5>
                  <h3 className="card-text">{stats.overdue_books}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card text-white bg-danger">
                <div className="card-body">
                  <h5 className="card-title">Total Fines</h5>
                  <h3 className="card-text">₹{stats.total_fines}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card text-white bg-secondary">
                <div className="card-body">
                  <h5 className="card-title">Total Transactions</h5>
                  <h3 className="card-text">{stats.total_transactions}</h3>
                </div>
              </div>
            </div>
          </div>

          {/* Popular Books */}
          <div className="card">
            <div className="card-header">
              <h5>Most Popular Books</h5>
            </div>
            <div className="card-body">
              {stats.popular_books && stats.popular_books.length > 0 ? (
                <div className="list-group">
                  {stats.popular_books.map(book => (
                    <div key={book.id} className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-1">{book.title}</h6>
                        <small className="text-muted">{book.author}</small>
                      </div>
                      <span className="badge bg-primary rounded-pill">
                        {book.borrow_count} borrows
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No popular books data available</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Other tabs would be implemented similarly */}
      {activeTab === 'users' && (
  <div>
    <h4>User Management</h4>
    <div className="alert alert-info">
      User management feature is coming soon!
    </div>
  </div>
)}

{activeTab === 'transactions' && (
  <div>
    <h4>Transaction Management</h4>
    <div className="alert alert-info">
      Transaction management feature is coming soon!
    </div>
  </div>
)}

{activeTab === 'reports' && (
  <div>
    <h4>Report Generation</h4>
    <div className="alert alert-info">
      Report generation feature is coming soon!
    </div>
  </div>
)}

    </div>
  );
};

export default AdminDashboard;