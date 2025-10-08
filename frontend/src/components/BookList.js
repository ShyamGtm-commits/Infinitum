import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBooks from './SearchBooks';



const BookList = ({ user }) => {
    const [books, setBooks] = useState([]);
    const [filteredBooks, setFilteredBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchMode, setSearchMode] = useState(false);
    const [transactions, setTransactions] = useState([]);
    const navigate = useNavigate();
    // Remove confirmBorrow, showConfirmation, showErrorModal, errorMessage states
    // since they're not needed in the gallery view

    useEffect(() => {
        fetchBooks();
        fetchUserTransactions();
    }, []);

    const fetchUserTransactions = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/user/transactions/', {
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                setTransactions(data);
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
    };

    const fetchBooks = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/books/', {
                credentials: 'include',
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setBooks(data);
            setFilteredBooks(data);
        } catch (error) {
            console.error('Fetch error:', error);
            setError('Error loading books: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchResults = (results) => {
        setFilteredBooks(results);
        setSearchMode(true);
    };

    const clearSearch = () => {
        setFilteredBooks(books);
        setSearchMode(false);
    };

    // Remove handleBorrow, handleConfirmBorrow functions since they're not needed here

    if (loading) return <div className="text-center mt-4">Loading books...</div>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    return (
        <div>
            <h2>Book Catalog</h2>
            <SearchBooks onSearchResults={handleSearchResults} />

            {searchMode && (
                <div className="alert alert-info d-flex justify-content-between align-items-center">
                    <span>
                        Showing {filteredBooks.length} result{filteredBooks.length !== 1 ? 's' : ''}
                    </span>
                    <button className="btn btn-sm btn-outline-secondary" onClick={clearSearch}>
                        Show All Books
                    </button>
                </div>
            )}

            <div className="row">
                {filteredBooks.length === 0 ? (
                    <div className="col-12">
                        <div className="alert alert-warning text-center">
                            {searchMode ? 'No books found matching your criteria.' : 'No books available in the library.'}
                        </div>
                    </div>
                ) : (
                    filteredBooks.map(book => {
                        const hasBorrowed = transactions.some(t =>
                            t.book.id === book.id && t.return_date === null
                        );

                        return (
                            <div key={book.id} className="col-xl-3 col-lg-4 col-md-6 col-sm-6 mb-4">
                                <div
                                    className="card h-100 book-card gallery-card"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => navigate(`/books/${book.id}`)}

                                >
                                    {/* Book Cover - Large and Prominent */}
                                    <div
                                        className="book-cover-gallery"
                                        style={{
                                            backgroundImage: book.cover_image_url
                                                ? `url(${book.cover_image_url})`
                                                : 'none',
                                            backgroundColor: book.cover_image_url ? 'transparent' : '#f8f9fa',
                                            height: '250px',
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center'
                                        }}
                                    >
                                        {!book.cover_image_url && (
                                            <div className="book-placeholder-gallery d-flex align-items-center justify-content-center h-100">
                                                <i className="fas fa-book fa-3x text-muted"></i>
                                            </div>
                                        )}
                                        {/* Availability Badge */}
                                        <div className="availability-badge">
                                            <span className={`badge ${hasBorrowed ? 'bg-success' : book.available_copies === 0 ? 'bg-danger' : 'bg-primary'}`}>
                                                {hasBorrowed ? 'Borrowed' : book.available_copies === 0 ? 'Out of Stock' : 'Available'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Book Title Only - Clean and Centered */}
                                    <div className="card-body text-center">
                                        <h6 className="card-title book-title-gallery">
                                            {book.title}
                                        </h6>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Remove ConfirmationModal and ErrorModal since they're not needed in gallery view */}
        </div>
    );
};

export default BookList;