import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StarRating from './StarRating';

const PopularBooks = ({ user }) => {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({
        genre: '',
        minRating: 0,
        sortBy: 'popularity' // popularity, rating, newest
    });

    useEffect(() => {
        fetchPopularBooks();
    }, [filters]);

    const fetchPopularBooks = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/api/books/popular/', {
                credentials: 'include',
            });

            if (response.ok) {
                let data = await response.json();

                // Apply filters
                data = applyFilters(data);

                setBooks(data);
            } else {
                setError('Failed to load popular books');
            }
        } catch (error) {
            setError('Error loading popular books');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = (bookList) => {
        let filtered = [...bookList];

        // Filter by genre
        if (filters.genre) {
            filtered = filtered.filter(book => book.genre === filters.genre);
        }

        // Filter by minimum rating
        if (filters.minRating > 0) {
            filtered = filtered.filter(book => book.average_rating >= filters.minRating);
        }

        // Sort books
        switch (filters.sortBy) {
            case 'rating':
                filtered.sort((a, b) => b.average_rating - a.average_rating);
                break;
            case 'newest':
                filtered.sort((a, b) => new Date(b.publication_year) - new Date(a.publication_year));
                break;
            case 'popularity':
            default:
                // Sort by rating count first, then by average rating
                filtered.sort((a, b) => {
                    if (b.rating_count !== a.rating_count) {
                        return b.rating_count - a.rating_count;
                    }
                    return b.average_rating - a.average_rating;
                });
                break;
        }

        return filtered;
    };

    const handleFilterChange = (filterType, value) => {
        setFilters(prev => ({
            ...prev,
            [filterType]: value
        }));
    };

    const clearFilters = () => {
        setFilters({
            genre: '',
            minRating: 0,
            sortBy: 'popularity'
        });
    };

    // Available genres from your system
    const availableGenres = [
        'Fiction', 'Mystery/Thriller', 'Science Fiction', 'Fantasy', 'Romance',
        'Science', 'History', 'Biography/Autobiography', 'Technology & Computer Science',
        'Business & Economics', 'Philosophy', 'Arts & Architecture'
    ];

    if (loading) {
        return (
            <div className="container mt-4">
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading popular books...</span>
                    </div>
                    <p className="mt-2">Discovering the most loved books...</p>
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

    return (
        <div className="container mt-4">
            {/* Header Section */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h1 className="display-5 fw-bold text-primary">
                                <i className="fas fa-fire me-3"></i>
                                Popular Books
                            </h1>
                            <p className="lead text-muted">
                                Discover the most loved books in our library community
                            </p>
                        </div>
                        <div className="text-end">
                            <span className="badge bg-primary fs-6">
                                {books.length} {books.length === 1 ? 'Book' : 'Books'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters Section */}
            <div className="card mb-4">
                <div className="card-header bg-light">
                    <h5 className="mb-0">
                        <i className="fas fa-filter me-2"></i>
                        Filter & Sort
                    </h5>
                </div>
                <div className="card-body">
                    <div className="row g-3">
                        {/* Genre Filter */}
                        <div className="col-md-4">
                            <label className="form-label">Genre</label>
                            <select
                                className="form-select"
                                value={filters.genre}
                                onChange={(e) => handleFilterChange('genre', e.target.value)}
                            >
                                <option value="">All Genres</option>
                                {availableGenres.map(genre => (
                                    <option key={genre} value={genre}>{genre}</option>
                                ))}
                            </select>
                        </div>

                        {/* Rating Filter */}
                        <div className="col-md-3">
                            <label className="form-label">Minimum Rating</label>
                            <select
                                className="form-select"
                                value={filters.minRating}
                                onChange={(e) => handleFilterChange('minRating', parseFloat(e.target.value))}
                            >
                                <option value={0}>Any Rating</option>
                                <option value={4.5}>4.5+ Stars</option>
                                <option value={4.0}>4.0+ Stars</option>
                                <option value={3.5}>3.5+ Stars</option>
                                <option value={3.0}>3.0+ Stars</option>
                            </select>
                        </div>

                        {/* Sort Options */}
                        <div className="col-md-3">
                            <label className="form-label">Sort By</label>
                            <select
                                className="form-select"
                                value={filters.sortBy}
                                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                            >
                                <option value="popularity">Most Popular</option>
                                <option value="rating">Highest Rated</option>
                                <option value="newest">Newest First</option>
                            </select>
                        </div>

                        {/* Clear Filters */}
                        <div className="col-md-2 d-flex align-items-end">
                            <button
                                className="btn btn-outline-secondary w-100"
                                onClick={clearFilters}
                            >
                                <i className="fas fa-times me-1"></i>
                                Clear
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Books Grid */}
            {books.length === 0 ? (
                <div className="text-center py-5">
                    <i className="fas fa-book-open fa-4x text-muted mb-3"></i>
                    <h4 className="text-muted">No books match your filters</h4>
                    <p className="text-muted">Try adjusting your filters to see more books</p>
                    <button className="btn btn-primary" onClick={clearFilters}>
                        Clear All Filters
                    </button>
                </div>
            ) : (
                <div className="row">
                    {books.map(book => (
                        <div key={book.id} className="col-lg-4 col-md-6 mb-4">
                            <div className="card h-100 popular-book-card shadow-sm">
                                {/* Book Cover */}
                                {/* In PopularBooks.js - Replace the image section with this: */}
                                <div className="position-relative">
                                    {book.cover_image_url ? (
                                        <img
                                            src={book.cover_image_url.startsWith('http') ? book.cover_image_url : `http://localhost:8000${book.cover_image_url}`}
                                            className="card-img-top"
                                            alt={book.title}
                                            style={{ height: '250px', objectFit: 'cover' }}
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'flex';
                                            }}
                                        />
                                    ) : null}

                                    {/* Fallback when no image or image fails to load */}
                                    <div
                                        className="card-img-top bg-light d-flex align-items-center justify-content-center"
                                        style={{
                                            height: '250px',
                                            display: book.cover_image_url ? 'none' : 'flex'
                                        }}
                                    >
                                        <i className="fas fa-book fa-3x text-muted"></i>
                                    </div>

                                    {/* Rating Badge */}
                                    <div className="position-absolute top-0 end-0 m-2">
                                        <span className="badge bg-warning text-dark fs-6">
                                            <i className="fas fa-star me-1"></i>
                                            {book.average_rating > 0 ? book.average_rating.toFixed(1) : 'NR'}
                                        </span>
                                    </div>
                                </div>

                                <div className="card-body d-flex flex-column">
                                    {/* Book Title & Author */}
                                    <h5 className="card-title text-truncate" title={book.title}>
                                        {book.title}
                                    </h5>
                                    <p className="card-text text-muted mb-2">
                                        by {book.author}
                                    </p>

                                    {/* Genre Badge */}
                                    <div className="mb-2">
                                        <span className="badge bg-info text-dark">{book.genre}</span>
                                    </div>

                                    {/* Rating Display */}
                                    <div className="mb-3">
                                        <StarRating
                                            rating={book.average_rating}
                                            editable={false}
                                            size="sm"
                                        />
                                        <small className="text-muted ms-2">
                                            ({book.rating_count} rating{book.rating_count !== 1 ? 's' : ''})
                                        </small>
                                    </div>

                                    {/* Book Details */}
                                    <div className="mt-auto">
                                        <div className="row text-center text-muted small mb-3">
                                            <div className="col-4">
                                                <div>
                                                    <i className="fas fa-calendar me-1"></i>
                                                    {book.publication_year || 'N/A'}
                                                </div>
                                            </div>
                                            <div className="col-4">
                                                <div>
                                                    <i className="fas fa-copy me-1"></i>
                                                    {book.available_copies}/{book.total_copies}
                                                </div>
                                            </div>
                                            <div className="col-4">
                                                <div>
                                                    <i className="fas fa-users me-1"></i>
                                                    {book.rating_count}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="d-grid gap-2">
                                            <Link
                                                to={`/books/${book.id}`}
                                                className="btn btn-primary btn-sm"
                                            >
                                                <i className="fas fa-eye me-1"></i>
                                                View Details
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Statistics Footer */}
            {books.length > 0 && (
                <div className="row mt-5">
                    <div className="col-12">
                        <div className="card bg-light">
                            <div className="card-body text-center">
                                <h5 className="card-title">Community Insights</h5>
                                <div className="row">
                                    <div className="col-md-3">
                                        <div className="fs-3 text-primary fw-bold">
                                            {books.length}
                                        </div>
                                        <small className="text-muted">Featured Books</small>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="fs-3 text-warning fw-bold">
                                            {Math.max(...books.map(b => b.average_rating)).toFixed(1)}
                                        </div>
                                        <small className="text-muted">Highest Rating</small>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="fs-3 text-success fw-bold">
                                            {books.reduce((sum, book) => sum + book.rating_count, 0)}
                                        </div>
                                        <small className="text-muted">Total Ratings</small>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="fs-3 text-info fw-bold">
                                            {new Set(books.map(b => b.genre)).size}
                                        </div>
                                        <small className="text-muted">Genres Covered</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PopularBooks;