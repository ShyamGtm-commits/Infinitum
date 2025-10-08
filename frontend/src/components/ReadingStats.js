import React from 'react';

const ReadingStats = ({ stats }) => {
    if (!stats) return null;

    return (
        <div className="row">
            {/* Total Books Read */}
            <div className="col-md-3 col-6 mb-3">
                <div className="card text-center h-100 border-0 shadow-sm">
                    <div className="card-body">
                        <div className="text-primary mb-2">
                            <i className="fas fa-book fa-2x"></i>
                        </div>
                        <h3 className="card-title text-dark">{stats.total_books_read || 0}</h3>
                        <p className="card-text text-muted small">Books Read</p>
                    </div>
                </div>
            </div>

            {/* Pages Read */}
            <div className="col-md-3 col-6 mb-3">
                <div className="card text-center h-100 border-0 shadow-sm">
                    <div className="card-body">
                        <div className="text-success mb-2">
                            <i className="fas fa-file-alt fa-2x"></i>
                        </div>
                        <h3 className="card-title text-dark">
                            {(stats.estimated_pages_read || 0).toLocaleString()}
                        </h3>
                        <p className="card-text text-muted small">Pages Read</p>
                    </div>
                </div>
            </div>

            {/* Reading Streak */}
            <div className="col-md-3 col-6 mb-3">
                <div className="card text-center h-100 border-0 shadow-sm">
                    <div className="card-body">
                        <div className="text-warning mb-2">
                            <i className="fas fa-fire fa-2x"></i>
                        </div>
                        <h3 className="card-title text-dark">{stats.current_streak || 0}</h3>
                        <p className="card-text text-muted small">Day Streak</p>
                    </div>
                </div>
            </div>

            {/* Monthly Pace */}
            <div className="col-md-3 col-6 mb-3">
                <div className="card text-center h-100 border-0 shadow-sm">
                    <div className="card-body">
                        <div className="text-info mb-2">
                            <i className="fas fa-tachometer-alt fa-2x"></i>
                        </div>
                        <h3 className="card-title text-dark">{stats.monthly_pace || 0}</h3>
                        <p className="card-text text-muted small">Books/Month</p>
                    </div>
                </div>
            </div>

            {/* Favorite Genres */}
            {stats.favorite_genres && stats.favorite_genres.length > 0 && (
                <div className="col-12 mt-3">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-transparent">
                            <h6 className="mb-0">
                                <i className="fas fa-heart text-danger me-2"></i>
                                Favorite Genres
                            </h6>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                {stats.favorite_genres.slice(0, 3).map((genre, index) => (
                                    <div key={genre.book__genre} className="col-md-4 mb-2">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <span className="badge bg-light text-dark fs-6">
                                                {genre.book__genre}
                                            </span>
                                            <small className="text-muted">
                                                {genre.count} book{genre.count !== 1 ? 's' : ''}
                                            </small>
                                        </div>
                                        {index < 2 && <hr className="my-2" />}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReadingStats;