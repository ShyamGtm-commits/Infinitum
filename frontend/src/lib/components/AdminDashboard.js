import React, { useState, useEffect } from 'react';
import AdminBookManagement from './AdminBookManagement';
import UserManagement from './UserManagement';
import TransactionManagement from './TransactionManagement';
import ReportGeneration from './ReportGeneration';


// eslint-disable-next-line
import { Link } from 'react-router-dom';

const AdminDashboard = ({ user }) => {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // eslint-disable-next-line no-lone-blocks
  {
    activeTab === 'books' && (
      <div>
        <AdminBookManagement user={user} />
      </div>
    )
  }

  {
    activeTab === 'users' && (
      <div>
        <UserManagement />
      </div>
    )



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

    useEffect(() => {
      fetchAdminStats();
    }, [fetchAdminStats]);

    if (loading) {
      return <div className="text-center mt-4">Loading admin dashboard...</div>;
    }

    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Admin Dashboard</h2>
          <span className="badge bg-primary">Welcome, {user.username}</span>
        </div>

        {/* Navigation Tabs */}
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <i className="fas fa-chart-bar me-2"></i>Overview
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <i className="fas fa-users me-2"></i>User Management
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'books' ? 'active' : ''}`}
              onClick={() => setActiveTab('books')}
            >
              <i className="fas fa-book me-2"></i>Book Management
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'transactions' ? 'active' : ''}`}
              onClick={() => setActiveTab('transactions')}
            >
              <i className="fas fa-exchange-alt me-2"></i>Transactions
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              <i className="fas fa-file-pdf me-2"></i>Reports
            </button>
          </li>
        </ul>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <div className="row mb-4">
              <div className="col-md-3">
                <div className="card dashboard-card text-white bg-primary">
                  <div className="card-body">
                    <div className="d-flex justify-content-between">
                      <div>
                        <h5 className="card-title">Total Books</h5>
                        <h3 className="card-text">{stats.total_books}</h3>
                      </div>
                      <div className="align-self-center">
                        <i className="fas fa-book fa-2x opacity-50"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card dashboard-card text-white bg-success">
                  <div className="card-body">
                    <div className="d-flex justify-content-between">
                      <div>
                        <h5 className="card-title">Total Users</h5>
                        <h3 className="card-text">{stats.total_users}</h3>
                      </div>
                      <div className="align-self-center">
                        <i className="fas fa-users fa-2x opacity-50"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card dashboard-card text-white bg-info">
                  <div className="card-body">
                    <div className="d-flex justify-content-between">
                      <div>
                        <h5 className="card-title">Active Borrows</h5>
                        <h3 className="card-text">{stats.active_borrows}</h3>
                      </div>
                      <div className="align-self-center">
                        <i className="fas fa-clipboard-list fa-2x opacity-50"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card dashboard-card text-white bg-warning">
                  <div className="card-body">
                    <div className="d-flex justify-content-between">
                      <div>
                        <h5 className="card-title">Overdue Books</h5>
                        <h3 className="card-text">{stats.overdue_books}</h3>
                      </div>
                      <div className="align-self-center">
                        <i className="fas fa-exclamation-triangle fa-2x opacity-50"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Second row of stats */}
            <div className="row mb-4">
              <div className="col-md-4">
                <div className="card dashboard-card text-white bg-danger">
                  <div className="card-body">
                    <div className="d-flex justify-content-between">
                      <div>
                        <h5 className="card-title">Total Fines</h5>
                        <h3 className="card-text">₹{stats.total_fines}</h3>
                      </div>
                      <div className="align-self-center">
                        <i className="fas fa-money-bill-wave fa-2x opacity-50"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card dashboard-card text-white bg-secondary">
                  <div className="card-body">
                    <div className="d-flex justify-content-between">
                      <div>
                        <h5 className="card-title">Total Transactions</h5>
                        <h3 className="card-text">{stats.total_transactions}</h3>
                      </div>
                      <div className="align-self-center">
                        <i className="fas fa-exchange-alt fa-2x opacity-50"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card dashboard-card text-white bg-dark">
                  <div className="card-body">
                    <div className="d-flex justify-content-between">
                      <div>
                        <h5 className="card-title">Popular Books</h5>
                        <h3 className="card-text">{stats.popular_books?.length || 0}</h3>
                      </div>
                      <div className="align-self-center">
                        <i className="fas fa-star fa-2x opacity-50"></i>
                      </div>
                    </div>
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

        {/* User Management Tab */}
        {activeTab === 'users' && <UserManagement />}

        {/* Book Management Tab */}
        {activeTab === 'books' && <AdminBookManagement />}

        {/* Transaction Management Tab */}
        {activeTab === 'transactions' && <TransactionManagement />}

        {/* Reports Tab */}
        {activeTab === 'reports' && <ReportGeneration />}
      </div>
    );
  };
}

export default AdminDashboard;