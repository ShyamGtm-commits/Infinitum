// Recommendations.js - Fixed infinite loop issue
import React, { useState, useEffect, useCallback } from 'react';
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

  // Wrap fetchBorrowedBooks in useCallback with empty dependencies
  const fetchBorrowedBooks = useCallback(async () => {
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
  }, []); // Empty dependencies - this function doesn't depend on any state

  // Wrap fetchRecommendations in useCallback with empty dependencies
  const fetchRecommendations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/recommendations/', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const data = await response.json();
      
      if (data.success) {
        // Don't filter here - let the frontend handle filtering
        setRecommendations(data.recommendations || []);
        setStrategy(data.strategy);
        setMessage(data.message);
      } else {
        setRecommendations(data.recommendations || []);
        setError(data.error || 'No recommendations available');
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setError('Error loading recommendations');
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependencies - this function doesn't depend on any state

  const fetchInsights = async () => {
    try {
        const response = await fetch('http://localhost:8000/api/recommendations/insights/', {
            credentials: 'include',
        });
        if (response.ok) {
            const data = await response.json();
            setInsights(data.user_insights);
        }
    } catch (error) {
        console.error('Error fetching insights:', error);
    }
  };
  useEffect(() => {
    // Initial data fetch - only run once on mount
    const loadData = async () => {
      await fetchBorrowedBooks();
      await fetchRecommendations();
      await fetchInsights();
    };
    
    loadData();
  }, [fetchBorrowedBooks, fetchRecommendations]); // These are now stable

  const handleBorrowClick = async (bookId) => {
    const result = await handleBorrow(bookId);
    
    if (result && result.success) {
      // Add to borrowed books set
      setBorrowedBookIds(prev => new Set([...prev, bookId]));
      
      // Also trigger refresh for other components if needed
      if (window.refreshTransactions) {
        window.refreshTransactions();
      }
      if (window.refreshBorrows) {
        window.refreshBorrows();
      }
    }
  };

  const handleConfirmBorrowClick = async () => {
    const result = await handleConfirmBorrow();
    
    if (result && result.success && confirmBorrow) {
      // Add to borrowed books set
      setBorrowedBookIds(prev => new Set([...prev, confirmBorrow.bookId]));
      
      // Also trigger refresh for other components if needed
      if (window.refreshTransactions) {
        window.refreshTransactions();
      }
      if (window.refreshBorrows) {
        window.refreshBorrows();
      }
    }
  };

  // Filter recommendations based on toggle and borrowed status
  const filteredRecommendations = recommendations.filter(book => 
    showBorrowedItems ? true : !borrowedBookIds.has(book.id)
  );

  // Group recommendations by strategy for better UI
  const groupRecommendationsByStrategy = (recs) => {
    const grouped = {
      personalized: [],
      collaborative: [],
      popular: []
    };

    recs.forEach(book => {
      // Simplified grouping logic
      if (book.genre && (book.genre.includes('Fiction') || book.genre.includes('Romance'))) {
        grouped.collaborative.push(book);
      } else if (book.borrow_count > 3) {
        grouped.popular.push(book);
      } else {
        grouped.personalized.push(book);
      }
    });

    return grouped;
  };

  const groupedRecommendations = groupRecommendationsByStrategy(filteredRecommendations);

  if (loading) {
    return (
      <div className="text-center mt-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p>Analyzing your reading preferences...</p>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4 recommendation-header">
        <div>
          <h2>Book Recommendations</h2>
          {message && (
            <p className="text-muted">
              <small>
                {message}
                <span className={`strategy-badge ${
                  strategy === 'context-based' ? 'badge-personalized' :
                  strategy === 'popular' ? 'badge-popular' :
                  'badge-fallback'
                }`}>
                  {strategy === 'context-based' ? 'Personalized' :
                   strategy === 'popular' ? 'Popular' :
                   'Fallback'}
                </span>
              </small>
            </p>
          )}
        </div>
        <div className="d-flex align-items-center">
          <div className="form-check form-switch me-3 recommendation-toggle">
            <input
              className="form-check-input"
              type="checkbox"
              id="showBorrowedToggle"
              checked={showBorrowedItems}
              onChange={() => setShowBorrowedItems(!showBorrowedItems)}
            />
            <label className="form-check-label toggle-label" htmlFor="showBorrowedToggle">
              Show Borrowed Items
            </label>
          </div>
          <button 
            className="btn btn-outline-primary refresh-btn"
            onClick={() => {
              fetchRecommendations();
              fetchBorrowedBooks();
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

      {error && (
        <div className="alert alert-warning">
          <i className="fas fa-info-circle me-2"></i>
          {error}
        </div>
      )}

      {filteredRecommendations.length === 0 ? (
        <div className="recommendations-empty">
          <i className="fas fa-book-open"></i>
          <h4>No recommendations available</h4>
          <p>Start borrowing books to get personalized recommendations!</p>
          <button className="btn btn-primary mt-2" onClick={() => window.location.href = '/books'}>
            Browse Books
          </button>
        </div>
      ) : (
        <>
          {/* Personalized Recommendations */}
          {groupedRecommendations.personalized.length > 0 && (
            <div className="recommendation-section mb-4">
              <h4 className="mb-3 text-primary">
                <i className="fas fa-heart me-2"></i>
                Personalized For You
              </h4>
              <div className="row">
                {groupedRecommendations.personalized.map(book => (
                  <BookCard 
                    key={book.id} 
                    book={book} 
                    borrowedBookIds={borrowedBookIds}
                    onBorrow={handleBorrowClick}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Collaborative Filtering Recommendations */}
          {groupedRecommendations.collaborative.length > 0 && (
            <div className="recommendation-section mb-4">
              <h4 className="mb-3 text-info">
                <i className="fas fa-users me-2"></i>
                Recommended by Similar Readers
              </h4>
              <div className="row">
                {groupedRecommendations.collaborative.map(book => (
                  <BookCard 
                    key={book.id} 
                    book={book} 
                    borrowedBookIds={borrowedBookIds}
                    onBorrow={handleBorrowClick}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Popular Recommendations */}
          {groupedRecommendations.popular.length > 0 && (
            <div className="recommendation-section mb-4">
              <h4 className="mb-3 text-warning">
                <i className="fas fa-fire me-2"></i>
                Popular Choices
              </h4>
              <div className="row">
                {groupedRecommendations.popular.map(book => (
                  <BookCard 
                    key={book.id} 
                    book={book} 
                    borrowedBookIds={borrowedBookIds}
                    onBorrow={handleBorrowClick}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="how-it-works">
            <h6>How recommendations work:</h6>
            <p className="text-muted small mb-0">
              Our system combines <strong>personalized suggestions</strong> based on your reading history, 
              <strong> collaborative filtering</strong> from similar readers, and <strong>popular choices</strong> 
              to bring you the best recommendations.
            </p>
          </div>
        </>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        show={showConfirmation}
        title="Confirm Borrow"
        message={confirmBorrow?.message}
        details={confirmBorrow?.bookDetails || {}}
        confirmText="Yes, Borrow Book"
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

// Separate BookCard component
const BookCard = ({ book, borrowedBookIds, onBorrow }) => {
  const isBorrowed = borrowedBookIds.has(book.id);
  
  return (
    <div className="col-md-4 mb-4">
      <div className={`card h-100 book-card ${isBorrowed ? 'borrowed' : ''}`}>
        <div 
          className="book-cover"
          style={{
            backgroundImage: book.cover_image_url ? `url(http://localhost:8000${book.cover_image_url})` : 'none',
            backgroundColor: book.cover_image_url ? 'transparent' : '#f8f9fa',
            height: '200px',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {!book.cover_image_url && (
            <div className="book-placeholder d-flex align-items-center justify-content-center h-100">
              <i className="fas fa-book fa-3x text-muted"></i>
            </div>
          )}
          {isBorrowed && (
            <span className="borrowed-badge">Already Borrowed</span>
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

          <p className="card-text">
            <strong>Available:</strong> {book.available_copies} of {book.total_copies}
          </p>
          
          {book.description && (
            <p className="card-text text-muted small">
              {book.description.substring(0, 100)}...
            </p>
          )}
        </div>
        
        <div className="card-footer bg-transparent">
          <button
            className={`btn ${isBorrowed ? 'btn-success' : 'btn-primary'} w-100`}
            onClick={() => onBorrow(book.id)}
            disabled={isBorrowed || book.available_copies === 0}
          >
            {isBorrowed ? 'Already Borrowed' : 
             book.available_copies === 0 ? 'Out of Stock' : 'Borrow Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Recommendations;