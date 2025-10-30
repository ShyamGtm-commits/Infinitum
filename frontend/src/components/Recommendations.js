// Recommendations.js - Complete with Fix 2 (Retry Mechanism)
import React, { useState, useEffect } from 'react';
import ConfirmationModal from './ConfirmationModal';
import ErrorModal from './ErrorModal';
import useBorrow from './useBorrow';

const Recommendations = ({ user }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [strategy, setStrategy] = useState('');
  const [message, setMessage] = useState('');
  const [showBorrowedItems, setShowBorrowedItems] = useState(false);
  const [borrowedBookIds, setBorrowedBookIds] = useState(new Set());
  const [insights, setInsights] = useState(null);
  const [showInsights, setShowInsights] = useState(false);

  // Use the borrow hook
  const {
    confirmBorrow,
    showConfirmation,
    showErrorModal,
    errorMessage,
    handleBorrow,
    handleConfirmBorrow,
    setShowConfirmation,
    setShowErrorModal
  } = useBorrow();

  // Fetch borrowed books
  const fetchBorrowedBooks = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/user/active-borrows/', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const borrowedIds = new Set(data.map(transaction => transaction.book.id));
        setBorrowedBookIds(borrowedIds);
      }
    } catch (error) {
      console.error('Error fetching borrowed books:', error);
    }
  };

  // Fetch recommendations
  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(''); // Clear previous errors
      const response = await fetch('http://localhost:8000/api/recommendations/', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations. Using popular books instead.');
      }

      const data = await response.json();
      
      if (data.success) {
        setRecommendations(data.recommendations || []);
        setStrategy(data.strategy);
        setMessage(data.message);
      } else {
        setRecommendations(data.recommendations || []);
        setError(data.error || 'No recommendations available. Showing popular books instead.');
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setError('Unable to load personalized recommendations. Showing popular books instead.');
    } finally {
      setLoading(false);
    }
  };

  // FIX 2: Retry Mechanism with Simple Recommendations
  const retryWithSimpleRecommendations = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('🔄 Trying simple popular books as fallback...');
      
      // Try the simple popular books endpoint as fallback
      const response = await fetch('http://localhost:8000/api/books/popular/', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const popularBooks = await response.json();
        setRecommendations(popularBooks);
        setStrategy('popular-fallback');
        setMessage('Showing popular books from our collection');
        console.log('✅ Loaded popular books successfully');
      } else {
        throw new Error('Could not load any books');
      }
    } catch (error) {
      console.error('❌ Simple recommendations also failed:', error);
      setError('Unable to load any books. Please try again later or contact support.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch insights function
  const fetchInsights = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/recommendations/insights/', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setInsights(data.user_insights);
        }
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      await fetchBorrowedBooks();
      await fetchRecommendations();
      await fetchInsights();
    };
    
    loadData();
  }, []);

  const handleBorrowClick = async (bookId) => {
    const result = await handleBorrow(bookId);
    
    if (result && result.success) {
      setBorrowedBookIds(prev => new Set([...prev, bookId]));
      await fetchBorrowedBooks();
    }
  };

  const handleConfirmBorrowClick = async () => {
    const result = await handleConfirmBorrow();
    
    if (result && result.success && confirmBorrow) {
      setBorrowedBookIds(prev => new Set([...prev, confirmBorrow.bookId]));
      await fetchBorrowedBooks();
    }
  };

  // Filter recommendations based on toggle and borrowed status
  const filteredRecommendations = recommendations.filter(book => 
    showBorrowedItems ? true : !borrowedBookIds.has(book.id)
  );

  // Enhanced Loading State
  if (loading && recommendations.length === 0) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" style={{width: '3rem', height: '3rem'}} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h4>Finding Your Next Favorite Book...</h4>
          <p className="text-muted">Analyzing your reading preferences and history</p>
          
          {/* Skeleton Loading Cards */}
          <div className="row">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="col-md-4 mb-4">
                <div className="card h-100">
                  {/* Skeleton Image */}
                  <div 
                    className="card-img-top bg-light placeholder-wave" 
                    style={{height: '200px'}}
                  ></div>
                  
                  <div className="card-body">
                    <div className="placeholder-glow">
                      {/* Skeleton Title */}
                      <span className="placeholder col-8 mb-2"></span>
                      {/* Skeleton Author */}
                      <span className="placeholder col-6 mb-2"></span>
                      {/* Skeleton Genre */}
                      <span className="placeholder col-4 mb-3"></span>
                      {/* Skeleton Description */}
                      <span className="placeholder col-12 mb-1"></span>
                      <span className="placeholder col-10 mb-1"></span>
                      <span className="placeholder col-11"></span>
                    </div>
                  </div>
                  
                  <div className="card-footer bg-transparent">
                    <div className="placeholder col-12" style={{height: '38px'}}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Insights Panel Component
  const InsightsPanel = () => {
    if (!insights) return null;

    return (
      <div className="card mb-4">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">
            <i className="fas fa-chart-bar me-2"></i>
            Your Reading Profile
          </h5>
        </div>
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-6">
              <h6>Reading Level</h6>
              <span className={`badge ${
                insights.reading_level === 'diverse-reader' ? 'bg-success' :
                insights.reading_level === 'genre-explorer' ? 'bg-warning' : 'bg-info'
              }`}>
                {insights.reading_level === 'diverse-reader' ? '📚 Diverse Reader' :
                 insights.reading_level === 'genre-explorer' ? '🔍 Genre Explorer' : '👋 New Reader'}
              </span>
            </div>
            <div className="col-md-6">
              <h6>Genres Explored</h6>
              <span className="badge bg-secondary">
                {insights.total_genres_explored} genres
              </span>
            </div>
          </div>

          {insights.top_genres && insights.top_genres.length > 0 && (
            <div className="mb-3">
              <h6>Your Favorite Genres</h6>
              <div className="d-flex flex-wrap gap-2">
                {insights.top_genres.map((genre, index) => (
                  <span key={index} className="badge bg-info text-dark">
                    {genre.name} ({Math.round(genre.score * 100)}%)
                  </span>
                ))}
              </div>
            </div>
          )}

          {insights.top_authors && insights.top_authors.length > 0 && (
            <div className="mb-3">
              <h6>Favorite Authors</h6>
              <div className="d-flex flex-wrap gap-2">
                {insights.top_authors.map((author, index) => (
                  <span key={index} className="badge bg-light text-dark border">
                    {author.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {insights.recent_interest_genres && insights.recent_interest_genres.length > 0 && (
            <div>
              <h6>Recent Interests</h6>
              <div className="d-flex flex-wrap gap-2">
                {insights.recent_interest_genres.map((genre, index) => (
                  <span key={index} className="badge bg-warning text-dark">
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="container mt-4">
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Book Recommendations</h2>
          {message && (
            <p className="text-muted">
              <small>{message}</small>
            </p>
          )}
        </div>
        <div className="d-flex align-items-center gap-3">
          {/* Insights Toggle Button */}
          {insights && (
            <button
              className={`btn ${showInsights ? 'btn-info' : 'btn-outline-info'}`}
              onClick={() => setShowInsights(!showInsights)}
            >
              <i className="fas fa-chart-bar me-2"></i>
              {showInsights ? 'Hide Insights' : 'Show Insights'}
            </button>
          )}
          
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              id="showBorrowedToggle"
              checked={showBorrowedItems}
              onChange={() => setShowBorrowedItems(!showBorrowedItems)}
            />
            <label className="form-check-label" htmlFor="showBorrowedToggle">
              Show Borrowed
            </label>
          </div>
          
          <button 
            className="btn btn-outline-primary"
            onClick={() => {
              fetchRecommendations();
              fetchBorrowedBooks();
              fetchInsights();
            }}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Refreshing...
              </>
            ) : (
              <>
                <i className="fas fa-sync-alt me-2"></i>
                Refresh
              </>
            )}
          </button>
        </div>
      </div>

      {/* FIX 2: Enhanced Error Handling with Retry Button */}
      {error && (
        <div className="alert alert-warning">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <i className="fas fa-exclamation-triangle me-2 fs-5"></i>
              <div>
                <strong>Having trouble loading recommendations</strong>
                <p className="mb-0 small">{error}</p>
              </div>
            </div>
            <button 
              className="btn btn-sm btn-outline-primary"
              onClick={retryWithSimpleRecommendations}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                  Loading...
                </>
              ) : (
                <>
                  <i className="fas fa-redo me-1"></i>
                  Try Again
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Insights Panel */}
      {showInsights && <InsightsPanel />}

      {/* Loading State for Refresh */}
      {loading && recommendations.length > 0 && (
        <div className="text-center mb-3">
          <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
            <span className="visually-hidden">Refreshing...</span>
          </div>
          <small className="text-muted">Updating recommendations...</small>
        </div>
      )}

      {/* Books Grid */}
      {filteredRecommendations.length === 0 ? (
        <div className="text-center py-5">
          <i className="fas fa-book-open fa-3x text-muted mb-3"></i>
          <h4 className="text-muted">No books available</h4>
          <p className="text-muted">
            {error ? 'Unable to load recommendations at this time.' : 'No books match your current filters.'}
          </p>
          <div className="d-flex justify-content-center gap-2">
            <button 
              className="btn btn-primary" 
              onClick={() => {
                setShowBorrowedItems(true);
                fetchRecommendations();
              }}
            >
              Show All Books
            </button>
            <button className="btn btn-outline-secondary" onClick={retryWithSimpleRecommendations}>
              Try Popular Books
            </button>
            <button className="btn btn-outline-secondary" onClick={() => window.location.href = '/books'}>
              Browse Library
            </button>
          </div>
        </div>
      ) : (
        <div className="row">
          {filteredRecommendations.map(book => (
            <BookCard 
              key={book.id} 
              book={book} 
              borrowedBookIds={borrowedBookIds}
              onBorrow={handleBorrowClick}
            />
          ))}
        </div>
      )}

      {/* How Recommendations Work Section */}
      <div className="card mt-4">
        <div className="card-body">
          <h5 className="card-title">
            <i className="fas fa-lightbulb me-2 text-warning"></i>
            How Recommendations Work
          </h5>
          <p className="card-text text-muted mb-0">
            {strategy === 'popular-fallback' ? 
              'Currently showing popular books from our collection. Personalized recommendations will be available once you start reading more books.' :
              strategy === 'context-based' ? 'These recommendations are personalized based on your reading patterns.' :
              strategy === 'popular' ? 'These are popular books loved by our community.' :
              strategy === 'enhanced-hybrid' ? 'We combine multiple methods to find the perfect books for you.' :
              'Our system analyzes your reading history, ratings, and preferences to suggest books you\'ll love.'
            }
            {error && ' Currently showing popular books due to technical issues.'}
          </p>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        show={showConfirmation}
        title="Confirm Reservation"
        message={confirmBorrow?.message}
        details={confirmBorrow?.bookDetails || {}}
        confirmText="Yes, Reserve Book"
        cancelText="Cancel"
        onConfirm={handleConfirmBorrowClick}
        onCancel={() => setShowConfirmation(false)}
      />

      {/* Error Modal */}
      <ErrorModal
        show={showErrorModal}
        message={errorMessage}
        onClose={() => setShowErrorModal(false)}
      />
    </div>
  );
};

// BookCard Component
const BookCard = ({ book, borrowedBookIds, onBorrow }) => {
  const isBorrowed = borrowedBookIds.has(book.id);
  const canReserve = book.can_be_reserved && book.effectively_available > 0;
  
  return (
    <div className="col-md-4 mb-4">
      <div className={`card h-100 ${isBorrowed ? 'border-success' : ''}`}>
        <div 
          className="book-cover"
          style={{
            backgroundImage: book.cover_image_url ? `url(${book.cover_image_url})` : 'none',
            backgroundColor: book.cover_image_url ? 'transparent' : '#f8f9fa',
            height: '200px',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {!book.cover_image_url && (
            <div className="d-flex align-items-center justify-content-center h-100">
              <i className="fas fa-book fa-3x text-muted"></i>
            </div>
          )}
          {isBorrowed && (
            <div className="position-absolute top-0 start-0 m-2">
              <span className="badge bg-success">Already Borrowed</span>
            </div>
          )}
          {book.average_rating > 0 && (
            <div className="position-absolute top-0 end-0 m-2">
              <span className="badge bg-warning text-dark">
                ⭐ {book.average_rating} ({book.rating_count})
              </span>
            </div>
          )}
        </div>
        
        <div className="card-body">
          <h5 className="card-title">{book.title}</h5>
          <h6 className="card-subtitle mb-2 text-muted">{book.author}</h6>
          
          <div className="mb-2">
            <span className="badge bg-info me-1">{book.genre}</span>
            {book.publication_year && (
              <span className="badge bg-secondary">{book.publication_year}</span>
            )}
          </div>

          {/* Reservation Status */}
          <div className="mb-2">
            <small className="text-muted">
              <strong>Available for reservation:</strong> {book.effectively_available} of {book.total_copies}
              {book.reserved_copies > 0 && (
                <span className="text-warning"> ({book.reserved_copies} reserved)</span>
              )}
            </small>
          </div>
          
          {book.description && (
            <p className="card-text text-muted small">
              {book.description.substring(0, 100)}...
            </p>
          )}
        </div>
        
        <div className="card-footer bg-transparent">
          <button
            className={`btn ${
              isBorrowed ? 'btn-success' : 
              canReserve ? 'btn-primary' : 'btn-secondary'
            } w-100`}
            onClick={() => onBorrow(book.id)}
            disabled={isBorrowed || !canReserve}
          >
            {isBorrowed ? '✓ Already Borrowed' : 
             canReserve ? 'Reserve for Pickup' : 
             'Not Available'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Recommendations;