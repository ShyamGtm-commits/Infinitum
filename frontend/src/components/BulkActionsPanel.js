import React, { useState } from 'react';

const BulkActionsPanel = ({ 
    selectedCount, 
    totalCount,
    onBulkAction,
    onSelectAll,
    onClearSelection 
}) => {
    const [action, setAction] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleBulkAction = async () => {
        if (!action || selectedCount === 0) return;
        
        setIsProcessing(true);
        try {
            await onBulkAction(action);
            setAction(''); // Reset selection after action
        } catch (error) {
            console.error('Bulk action failed:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const bulkActions = [
        {
            value: 'mark_read',
            label: 'Mark as Read',
            icon: 'fas fa-check',
            color: 'primary',
            description: 'Mark selected notifications as read'
        },
        {
            value: 'mark_unread',
            label: 'Mark as Unread', 
            icon: 'fas fa-envelope',
            color: 'secondary',
            description: 'Mark selected notifications as unread'
        },
        {
            value: 'delete',
            label: 'Delete',
            icon: 'fas fa-trash',
            color: 'danger',
            description: 'Permanently delete selected notifications'
        },
        {
            value: 'archive',
            label: 'Archive',
            icon: 'fas fa-archive',
            color: 'warning',
            description: 'Archive selected notifications'
        }
    ];

    if (selectedCount === 0) {
        return (
            <div className="card mb-3">
                <div className="card-body text-center text-muted">
                    <i className="fas fa-mouse-pointer fa-2x mb-2"></i>
                    <p className="mb-0">Select notifications to perform bulk actions</p>
                    <small>Click the checkboxes next to notifications to select them</small>
                </div>
            </div>
        );
    }

    return (
        <div className="card mb-3 border-primary">
            {/* Enhanced Header Section */}
            <div className="card-header bg-primary text-white">
                <div className="d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">
                        <i className="fas fa-tasks me-2"></i>
                        Bulk Actions
                        <span className="badge bg-light text-dark ms-2">
                            <i className="fas fa-check-circle me-1"></i>
                            {selectedCount} selected
                        </span>
                    </h6>
                    <div className="d-flex align-items-center">
                        <span className="badge bg-warning text-dark me-3">
                            <i className="fas fa-layer-group me-1"></i>
                            {selectedCount} of {totalCount}
                        </span>
                        <button
                            className="btn btn-sm btn-light"
                            onClick={onClearSelection}
                            disabled={isProcessing}
                        >
                            <i className="fas fa-times me-1"></i>
                            Clear All
                        </button>
                    </div>
                </div>
            </div>
            <div className="card-body">
                <div className="row align-items-center">
                    {/* Action Selection */}
                    <div className="col-md-4">
                        <label className="form-label fw-bold">Choose Action:</label>
                        <select 
                            className="form-select"
                            value={action}
                            onChange={(e) => setAction(e.target.value)}
                            disabled={isProcessing}
                        >
                            <option value="">Select an action...</option>
                            {bulkActions.map(bulkAction => (
                                <option key={bulkAction.value} value={bulkAction.value}>
                                    {bulkAction.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    {/* Action Description */}
                    <div className="col-md-4">
                        <div className="text-muted">
                            <small>
                                {action ? (
                                    bulkActions.find(a => a.value === action)?.description
                                ) : (
                                    "Choose an action to see description"
                                )}
                            </small>
                        </div>
                    </div>
                    
                    {/* Action Button */}
                    <div className="col-md-4">
                        <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                            <button
                                className="btn btn-primary"
                                onClick={handleBulkAction}
                                disabled={!action || isProcessing}
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="spinner-border spinner-border-sm me-2" role="status">
                                            <span className="visually-hidden">Processing...</span>
                                        </div>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-play me-2"></i>
                                        Apply to {selectedCount}
                                    </>
                                )}
                            </button>
                            
                            {/* Select All Button */}
                            {selectedCount < totalCount && (
                                <button
                                    className="btn btn-outline-secondary"
                                    onClick={onSelectAll}
                                    disabled={isProcessing}
                                >
                                    <i className="fas fa-check-double me-2"></i>
                                    Select All
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Quick Action Buttons */}
                <div className="mt-3 pt-3 border-top">
                    <small className="text-muted me-2">Quick actions:</small>
                    {bulkActions.map(bulkAction => (
                        <button
                            key={bulkAction.value}
                            className={`btn btn-sm btn-outline-${bulkAction.color} me-2 mb-1`}
                            onClick={() => {
                                setAction(bulkAction.value);
                                setTimeout(handleBulkAction, 100);
                            }}
                            disabled={isProcessing}
                            title={bulkAction.description}
                        >
                            <i className={`${bulkAction.icon} me-1`}></i>
                            {bulkAction.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BulkActionsPanel;