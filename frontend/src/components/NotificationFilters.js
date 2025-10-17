import React from 'react';

const NotificationFilters = ({ filters, onFiltersChange, notificationStats }) => {
    const handleFilterChange = (filterType, value) => {
        onFiltersChange({
            ...filters,
            [filterType]: value
        });
    };

    const resetFilters = () => {
        onFiltersChange({
            status: 'all',
            category: 'all',
            date_range: 'all'
        });
    };

    // Check if any filter is active
    const isFilterActive = filters.status !== 'all' || filters.category !== 'all' || filters.date_range !== 'all';

    return (
        <div className="card mb-4">
            <div className="card-header bg-light">
                <h5 className="mb-0">
                    <i className="fas fa-filter me-2"></i>
                    Filter Notifications
                    {isFilterActive && (
                        <span className="badge bg-primary ms-2">Filters Active</span>
                    )}
                </h5>
            </div>
            <div className="card-body">
                <div className="row g-3">
                    {/* Status Filter */}
                    <div className="col-md-3">
                        <label className="form-label fw-bold">
                            <i className="fas fa-eye me-1"></i>
                            Status
                        </label>
                        <select 
                            className="form-select"
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="unread">Unread Only</option>
                            <option value="read">Read Only</option>
                        </select>
                    </div>
                    
                    {/* Category Filter */}
                    <div className="col-md-3">
                        <label className="form-label fw-bold">
                            <i className="fas fa-tag me-1"></i>
                            Category
                        </label>
                        <select 
                            className="form-select"
                            value={filters.category}
                            onChange={(e) => handleFilterChange('category', e.target.value)}
                        >
                            <option value="all">All Categories</option>
                            <option value="system">System</option>
                            <option value="due_reminder">Due Reminders</option>
                            <option value="overdue">Overdue</option>
                            <option value="achievement">Achievements</option>
                            <option value="fine">Fines</option>
                            <option value="book_available">Book Available</option>
                        </select>
                    </div>
                    
                    {/* Date Range Filter */}
                    <div className="col-md-3">
                        <label className="form-label fw-bold">
                            <i className="fas fa-calendar me-1"></i>
                            Time Period
                        </label>
                        <select 
                            className="form-select"
                            value={filters.date_range}
                            onChange={(e) => handleFilterChange('date_range', e.target.value)}
                        >
                            <option value="all">All Time</option>
                            <option value="today">Today</option>
                            <option value="week">Past Week</option>
                            <option value="month">Past Month</option>
                        </select>
                    </div>
                    
                    {/* Actions */}
                    <div className="col-md-3 d-flex align-items-end">
                        <div className="w-100">
                            {isFilterActive ? (
                                <button 
                                    className="btn btn-outline-danger w-100"
                                    onClick={resetFilters}
                                >
                                    <i className="fas fa-times me-2"></i>
                                    Clear Filters
                                </button>
                            ) : (
                                <div className="text-center text-muted">
                                    <small>No filters active</small>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Filter Chips */}
                <div className="mt-3">
                    <small className="text-muted me-2">Quick filters:</small>
                    <button
                        className="btn btn-sm btn-outline-primary me-2 mb-1"
                        onClick={() => handleFilterChange('status', 'unread')}
                    >
                        <i className="fas fa-envelope me-1"></i>
                        Unread
                    </button>
                    <button
                        className="btn btn-sm btn-outline-warning me-2 mb-1"
                        onClick={() => handleFilterChange('category', 'due_reminder')}
                    >
                        <i className="fas fa-clock me-1"></i>
                        Due Soon
                    </button>
                    <button
                        className="btn btn-sm btn-outline-danger me-2 mb-1"
                        onClick={() => handleFilterChange('category', 'overdue')}
                    >
                        <i className="fas fa-exclamation-triangle me-1"></i>
                        Overdue
                    </button>
                    <button
                        className="btn btn-sm btn-outline-success me-2 mb-1"
                        onClick={() => handleFilterChange('category', 'achievement')}
                    >
                        <i className="fas fa-trophy me-1"></i>
                        Achievements
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotificationFilters;