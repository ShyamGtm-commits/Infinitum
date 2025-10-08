import React, { useState, useEffect } from 'react';
import ReadingStats from './ReadingStats';
import ReadingGoals from './ReadingGoals';
import Achievements from './Achievements';

const ReadingDashboard = ({ user }) => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/dashboard/reading/', {
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                setDashboardData(data);
            } else {
                setError('Failed to load dashboard data');
            }
        } catch (error) {
            setError('Error loading reading dashboard');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGoal = async (goalData) => {
        try {
            const response = await fetch('http://localhost:8000/api/dashboard/goals/create/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(goalData),
            });

            if (response.ok) {
                // Refresh dashboard data to show new goal
                fetchDashboardData();
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to create goal');
            }
        } catch (error) {
            setError('Error creating reading goal');
        }
    };

    const handleRefreshAchievements = async () => {
        setRefreshing(true);
        try {
            const response = await fetch('http://localhost:8000/api/dashboard/achievements/check/', {
                method: 'POST',
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                if (data.new_achievements.length > 0) {
                    alert(`🎉 Congratulations! You earned: ${data.new_achievements.join(', ')}`);
                }
                // Refresh dashboard to show new achievements
                fetchDashboardData();
            }
        } catch (error) {
            console.error('Error checking achievements:', error);
        } finally {
            setRefreshing(false);
        }
    };

    if (loading) {
        return (
            <div className="container mt-4">
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading your reading journey...</span>
                    </div>
                    <p className="mt-2">Loading your reading journey...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mt-4">
                <div className="alert alert-danger">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    {error}
                </div>
            </div>
        );
    }

    if (!dashboardData) {
        return (
            <div className="container mt-4">
                <div className="alert alert-warning">
                    No reading data available yet. Start borrowing and reading books!
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            {/* Header */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h1 className="display-5 fw-bold text-primary">
                                <i className="fas fa-chart-line me-3"></i>
                                My Reading Dashboard
                            </h1>
                            <p className="lead text-muted">
                                Track your reading journey and achievements
                            </p>
                        </div>
                        <button
                            className="btn btn-outline-primary"
                            onClick={handleRefreshAchievements}
                            disabled={refreshing}
                        >
                            {refreshing ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                    Checking...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-sync-alt me-2"></i>
                                    Check Achievements
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="alert alert-danger alert-dismissible fade show">
                    {error}
                    <button type="button" className="btn-close" onClick={() => setError('')}></button>
                </div>
            )}

            {/* Reading Statistics */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-primary text-white">
                            <h5 className="mb-0">
                                <i className="fas fa-chart-bar me-2"></i>
                                Reading Statistics
                            </h5>
                        </div>
                        <div className="card-body">
                            <ReadingStats stats={dashboardData.reading_stats} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Goals and Achievements */}
            <div className="row">
                {/* Reading Goals */}
                <div className="col-lg-6 mb-4">
                    <ReadingGoals 
                        goals={dashboardData.active_goals} 
                        onCreateGoal={handleCreateGoal}
                    />
                </div>

                {/* Achievements */}
                <div className="col-lg-6 mb-4">
                    <Achievements 
                        achievements={dashboardData.achievements}
                        totalAchievements={dashboardData.total_achievements}
                    />
                </div>
            </div>

            {/* Reading History Chart */}
            {dashboardData.reading_history && dashboardData.reading_history.length > 0 && (
                <div className="row">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-transparent">
                                <h6 className="mb-0">
                                    <i className="fas fa-history me-2"></i>
                                    Reading History (Last 6 Months)
                                </h6>
                            </div>
                            <div className="card-body">
                                <div className="row text-center">
                                    {dashboardData.reading_history.map((month, index) => (
                                        <div key={index} className="col-md-2 col-4 mb-3">
                                            <div className="border rounded p-2">
                                                <div className="fw-bold text-primary fs-5">
                                                    {month.books_read}
                                                </div>
                                                <small className="text-muted">{month.month}</small>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {dashboardData.reading_stats.total_books_read === 0 && (
                <div className="text-center py-5">
                    <i className="fas fa-book-open fa-4x text-muted mb-3"></i>
                    <h4 className="text-muted">Start Your Reading Journey</h4>
                    <p className="text-muted">
                        You haven't read any books yet. Browse our collection and start reading to see your statistics here!
                    </p>
                    <a href="/books" className="btn btn-primary btn-lg">
                        <i className="fas fa-book me-2"></i>
                        Browse Books
                    </a>
                </div>
            )}
        </div>
    );
};

export default ReadingDashboard;