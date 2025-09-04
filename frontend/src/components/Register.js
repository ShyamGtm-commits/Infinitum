import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        user_type: 'student'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Basic validation
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:8000/api/register/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    user_type: formData.user_type
                }),
            });

            const data = await response.json();

            if (response.ok) {
                alert('Registration successful! Please login.');
                navigate('/login');
            } else {
                setError(data.error || 'Registration failed');
            }
        } catch (error) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container register-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo">
                        <i className="fas fa-book-open"></i>
                        <h2>Infinitum Library</h2>
                    </div>
                    <h3>Create Your Account</h3>
                    <p>Join our community of readers and explorers</p>
                </div>
                
                <div className="auth-body">
                    {error && <div className="alert alert-danger">{error}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="username" className="form-label">Username *</label>
                            <input
                                type="text"
                                className="form-control"
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                required
                                placeholder="Choose a username"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email" className="form-label">Email Address</label>
                            <input
                                type="email"
                                className="form-control"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Enter your email"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="user_type" className="form-label">Account Type</label>
                            <select
                                className="form-control"
                                id="user_type"
                                name="user_type"
                                value={formData.user_type}
                                onChange={handleChange}
                            >
                                <option value="student">Student</option>
                                <option value="librarian">Librarian</option>
                            </select>
                        </div>

                        <div className="form-group password-toggle">
                            <label htmlFor="password" className="form-label">Password *</label>
                            <input
                                type={showPassword ? "text" : "password"}
                                className="form-control"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                placeholder="Create a password"
                            />
                            <span 
                                className="password-toggle-icon" 
                                onClick={togglePasswordVisibility}
                            >
                                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </span>
                        </div>

                        <div className="form-group password-toggle">
                            <label htmlFor="confirmPassword" className="form-label">Confirm Password *</label>
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                className="form-control"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                placeholder="Confirm your password"
                            />
                            <span 
                                className="password-toggle-icon" 
                                onClick={toggleConfirmPasswordVisibility}
                            >
                                <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </span>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-100 auth-submit-btn"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Creating Account...
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>
                    
                    <div className="auth-footer">
                        <p className="text-center">
                            Already have an account? <Link to="/login" className="text-link">Login here</Link>
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

export default Register;