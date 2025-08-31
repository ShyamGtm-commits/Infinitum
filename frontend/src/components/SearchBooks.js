
import React, { useState, useEffect } from 'react';
import GenreFilter from './GenreFilter';

const SearchBooks = ({ onSearchResults, showFilters = true }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        genre: '',
        author: '',
        year_from: '',
        year_to: '',
        available_only: false
    });
    const [genres, setGenres] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch available genres
    useEffect(() => {
        fetchGenres();
    }, []);

    const fetchGenres = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/books/');
            if (response.ok) {
                const data = await response.json();
                const uniqueGenres = [...new Set(data.map(book => book.genre))];
                setGenres(uniqueGenres);
            }
        } catch (error) {
            console.error('Error fetching genres:', error);
        }
    };

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);

        try {
            // Build query parameters
            const params = new URLSearchParams();
            if (searchQuery) params.append('q', searchQuery);
            if (filters.genre) params.append('genre', filters.genre);
            if (filters.author) params.append('author', filters.author);
            if (filters.year_from) params.append('year_from', filters.year_from);
            if (filters.year_to) params.append('year_to', filters.year_to);
            if (filters.available_only) params.append('available_only', 'true');

            const response = await fetch(`http://localhost:8000/api/books/search/?${params}`, {
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                onSearchResults(data);
            } else {
                console.error('Search failed');
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenreSelect = (genre) => {
        setFilters(prev => ({
            ...prev,
            genre: genre
        }));
        // Auto-search when genre is selected
        handleSearch();
    };

    const handleClearGenre = () => {
        setFilters(prev => ({
            ...prev,
            genre: ''
        }));
        // Auto-search when genre is cleared
        handleSearch();
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const clearFilters = () => {
        setSearchQuery('');
        setFilters({
            genre: '',
            author: '',
            year_from: '',
            year_to: '',
            available_only: false
        });
        // Trigger search with cleared filters
        handleSearch();
    };

    return (
        <div>
            {/* Genre Filter Component */}
            <GenreFilter
                genres={genres}
                selectedGenre={filters.genre}
                onGenreSelect={handleGenreSelect}
                onClearGenre={handleClearGenre}
            />

            {/* Main Search Card */}
            <div className="card mb-4">
                <div className="card-header">
                    <h5 className="mb-0">Search Books</h5>
                </div>
                <div className="card-body">
                    <form onSubmit={handleSearch}>
                        {/* Search Input */}
                        <div className="row mb-3">
                            <div className="col-md-8">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search by title, author, or description..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="col-md-4">
                                <button
                                    type="submit"
                                    className="btn btn-primary me-2"
                                    disabled={loading}
                                >
                                    {loading ? 'Searching...' : 'Search'}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={clearFilters}
                                >
                                    Clear All
                                </button>
                            </div>
                        </div>

                        {/* Advanced Filters */}
                        {showFilters && (
                            <div className="row">
                                <div className="col-md-4">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Filter by author"
                                        value={filters.author}
                                        onChange={(e) => handleFilterChange('author', e.target.value)}
                                    />
                                </div>

                                <div className="col-md-2">
                                    <input
                                        type="number"
                                        className="form-control"
                                        placeholder="Year from"
                                        value={filters.year_from}
                                        onChange={(e) => handleFilterChange('year_from', e.target.value)}
                                        min="1000"
                                        max="2030"
                                    />
                                </div>

                                <div className="col-md-2">
                                    <input
                                        type="number"
                                        className="form-control"
                                        placeholder="Year to"
                                        value={filters.year_to}
                                        onChange={(e) => handleFilterChange('year_to', e.target.value)}
                                        min="1000"
                                        max="2030"
                                    />
                                </div>

                                <div className="col-md-2">
                                    <div className="form-check">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            checked={filters.available_only}
                                            onChange={(e) => handleFilterChange('available_only', e.target.checked)}
                                            id="availableOnly"
                                        />
                                        <label className="form-check-label" htmlFor="availableOnly">
                                            Available only
                                        </label>
                                    </div>
                                </div>

                                <div className="col-md-2">
                                    <button
                                        type="button"
                                        className="btn btn-outline-primary btn-sm"
                                        onClick={handleSearch}
                                    >
                                        Apply Filters
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SearchBooks;