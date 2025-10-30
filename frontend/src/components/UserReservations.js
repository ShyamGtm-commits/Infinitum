import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const UserReservations = () => {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [userInteracted, setUserInteracted] = useState(false);
    const audioRef = useRef(null);
    const navigate = useNavigate();

    // Initialize audio after user interaction
    useEffect(() => {
        const handleUserInteraction = () => {
            if (!userInteracted) {
                setUserInteracted(true);
                console.log('🎵 User interacted - sound enabled on reservations page');

                // Initialize audio
                audioRef.current = new Audio('/notification-sound.mp3.mp3');
                audioRef.current.volume = 0.3;
                audioRef.current.preload = 'auto';

                // Remove event listeners
                document.removeEventListener('click', handleUserInteraction);
                document.removeEventListener('keydown', handleUserInteraction);
            }
        };

        document.addEventListener('click', handleUserInteraction);
        document.addEventListener('keydown', handleUserInteraction);

        return () => {
            document.removeEventListener('click', handleUserInteraction);
            document.removeEventListener('keydown', handleUserInteraction);
        };
    }, [userInteracted]);

    // Play success sound
    const playSuccessSound = async () => {
        if (!audioRef.current || !soundEnabled || !userInteracted) {
            console.log('🔇 Sound not available');
            return;
        }

        try {
            console.log('🔊 Playing success sound');
            audioRef.current.currentTime = 0;
            await audioRef.current.play();
        } catch (error) {
            console.log('❌ Sound play failed:', error.message);
        }
    };

    // Play error sound
    const playErrorSound = async () => {
        if (!soundEnabled || !userInteracted) return;

        try {
            const errorSound = new Audio('/notification-sound.mp3.mp3');
            errorSound.volume = 0.2;
            await errorSound.play();
        } catch (error) {
            console.log('Error sound failed:', error);
        }
    };

    // Test sound function
    const testSound = () => {
        if (!userInteracted) {
            alert('Please click anywhere on the page first to enable sounds');
            return;
        }
        playSuccessSound();
    };

    useEffect(() => {
        fetchReservations();
    }, []);

    const fetchReservations = async () => {
        try {
            setError(null);

            // ✅ CHANGE THIS LINE - use absolute URL
            const response = await fetch('http://localhost:8000/api/user/reservations/', {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setReservations(data);

        } catch (error) {
            console.error('Error fetching reservations:', error);
            setError('Failed to load reservations: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const cancelReservation = async (reservationId, bookTitle) => {
        if (!window.confirm(`Are you sure you want to cancel your reservation for "${bookTitle}"?`)) {
            return;
        }

        try {
            // ✅ Use absolute URL to Django backend
            const response = await fetch(`http://localhost:8000/api/reservations/${reservationId}/cancel/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCSRFToken(),
                },
                credentials: 'include'
            });

            console.log('🔍 Cancellation response status:', response.status);

            if (response.ok) {
                const result = await response.json();

                // ✅ PLAY SUCCESS SOUND
                playSuccessSound();

                alert('Reservation cancelled successfully!');
                fetchReservations(); // Refresh the list
            } else {
                // ✅ PLAY ERROR SOUND
                playErrorSound();

                // Handle different error cases
                if (response.status === 404) {
                    throw new Error('Cancellation endpoint not found. Please check the URL.');
                } else if (response.status === 403) {
                    throw new Error('You do not have permission to cancel this reservation.');
                } else {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to cancel reservation');
                }
            }
        } catch (error) {
            console.error('Error cancelling reservation:', error);
            alert(`Failed to cancel reservation: ${error.message}`);
        }
    };

    // Helper function to get CSRF token
    const getCSRFToken = () => {
        const name = 'csrftoken';
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    };

    if (loading) {
        return (
            <div className="container-fluid">
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Loading your reservations...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container-fluid">
                <div className="alert alert-danger">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    {error}
                    <button
                        className="btn btn-sm btn-outline-danger ms-3"
                        onClick={fetchReservations}
                    >
                        <i className="fas fa-redo me-1"></i>
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid">
            {/* Updated Header with Sound Controls */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="mb-1">
                        <i className="fas fa-clock me-2"></i>
                        My Reservations
                    </h2>
                    <p className="text-muted">Manage your pending book reservations</p>
                </div>

                <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-primary fs-6">
                        {reservations.length} Active
                    </span>

                    {/* Sound Controls */}
                    <div className="btn-group">
                        <button
                            className={`btn btn-sm ${soundEnabled ? 'btn-success' : 'btn-outline-secondary'}`}
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            title={soundEnabled ? "Disable sounds" : "Enable sounds"}
                        >
                            <i className={`fas ${soundEnabled ? 'fa-volume-up' : 'fa-volume-mute'}`}></i>
                        </button>

                        <button
                            className="btn btn-sm btn-outline-info"
                            onClick={testSound}
                            title="Test sound"
                            disabled={!userInteracted}
                        >
                            <i className="fas fa-music"></i>
                        </button>
                    </div>
                </div>
            </div>

            {reservations.length === 0 ? (
                <div className="card text-center">
                    <div className="card-body py-5">
                        <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                        <h5>No Active Reservations</h5>
                        <p className="text-muted">You don't have any pending book reservations.</p>
                        <button
                            className="btn btn-primary"
                            onClick={() => navigate('/books')}
                        >
                            <i className="fas fa-book me-1"></i>
                            Browse Books
                        </button>
                    </div>
                </div>
            ) : (
                <div className="row">
                    {reservations.map(reservation => (
                        <div key={reservation.id} className="col-md-6 col-lg-4 mb-3">
                            <div className={`card h-100 ${reservation.is_expired ? 'border-warning' : 'border-primary'}`}>
                                <div className="card-body">
                                    <div className="d-flex align-items-start">
                                        {reservation.book_cover ? (
                                            <img
                                                src={reservation.book_cover}
                                                alt={reservation.book_title}
                                                className="rounded me-3"
                                                style={{ width: '60px', height: '80px', objectFit: 'cover' }}
                                                onError={(e) => {
                                                    // If image fails to load, show placeholder
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div
                                            className={`rounded me-3 d-flex align-items-center justify-content-center bg-light ${reservation.book_cover ? 'd-none' : ''}`}
                                            style={{ width: '60px', height: '80px' }}
                                        >
                                            <i className="fas fa-book text-muted"></i>
                                        </div>
                                        <div className="flex-grow-1">
                                            <h6 className="card-title mb-1 text-truncate" title={reservation.book_title}>
                                                {reservation.book_title}
                                            </h6>
                                            <p className="card-text text-muted small mb-2">by {reservation.book_author}</p>

                                            <div className="d-flex justify-content-between align-items-center mt-3">
                                                <div>
                                                    {reservation.is_expired ? (
                                                        <span className="badge bg-warning text-dark">
                                                            <i className="fas fa-exclamation-triangle me-1"></i>
                                                            Expired
                                                        </span>
                                                    ) : (
                                                        <span className={`badge ${reservation.hours_remaining < 6 ? 'bg-warning' : 'bg-info'}`}>
                                                            <i className="fas fa-clock me-1"></i>
                                                            {reservation.hours_remaining}h left
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="btn-group btn-group-sm">
                                                    {reservation.qr_data && !reservation.is_expired && (
                                                        <button
                                                            className="btn btn-outline-primary"
                                                            onClick={() => {
                                                                // Show QR code
                                                                if (reservation.qr_data) {
                                                                    // Create a modal or new window with QR code
                                                                    const qrWindow = window.open('', '_blank');
                                                                    qrWindow.document.write(`
                                    <html>
                                      <head><title>QR Code - ${reservation.book_title}</title></head>
                                      <body style="text-align: center; padding: 20px;">
                                        <h2>${reservation.book_title}</h2>
                                        <p>Show this QR code to librarian</p>
                                        <img src="data:image/png;base64,${reservation.qr_data}" 
                                             style="max-width: 300px; border: 2px solid #333;" />
                                        <p><small>Expires in ${reservation.hours_remaining} hours</small></p>
                                        <button onclick="window.print()">Print QR</button>
                                        <button onclick="window.close()">Close</button>
                                      </body>
                                    </html>
                                  `);
                                                                } else {
                                                                    alert('QR code not available. Please generate a new one.');
                                                                }
                                                            }}
                                                        >
                                                            <i className="fas fa-qrcode me-1"></i>QR
                                                        </button>
                                                    )}
                                                    <button
                                                        className="btn btn-outline-danger"
                                                        onClick={() => cancelReservation(reservation.id, reservation.book_title)}
                                                        title="Cancel Reservation"
                                                    >
                                                        <i className="fas fa-times me-1"></i>Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="card-footer bg-transparent">
                                    <small className="text-muted">
                                        <i className="fas fa-calendar me-1"></i>
                                        Reserved {new Date(reservation.qr_generated_at).toLocaleDateString()}
                                    </small>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Sound Status Indicator (for debugging) */}
            {process.env.NODE_ENV === 'development' && (
                <div className="mt-3 text-center">
                    <small className="text-muted">
                        Sound Status: {userInteracted ? (soundEnabled ? '🔊 Enabled' : '🔇 Disabled') : '⏳ Click to enable'}
                    </small>
                </div>
            )}
        </div>
    );
};

export default UserReservations;