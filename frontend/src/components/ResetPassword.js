import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [token, setToken] = useState('');
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [tokenValid, setTokenValid] = useState(false);

    useEffect(() => {
        const urlToken = searchParams.get('token');
        if (urlToken) {
            setToken(urlToken);
            verifyToken(urlToken);
        }
    }, [searchParams]);

    const verifyToken = async (tokenToVerify) => {
        try {
            const response = await fetch('http://localhost:8000/api/password-reset/verify-token/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: tokenToVerify }),
            });

            const data = await response.json();

            if (response.ok && data.valid) {
                setTokenValid(true);
                setEmail(data.email);
            } else {
                setError(data.error || 'Invalid or expired reset link');
                setTokenValid(false);
            }
        } catch (error) {
            setError('Failed to verify reset link');
            setTokenValid(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters long');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:8000/api/password-reset/complete/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: token,
                    new_password: newPassword
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.success || 'Password reset successfully!');
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } else {
                setError(data.error || 'Failed to reset password');
            }
        } catch (error) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="container mt-5">
                <div className="alert alert-danger">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    Invalid reset link. Please check the link and try again.
                </div>
            </div>
        );
    }

    if (!tokenValid && error) {
        return (
            <div className="container mt-5">
                <div className="alert alert-danger">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    {error}
                </div>
                <div className="text-center">
                    <button className="btn btn-primary" onClick={() => navigate('/forgot-password')}>
                        Request New Reset Link
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <div className="card shadow">
                        <div className="card-header bg-success text-white">
                            <h4 className="mb-0">
                                <i className="fas fa-lock me-2"></i>
                                Reset Your Password
                            </h4>
                        </div>
                        <div className="card-body p-4">
                            {message && (
                                <div className="alert alert-success">
                                    <i className="fas fa-check-circle me-2"></i>
                                    {message}
                                    <br />
                                    <small>Redirecting to login page...</small>
                                </div>
                            )}

                            {error && (
                                <div className="alert alert-danger">
                                    <i className="fas fa-exclamation-triangle me-2"></i>
                                    {error}
                                </div>
                            )}

                            {tokenValid && !message && (
                                <>
                                    <p className="text-muted">
                                        <i className="fas fa-user me-2"></i>
                                        Resetting password for: <strong>{email}</strong>
                                    </p>

                                    <form onSubmit={handleSubmit}>
                                        <div className="mb-3">
                                            <label htmlFor="newPassword" className="form-label">
                                                New Password
                                            </label>
                                            <input
                                                type="password"
                                                className="form-control"
                                                id="newPassword"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="Enter new password"
                                                required
                                                minLength="8"
                                                disabled={loading}
                                            />
                                            <small className="form-text text-muted">
                                                Must be at least 8 characters long
                                            </small>
                                        </div>

                                        <div className="mb-3">
                                            <label htmlFor="confirmPassword" className="form-label">
                                                Confirm New Password
                                            </label>
                                            <input
                                                type="password"
                                                className="form-control"
                                                id="confirmPassword"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="Confirm new password"
                                                required
                                                disabled={loading}
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            className="btn btn-success w-100 py-2"
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                                    Resetting Password...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fas fa-lock me-2"></i>
                                                    Reset Password
                                                </>
                                            )}
                                        </button>
                                    </form>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;