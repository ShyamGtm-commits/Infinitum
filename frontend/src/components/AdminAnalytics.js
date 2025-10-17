import React, { useState, useEffect } from 'react';

const AdminAnalytics = ({ user }) => {
    const [analytics, setAnalytics] = useState({
        library_health: {},
        popularity: {},
        financial: {},
        trends: {},
        last_updated: new Date()
    });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [timeRange, setTimeRange] = useState('7days');

    useEffect(() => {
        fetchAnalytics();
    }, [timeRange]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/api/admin/analytics/advanced/', {
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setAnalytics(data.analytics);
                } else {
                    console.error('Analytics API returned error:', data.error);
                    // Set default analytics structure to prevent crashes
                    setAnalytics({
                        library_health: {},
                        popularity: {},
                        financial: {},
                        trends: {},
                        last_updated: new Date()
                    });
                }
            } else {
                console.error('Failed to fetch analytics:', response.status);
                // Set default structure
                setAnalytics({
                    library_health: {},
                    popularity: {},
                    financial: {},
                    trends: {},
                    last_updated: new Date()
                });
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
            // Set default structure
            setAnalytics({
                library_health: {},
                popularity: {},
                financial: {},
                trends: {},
                last_updated: new Date()
            });
        } finally {
            setLoading(false);
        }
    };

    const formatNumber = (num) => {
        return num ? num.toLocaleString() : '0';
    };

    const formatCurrency = (amount) => {
        return amount ? `₹${amount.toLocaleString()}` : '₹0';
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading advanced analytics...</p>
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="alert alert-danger">
                Failed to load analytics data.
            </div>
        );
    }

    const { library_health, popularity, financial, trends } = analytics || {};

    return (
        <div className="admin-analytics">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>
                    <i className="fas fa-chart-line me-2"></i>
                    Advanced Analytics Dashboard
                </h2>
                <div className="d-flex gap-2">
                    <select
                        className="form-select form-select-sm"
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                    >
                        <option value="7days">Last 7 Days</option>
                        <option value="30days">Last 30 Days</option>
                    </select>
                    <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={fetchAnalytics}
                    >
                        <i className="fas fa-sync-alt"></i>
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <ul className="nav nav-tabs mb-4">
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        <i className="fas fa-home me-2"></i>Overview
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'popularity' ? 'active' : ''}`}
                        onClick={() => setActiveTab('popularity')}
                    >
                        <i className="fas fa-fire me-2"></i>Popularity
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'financial' ? 'active' : ''}`}
                        onClick={() => setActiveTab('financial')}
                    >
                        <i className="fas fa-money-bill-wave me-2"></i>Financial
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'trends' ? 'active' : ''}`}
                        onClick={() => setActiveTab('trends')}
                    >
                        <i className="fas fa-chart-bar me-2"></i>Trends
                    </button>
                </li>
            </ul>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div>
                    {/* Library Health Cards */}
                    <div className="row mb-4">
                        <div className="col-md-2 col-6 mb-3">
                            <div className="card text-white bg-primary h-100">
                                <div className="card-body text-center">
                                    <h4>{formatNumber(library_health?.books_borrowed_today || 0)}</h4>
                                    <small>Borrowed Today</small>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-2 col-6 mb-3">
                            <div className="card text-white bg-success h-100">
                                <div className="card-body text-center">
                                    <h4>{formatNumber(library_health?.books_returned_today || 0)}</h4>
                                    <small>Returned Today</small>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-2 col-6 mb-3">
                            <div className="card text-white bg-danger h-100">
                                <div className="card-body text-center">
                                    <h4>{formatNumber(library_health?.overdue_books_count || 0)}</h4>
                                    <small>Overdue Books</small>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-2 col-6 mb-3">
                            <div className="card text-white bg-info h-100">
                                <div className="card-body text-center">
                                    <h4>{formatNumber(library_health?.active_users_today || 0)}</h4>
                                    <small>Active Users</small>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-2 col-6 mb-3">
                            <div className="card text-white bg-warning h-100">
                                <div className="card-body text-center">
                                    <h4>{formatNumber(library_health?.pending_qr_requests || 0)}</h4>
                                    <small>Pending QR</small>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-2 col-6 mb-3">
                            <div className="card text-white bg-secondary h-100">
                                <div className="card-body text-center">
                                    <h4>{formatCurrency(financial?.total_fines_collected || 0)}</h4>
                                    <small>Total Revenue</small>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="row">
                        <div className="col-md-6 mb-4">
                            <div className="card">
                                <div className="card-header">
                                    <h6 className="mb-0">
                                        <i className="fas fa-book me-2"></i>
                                        Top Borrowed Books
                                    </h6>
                                </div>
                                <div className="card-body">
                                    {popularity?.most_borrowed_books && popularity.most_borrowed_books.length > 0 ? (
                                        <div className="list-group list-group-flush">
                                            {popularity.most_borrowed_books.map((book, index) => (
                                                <div key={book.id || index} className="list-group-item d-flex justify-content-between align-items-center">
                                                    <div>
                                                        <span className="badge bg-primary me-2">{index + 1}</span>
                                                        {book.title || 'Unknown Book'}
                                                    </div>
                                                    <span className="badge bg-secondary">{book.borrow_count || 0} borrows</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-muted">No data available</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="col-md-6 mb-4">
                            <div className="card">
                                <div className="card-header">
                                    <h6 className="mb-0">
                                        <i className="fas fa-chart-pie me-2"></i>
                                        Popular Genres
                                    </h6>
                                </div>
                                <div className="card-body">
                                    {popularity?.popular_genres && popularity.popular_genres.length > 0 ? (
                                        <div className="list-group list-group-flush">
                                            {popularity.popular_genres.map((genre, index) => (
                                                <div key={index} className="list-group-item d-flex justify-content-between align-items-center">
                                                    <span>{genre.genre || 'Unknown Genre'}</span>
                                                    <span className="badge bg-info">{genre.borrow_count || 0} borrows</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-muted">No data available</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Financial Tab */}
            {activeTab === 'financial' && (
                <div className="row">
                    <div className="col-md-4 mb-4">
                        <div className="card text-white bg-success">
                            <div className="card-body text-center">
                                <h3>{formatCurrency(financial?.total_fines_collected || 0)}</h3>
                                <p>Total Fines Collected</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4 mb-4">
                        <div className="card text-white bg-warning">
                            <div className="card-body text-center">
                                <h3>{formatCurrency(financial?.outstanding_fines || 0)}</h3>
                                <p>Outstanding Fines</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4 mb-4">
                        <div className="card text-white bg-info">
                            <div className="card-body text-center">
                                <h3>{formatCurrency(financial?.fines_today || 0)}</h3>
                                <p>Fines Collected Today</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Trends Tab */}
            {activeTab === 'trends' && (
                <div className="row">
                    <div className="col-12 mb-4">
                        <div className="card">
                            <div className="card-header">
                                <h6 className="mb-0">
                                    <i className="fas fa-chart-line me-2"></i>
                                    Borrowing Trends (Last 7 Days)
                                </h6>
                            </div>
                            <div className="card-body">
                                {trends?.borrow_trend_7_days && trends.borrow_trend_7_days.length > 0 ? (
                                    <div className="table-responsive">
                                        <table className="table table-sm">
                                            <thead>
                                                <tr>
                                                    <th>Date</th>
                                                    <th>Books Borrowed</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {trends.borrow_trend_7_days.map((day, index) => (
                                                    <tr key={index}>
                                                        <td>{day.date || 'Unknown Date'}</td>
                                                        <td>
                                                            <span className="badge bg-primary">{day.borrows || 0}</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-muted">No trend data available</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Last Updated */}
            <div className="text-center text-muted mt-4">
                <small>
                    Last updated: {analytics?.last_updated ? new Date(analytics.last_updated).toLocaleString() : 'Never'}
                </small>
            </div>
        </div>
    );
};

export default AdminAnalytics;