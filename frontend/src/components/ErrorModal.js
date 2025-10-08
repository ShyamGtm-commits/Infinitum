// components/ErrorModal.js
import React from 'react';

const ErrorModal = ({ show, message, onClose }) => {
    if (!show) return null;

    return (
        <div className="modal" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000}}>
            <div className="modal-dialog" style={{maxWidth: '500px', margin: '100px auto'}}>
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">⚠️ Notice</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        <p>{message}</p>
                    </div>
                    <div className="modal-footer">
                        <button 
                            className="btn btn-primary" 
                            onClick={onClose}
                        >
                            OK
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ErrorModal;