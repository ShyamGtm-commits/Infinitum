import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await fetch('http://localhost:8000/api/password-reset/request/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.success || 'Password reset email sent!');
                setEmail('');
            } else {
                setError(data.error || 'Failed to send reset email');
            }
        } catch (error) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <div className="card shadow">
                        <div className="card-header bg-primary text-white">
                            <h4 className="mb-0">
                                <i className="fas fa-key me-2"></i>
                                Forgot Your Password?
                            </h4>
                        </div>
                        <div className="card-body p-4">
                            {message && (
                                <div className="alert alert-success alert-dismissible fade show">
                                    {message}
                                    <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
                                </div>
                            )}

                            {error && (
                                <div className="alert alert-danger alert-dismissible fade show">
                                    {error}
                                    <button type="button" className="btn-close" onClick={() => setError('')}></button>
                                </div>
                            )}

                            <p className="text-muted mb-4">
                                Enter your email address and we'll send you a link to reset your password.
                            </p>

                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label htmlFor="email" className="form-label">
                                        <i className="fas fa-envelope me-2"></i>Email Address
                                    </label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your registered email"
                                        required
                                        disabled={loading}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary w-100 py-2"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            Sending Reset Link...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-paper-plane me-2"></i>
                                            Send Reset Link
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="text-center mt-3">
                                <Link to="/login" className="text-decoration-none">
                                    <i className="fas fa-arrow-left me-2"></i>
                                    Back to Login
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;