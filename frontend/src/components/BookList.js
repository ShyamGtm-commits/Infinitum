import React, { useState, useEffect } from 'react';
import SearchBooks from './SearchBooks';

const BookList = ({ user }) => {
    const [books, setBooks] = useState([]);
    const [filteredBooks, setFilteredBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchMode, setSearchMode] = useState(false);

    useEffect(() => {
        fetchBooks();
    }, []);

    const fetchBooks = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/books/', {
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch books');
            }

            const data = await response.json();
            setBooks(data);
            setFilteredBooks(data);
        } catch (error) {
            setError('Error loading books: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchResults = (results) => {
        setFilteredBooks(results);
        setSearchMode(true);
    };

   const handleBorrow = async (bookId) => {
  try {
    const response = await fetch(`http://localhost:8000/api/books/${bookId}/borrow/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      alert('Book borrowed successfully!');
      fetchBooks(); // Refresh the book list
    } else {
      const data = await response.json();
      alert(data.error || 'Failed to borrow book. Please try again.');
    }
  } catch (error) {
    console.error('Borrow error:', error);
    alert('Error borrowing book. Please try again.');
  }
};

    const clearSearch = () => {
        setFilteredBooks(books);
        setSearchMode(false);
    };

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
                    filteredBooks.map(book => (
                        <div key={book.id} className="col-md-4 mb-4">
                            <div className="card h-100 book-card">
                                {/* Book cover with transparency effect */}
                                <div 
                                    className="book-cover"
                                    style={{
                                        backgroundImage: book.cover_image_url ? `url(http://localhost:8000${book.cover_image_url})` : 'none',
                                        backgroundColor: book.cover_image_url ? 'transparent' : '#f8f9fa'
                                    }}
                                >
                                    {!book.cover_image_url && (
                                        <div className="book-placeholder">
                                            <i className="fas fa-book"></i>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="card-body">
                                    <h5 className="card-title">{book.title}</h5>
                                    <h6 className="card-subtitle mb-2 text-muted">{book.author}</h6>

                                    {/* Academic-specific metadata */}
                                    <div className="academic-metadata mb-2">
                                        <span className="badge bg-info">{book.genre}</span>
                                        {book.publication_year && (
                                            <span className="badge bg-secondary ms-1">{book.publication_year}</span>
                                        )}
                                        {book.isbn && (
                                            <small className="d-block text-muted mt-1">ISBN: {book.isbn}</small>
                                        )}
                                    </div>

                                    <p className="card-text">
                                        <strong>Available:</strong> {book.available_copies} of {book.total_copies}
                                    </p>
                                    {book.description && (
                                        <p className="card-text">
                                            <small>{book.description.substring(0, 100)}...</small>
                                        </p>
                                    )}
                                </div>
                                <div className="card-footer">
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => handleBorrow(book.id)}
                                        disabled={book.available_copies === 0}
                                    >
                                        {book.available_copies === 0 ? 'Out of Stock' : 'Borrow'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default BookList;