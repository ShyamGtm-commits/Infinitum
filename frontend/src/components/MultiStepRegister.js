// components/MultiStepRegister.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MultiStepRegister = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form data state
    const [formData, setFormData] = useState({
        // Step 1 Data
        user_type: 'student',
        first_name: '',
        last_name: '',
        college_id: '',
        roll_number: '',
        department: '',
        year_of_study: '',
        designation: '',
        phone: '',

        // Step 2 Data
        email: '',
        otp_code: '',

        // Step 3 Data
        password: '',
        confirm_password: ''
    });

    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear errors when user starts typing
        if (error) setError('');
    };

    // Step 1: Submit profile data and send OTP
    const handleStep1Submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:8000/api/register/start/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_type: formData.user_type,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    college_id: formData.college_id,
                    roll_number: formData.roll_number,
                    department: formData.department,
                    year_of_study: formData.year_of_study,
                    designation: formData.designation,
                    phone: formData.phone,
                    email: formData.email // Email from step 2
                })
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(data.success);
                setStep(3); // Move to OTP verification step
            } else {
                setError(data.error || data.errors ? JSON.stringify(data.errors) : 'Registration failed');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP
    const handleStep2Submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:8000/api/register/verify-otp/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email,
                    otp_code: formData.otp_code
                })
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(data.success);
                setStep(4); // Move to password creation step
            } else {
                setError(data.error || 'Verification failed');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Create password and complete registration
const handleStep3Submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirm_password) {
        setError('Passwords do not match');
        setLoading(false);
        return;
    }

    // Basic password validation
    if (formData.password.length < 8) {
        setError('Password must be at least 8 characters long');
        setLoading(false);
        return;
    }

    try {
        console.log('Sending registration completion request...');
        const response = await fetch('http://localhost:8000/api/register/complete/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: formData.email,
                password: formData.password
            })
        });

        const data = await response.json();
        console.log('Response received:', data);

        if (response.ok) {
            setSuccess('Registration completed successfully! Redirecting to login...');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } else {
            setError(data.error || 'Registration failed. Please try again.');
        }
    } catch (err) {
        console.error('Network error:', err);
        setError('Network error. Please check your connection and try again.');
    } finally {
        setLoading(false);
    }
};

    // Render different steps
    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="card">
                        <div className="card-header">
                            <h3>Step 1: Tell Us About Yourself</h3>
                        </div>
                        <div className="card-body">
                            <form onSubmit={(e) => e.preventDefault()}>
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label>Role *</label>
                                            <select
                                                name="user_type"
                                                value={formData.user_type}
                                                onChange={handleInputChange}
                                                className="form-control"
                                                required
                                            >
                                                <option value="student">Student</option>
                                                <option value="teacher">Teacher</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label>First Name *</label>
                                            <input
                                                type="text"
                                                name="first_name"
                                                value={formData.first_name}
                                                onChange={handleInputChange}
                                                className="form-control"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label>Last Name *</label>
                                            <input
                                                type="text"
                                                name="last_name"
                                                value={formData.last_name}
                                                onChange={handleInputChange}
                                                className="form-control"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {formData.user_type === 'student' && (
                                    <>
                                        <div className="row">
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label>College ID *</label>
                                                    <input
                                                        type="text"
                                                        name="college_id"
                                                        value={formData.college_id}
                                                        onChange={handleInputChange}
                                                        className="form-control"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label>Roll Number *</label>
                                                    <input
                                                        type="text"
                                                        name="roll_number"
                                                        value={formData.roll_number}
                                                        onChange={handleInputChange}
                                                        className="form-control"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {formData.user_type === 'teacher' && (
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="form-group">
                                                <label>College ID *</label>
                                                <input
                                                    type="text"
                                                    name="college_id"
                                                    value={formData.college_id}
                                                    onChange={handleInputChange}
                                                    className="form-control"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="form-group">
                                                <label>Designation</label>
                                                <input
                                                    type="text"
                                                    name="designation"
                                                    value={formData.designation}
                                                    onChange={handleInputChange}
                                                    className="form-control"
                                                    placeholder="e.g., Professor of Computer Science"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label>Department *</label>
                                            <input
                                                type="text"
                                                name="department"
                                                value={formData.department}
                                                onChange={handleInputChange}
                                                className="form-control"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label>
                                                {formData.user_type === 'student' ? 'Year of Study' : 'Phone Number'}
                                            </label>
                                            <input
                                                type={formData.user_type === 'student' ? 'number' : 'tel'}
                                                name={formData.user_type === 'student' ? 'year_of_study' : 'phone'}
                                                value={formData.user_type === 'student' ? formData.year_of_study : formData.phone}
                                                onChange={handleInputChange}
                                                className="form-control"
                                                placeholder={formData.user_type === 'student' ? 'e.g., 1, 2, 3, 4' : 'e.g., 9800000000'}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="row mt-3">
                                    <div className="col-12">
                                        <button
                                            type="button"
                                            onClick={() => setStep(2)}
                                            className="btn btn-primary"
                                        >
                                            Next →
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="card">
                        <div className="card-header">
                            <h3>Step 2: Verify Your Email</h3>
                        </div>
                        <div className="card-body">
                            <form onSubmit={(e) => e.preventDefault()}>
                                <div className="form-group">
                                    <label>Email Address *</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="form-control"
                                        placeholder="Enter your email address"
                                        required
                                    />
                                </div>

                                <div className="row mt-3">
                                    <div className="col-6">
                                        <button
                                            type="button"
                                            onClick={() => setStep(1)}
                                            className="btn btn-secondary"
                                        >
                                            ← Back
                                        </button>
                                    </div>
                                    <div className="col-6 text-end">
                                        <button
                                            type="button"
                                            onClick={handleStep1Submit}
                                            disabled={loading}
                                            className="btn btn-primary"
                                        >
                                            {loading ? 'Sending...' : 'Send Verification Code'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="card">
                        <div className="card-header">
                            <h3>Step 2: Enter Verification Code</h3>
                            <p className="mb-0">We sent a 6-digit code to {formData.email}</p>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleStep2Submit}>
                                <div className="form-group">
                                    <label>6-Digit Verification Code *</label>
                                    <input
                                        type="text"
                                        name="otp_code"
                                        value={formData.otp_code}
                                        onChange={handleInputChange}
                                        className="form-control"
                                        placeholder="Enter the code from your email"
                                        maxLength="6"
                                        required
                                    />
                                </div>

                                <div className="row mt-3">
                                    <div className="col-6">
                                        <button
                                            type="button"
                                            onClick={() => setStep(2)}
                                            className="btn btn-secondary"
                                        >
                                            ← Back
                                        </button>
                                    </div>
                                    <div className="col-6 text-end">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="btn btn-primary"
                                        >
                                            {loading ? 'Verifying...' : 'Verify Code'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                );

            case 4:
                return (
                    <div className="card">
                        <div className="card-header">
                            <h3>Step 3: Create Your Password</h3>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleStep3Submit}>
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label>Password *</label>
                                            <input
                                                type="password"
                                                name="password"
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                className="form-control"
                                                placeholder="Create a strong password"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label>Confirm Password *</label>
                                            <input
                                                type="password"
                                                name="confirm_password"
                                                value={formData.confirm_password}
                                                onChange={handleInputChange}
                                                className="form-control"
                                                placeholder="Confirm your password"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="row mt-3">
                                    <div className="col-6">
                                        <button
                                            type="button"
                                            onClick={() => setStep(3)}
                                            className="btn btn-secondary"
                                        >
                                            ← Back
                                        </button>
                                    </div>
                                    <div className="col-6 text-end">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="btn btn-success"
                                        >
                                            {loading ? 'Creating Account...' : 'Complete Registration'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="container mt-4">
            <div className="row justify-content-center">
                <div className="col-md-8">
                    <div className="text-center mb-4">
                        <h2>Join Infinitum Library</h2>
                        <p className="text-muted">Complete your registration in 3 simple steps</p>

                        {/* Progress Indicator */}
                        <div className="progress mb-3" style={{ height: '8px' }}>
                            <div
                                className="progress-bar"
                                role="progressbar"
                                style={{ width: `${(step / 4) * 100}%` }}
                                aria-valuenow={step}
                                aria-valuemin="1"
                                aria-valuemax="4"
                            ></div>
                        </div>

                        <small className="text-muted">Step {step} of 4</small>
                    </div>

                    {/* Error and Success Messages */}
                    {error && (
                        <div className="alert alert-danger alert-dismissible fade show" role="alert">
                            {error}
                            <button type="button" className="btn-close" onClick={() => setError('')}></button>
                        </div>
                    )}

                    {success && (
                        <div className="alert alert-success alert-dismissible fade show" role="alert">
                            {success}
                            <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
                        </div>
                    )}

                    {/* Render Current Step */}
                    {renderStep()}

                    <div className="text-center mt-3">
                        <p>Already have an account? <a href="/login">Login here</a></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MultiStepRegister;