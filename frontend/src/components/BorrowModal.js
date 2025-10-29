import React from 'react';

const BorrowModal = ({ show, message, details, onConfirm, onCancel }) => {
    if (!show) return null;

    return (
        <div className="modal" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000}}>
            <div className="modal-dialog" style={{maxWidth: '500px', margin: '100px auto'}}>
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">📱 Confirm Borrow Request</h5>
                        <button type="button" className="btn-close" onClick={onCancel}></button>
                    </div>
                    <div className="modal-body">
                        <p>{message}</p>
                        {details && (
                            <>
                                <div className="alert alert-info">
                                    <small>
                                        <strong>📋 What happens next:</strong><br/>
                                        • You'll get a QR code to show the librarian<br/>
                                        • Book will be issued after QR scan at library counter<br/>
                                        • Due date starts from issuance time
                                    </small>
                                </div>
                                <p><strong>📅 Expected Due Date:</strong> {details.due_date}</p>
                            </>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button 
                            className="btn btn-secondary" 
                            onClick={onCancel}
                        >
                            Cancel
                        </button>
                        <button 
                            className="btn btn-primary" 
                            onClick={onConfirm}
                        >
                            📱 Get QR Code
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BorrowModal;