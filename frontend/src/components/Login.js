// Login.js (Updated)
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Auth.css'; // We'll create this CSS file

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [csrfToken, setCsrfToken] = useState('');
    const [loading, setLoading] = useState(false);

    // Function to get CSRF token
    const getCsrfToken = () => {
        return document.cookie.split('; ')
            .find(row => row.startsWith('csrftoken='))
            ?.split('=')[1];
    };

    useEffect(() => {
        // Get CSRF token when component mounts
        const token = getCsrfToken();
        if (token) {
            setCsrfToken(token);
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('http://localhost:8000/api/login/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken,
                },
                credentials: 'include',
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                onLogin(data.user);
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (error) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo">
                        <i className="fas fa-book-open"></i>
                        <h2>Infinitum Library</h2>
                    </div>
                    <h3>Welcome Back</h3>
                    <p>Sign in to your account to continue</p>
                </div>
                
                <div className="auth-body">
                    {error && <div className="alert alert-danger">{error}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="username" className="form-label">Username</label>
                            <input
                                type="text"
                                className="form-control"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                placeholder="Enter your username"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="password" className="form-label">Password</label>
                            <input
                                type="password"
                                className="form-control"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="Enter your password"
                            />
                        </div>
                        <button 
                            type="submit" 
                            className="btn btn-primary w-100 auth-submit-btn"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Signing in...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>
                    
                    <div className="auth-footer">
                        <p className="text-center">
                            <Link to="/forgot-password" className="text-link">Forgot your password?</Link>
                        </p>
                    </div>
                </div>
            </div>
            
            <div className="auth-background">
                <div className="auth-background-overlay"></div>
            </div>
        </div>
    );
};

export default Login;