// frontend/src/components/NotificationPreferences.js
import React, { useState, useEffect } from 'react';

const NotificationPreferences = () => {
    const [preferences, setPreferences] = useState({
        // NEW RESERVATION PREFERENCES
        email_reservation_confirmation: true,
        email_reservation_ready: true,
        email_reservation_expiring: true,
        email_pickup_reminder: true,
        push_reservation_confirmation: true,
        push_reservation_ready: true,
        push_reservation_expiring: true,
        push_pickup_reminder: true,
        
        // EXISTING PREFERENCES (keep as is)
        email_due_reminders: true,
        email_overdue_alerts: true,
        email_fine_notifications: true,
        email_achievements: true,
        email_book_available: true,
        push_due_reminders: true,
        push_overdue_alerts: true,
    });
    
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    // Load preferences on component mount
    useEffect(() => {
        fetchPreferences();
    }, []);

    const fetchPreferences = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:8000/api/notifications/preferences/', {
                credentials: 'include',
            });
            
            if (response.ok) {
                const data = await response.json();
                setPreferences(prev => ({
                    ...prev, // Keep our default structure
                    ...data  // Override with server data
                }));
            }
        } catch (error) {
            console.error('Error fetching preferences:', error);
        } finally {
            setLoading(false);
        }
    };

    const updatePreference = (key, value) => {
        setPreferences(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const savePreferences = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:8000/api/notifications/preferences/', {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(preferences)
            });
            
            if (response.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            }
        } catch (error) {
            console.error('Error saving preferences:', error);
        } finally {
            setLoading(false);
        }
    };

    // NEW: Preference toggle component for reusability
    const PreferenceToggle = ({ label, checked, onChange, type = 'email', description }) => (
        <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
            <div className="flex-grow-1">
                <label className="form-label mb-1 fw-medium">
                    {type === 'email' ? '📧' : '📱'} {label}
                </label>
                {description && (
                    <small className="text-muted d-block">{description}</small>
                )}
            </div>
            <div className="form-check form-switch">
                <input
                    className="form-check-input"
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    style={{ transform: 'scale(1.2)' }}
                />
            </div>
        </div>
    );

    if (loading && Object.keys(preferences).length === 0) {
        return (
            <div className="card">
                <div className="card-body text-center">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-header bg-light">
                <h5 className="mb-0">
                    <i className="fas fa-bell me-2"></i>
                    Notification Preferences
                </h5>
                <small className="text-muted">Control how and when you receive notifications</small>
            </div>
            
            <div className="card-body">
                {saved && (
                    <div className="alert alert-success alert-dismissible fade show">
                        <i className="fas fa-check-circle me-2"></i>
                        Preferences saved successfully!
                        <button 
                            type="button" 
                            className="btn-close" 
                            onClick={() => setSaved(false)}
                        ></button>
                    </div>
                )}

                {/* NEW: Reservation & Pickup Notifications Section */}
                <div className="preference-section mb-4">
                    <h6 className="border-bottom pb-2 mb-3">
                        <i className="fas fa-calendar-check me-2 text-primary"></i>
                        📋 Reservation & Pickup Notifications
                    </h6>
                    
                    <div className="row">
                        <div className="col-md-6">
                            <h6 className="text-muted mb-3">
                                <i className="fas fa-envelope me-1"></i> Email Notifications
                            </h6>
                            
                            <PreferenceToggle
                                label="Reservation Confirmations"
                                checked={preferences.email_reservation_confirmation}
                                onChange={(checked) => updatePreference('email_reservation_confirmation', checked)}
                                type="email"
                                description="When you successfully reserve a book"
                            />
                            
                            <PreferenceToggle
                                label="Reservation Ready Alerts"
                                checked={preferences.email_reservation_ready}
                                onChange={(checked) => updatePreference('email_reservation_ready', checked)}
                                type="email"
                                description="When your QR code is generated and ready"
                            />
                            
                            <PreferenceToggle
                                label="Reservation Expiry Warnings"
                                checked={preferences.email_reservation_expiring}
                                onChange={(checked) => updatePreference('email_reservation_expiring', checked)}
                                type="email"
                                description="When your reservation is about to expire"
                            />
                            
                            <PreferenceToggle
                                label="Pickup Reminders"
                                checked={preferences.email_pickup_reminder}
                                onChange={(checked) => updatePreference('email_pickup_reminder', checked)}
                                type="email"
                                description="Reminders to pick up your reserved books"
                            />
                        </div>
                        
                        <div className="col-md-6">
                            <h6 className="text-muted mb-3">
                                <i className="fas fa-mobile-alt me-1"></i> Push Notifications
                            </h6>
                            
                            <PreferenceToggle
                                label="Reservation Confirmations"
                                checked={preferences.push_reservation_confirmation}
                                onChange={(checked) => updatePreference('push_reservation_confirmation', checked)}
                                type="push"
                                description="When you successfully reserve a book"
                            />
                            
                            <PreferenceToggle
                                label="Reservation Ready Alerts"
                                checked={preferences.push_reservation_ready}
                                onChange={(checked) => updatePreference('push_reservation_ready', checked)}
                                type="push"
                                description="When your QR code is generated and ready"
                            />
                            
                            <PreferenceToggle
                                label="Reservation Expiry Warnings"
                                checked={preferences.push_reservation_expiring}
                                onChange={(checked) => updatePreference('push_reservation_expiring', checked)}
                                type="push"
                                description="When your reservation is about to expire"
                            />
                            
                            <PreferenceToggle
                                label="Pickup Reminders"
                                checked={preferences.push_pickup_reminder}
                                onChange={(checked) => updatePreference('push_pickup_reminder', checked)}
                                type="push"
                                description="Reminders to pick up your reserved books"
                            />
                        </div>
                    </div>
                </div>

                {/* EXISTING: Borrowing & System Notifications Section */}
                <div className="preference-section">
                    <h6 className="border-bottom pb-2 mb-3">
                        <i className="fas fa-book me-2 text-info"></i>
                        📚 Borrowing & System Notifications
                    </h6>
                    
                    <div className="row">
                        <div className="col-md-6">
                            <h6 className="text-muted mb-3">
                                <i className="fas fa-envelope me-1"></i> Email Notifications
                            </h6>
                            
                            <PreferenceToggle
                                label="Due Date Reminders"
                                checked={preferences.email_due_reminders}
                                onChange={(checked) => updatePreference('email_due_reminders', checked)}
                                type="email"
                                description="Before your books are due"
                            />
                            
                            <PreferenceToggle
                                label="Overdue Alerts"
                                checked={preferences.email_overdue_alerts}
                                onChange={(checked) => updatePreference('email_overdue_alerts', checked)}
                                type="email"
                                description="When books become overdue"
                            />
                            
                            <PreferenceToggle
                                label="Fine Notifications"
                                checked={preferences.email_fine_notifications}
                                onChange={(checked) => updatePreference('email_fine_notifications', checked)}
                                type="email"
                                description="When fines are applied to your account"
                            />
                            
                            <PreferenceToggle
                                label="Achievement Alerts"
                                checked={preferences.email_achievements}
                                onChange={(checked) => updatePreference('email_achievements', checked)}
                                type="email"
                                description="When you earn new achievements"
                            />
                            
                            <PreferenceToggle
                                label="Book Availability"
                                checked={preferences.email_book_available}
                                onChange={(checked) => updatePreference('email_book_available', checked)}
                                type="email"
                                description="When waitlisted books become available"
                            />
                        </div>
                        
                        <div className="col-md-6">
                            <h6 className="text-muted mb-3">
                                <i className="fas fa-mobile-alt me-1"></i> Push Notifications
                            </h6>
                            
                            <PreferenceToggle
                                label="Due Date Reminders"
                                checked={preferences.push_due_reminders}
                                onChange={(checked) => updatePreference('push_due_reminders', checked)}
                                type="push"
                                description="Before your books are due"
                            />
                            
                            <PreferenceToggle
                                label="Overdue Alerts"
                                checked={preferences.push_overdue_alerts}
                                onChange={(checked) => updatePreference('push_overdue_alerts', checked)}
                                type="push"
                                description="When books become overdue"
                            />
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="mt-4 pt-3 border-top">
                    <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                            <i className="fas fa-info-circle me-1"></i>
                            Changes are saved automatically to your account
                        </small>
                        <button
                            className="btn btn-primary"
                            onClick={savePreferences}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-save me-2"></i>
                                    Save Preferences
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationPreferences;