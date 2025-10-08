import React, { useState, useEffect } from 'react';

const NotificationPreferences = ({ user }) => {
    const [preferences, setPreferences] = useState({
        email_due_reminders: true,
        email_overdue_alerts: true,
        email_fine_notifications: true,
        email_achievements: true,
        email_book_available: true,
        push_due_reminders: true,
        push_overdue_alerts: true,
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchPreferences();
    }, []);

    const fetchPreferences = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/notifications/preferences/', {
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                setPreferences(data);
            }
        } catch (error) {
            console.error('Error fetching preferences:', error);
        }
    };

    const updatePreferences = async (updatedPrefs) => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/api/notifications/preferences/', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(updatedPrefs),
            });

            if (response.ok) {
                setMessage('Preferences updated successfully!');
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage('Error updating preferences');
            }
        } catch (error) {
            setMessage('Network error updating preferences');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (key) => {
        const updatedPrefs = {
            ...preferences,
            [key]: !preferences[key]
        };
        setPreferences(updatedPrefs);
        updatePreferences(updatedPrefs);
    };

    const resetToDefaults = () => {
        const defaults = {
            email_due_reminders: true,
            email_overdue_alerts: true,
            email_fine_notifications: true,
            email_achievements: true,
            email_book_available: true,
            push_due_reminders: true,
            push_overdue_alerts: true,
        };
        setPreferences(defaults);
        updatePreferences(defaults);
    };

    return (
        <div className="container mt-4">
            <div className="row justify-content-center">
                <div className="col-md-8">
                    <div className="card">
                        <div className="card-header bg-primary text-white">
                            <h4 className="mb-0">
                                <i className="fas fa-bell me-2"></i>
                                Notification Preferences
                            </h4>
                        </div>
                        <div className="card-body">
                            {message && (
                                <div className={`alert ${message.includes('Error') ? 'alert-danger' : 'alert-success'}`}>
                                    {message}
                                </div>
                            )}

                            <div className="mb-4">
                                <h5>Email Notifications</h5>
                                <p className="text-muted">Receive email alerts for important updates</p>
                                
                                <div className="list-group">
                                    {[
                                        { key: 'email_due_reminders', label: 'Due Date Reminders', description: 'Get reminders before books are due' },
                                        { key: 'email_overdue_alerts', label: 'Overdue Alerts', description: 'Notifications when books become overdue' },
                                        { key: 'email_fine_notifications', label: 'Fine Notifications', description: 'Alerts about fines and payments' },
                                        { key: 'email_achievements', label: 'Achievement Alerts', description: 'Notifications when you earn achievements' },
                                        { key: 'email_book_available', label: 'Book Availability', description: 'Alerts when requested books become available' },
                                    ].map(({ key, label, description }) => (
                                        <div key={key} className="list-group-item d-flex justify-content-between align-items-center">
                                            <div>
                                                <h6 className="mb-1">{label}</h6>
                                                <p className="mb-0 text-muted small">{description}</p>
                                            </div>
                                            <div className="form-check form-switch">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={preferences[key]}
                                                    onChange={() => handleToggle(key)}
                                                    disabled={loading}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-4">
                                <h5>Push Notifications</h5>
                                <p className="text-muted">In-app notifications while using the library</p>
                                
                                <div className="list-group">
                                    {[
                                        { key: 'push_due_reminders', label: 'Due Date Reminders', description: 'In-app reminders for due dates' },
                                        { key: 'push_overdue_alerts', label: 'Overdue Alerts', description: 'In-app notifications for overdue books' },
                                    ].map(({ key, label, description }) => (
                                        <div key={key} className="list-group-item d-flex justify-content-between align-items-center">
                                            <div>
                                                <h6 className="mb-1">{label}</h6>
                                                <p className="mb-0 text-muted small">{description}</p>
                                            </div>
                                            <div className="form-check form-switch">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={preferences[key]}
                                                    onChange={() => handleToggle(key)}
                                                    disabled={loading}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="text-center">
                                <button
                                    className="btn btn-outline-secondary"
                                    onClick={resetToDefaults}
                                    disabled={loading}
                                >
                                    <i className="fas fa-undo me-2"></i>
                                    Reset to Defaults
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationPreferences;