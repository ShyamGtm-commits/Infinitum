// useBorrow.js - Enhanced version with accurate messaging and QR handling
import { useState } from 'react';

const useBorrow = () => {
    const [confirmBorrow, setConfirmBorrow] = useState(null);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [qrData, setQrData] = useState(null);
    const [showQRModal, setShowQRModal] = useState(false);
    const [waitlistInfo, setWaitlistInfo] = useState(null);

    const handleBorrow = async (bookId, bookTitle = '') => {
        try {
            const response = await fetch(`http://localhost:8000/api/books/${bookId}/borrow/`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({})
            });

            const data = await response.json();

            if (data.requires_confirmation) {
                setConfirmBorrow({
                    bookId: bookId,
                    bookTitle: bookTitle,
                    message: data.message,
                    bookDetails: data.book_details
                });
                setShowConfirmation(true);
                return { requiresAction: true };
            } else if (data.already_borrowed) {
                setErrorMessage(data.error);
                setShowErrorModal(true);
                return { error: data.error, alreadyBorrowed: true };
            } else if (data.error) {
                setErrorMessage(data.error);
                setShowErrorModal(true);
                return { error: data.error };
            } else if (data.success) {
                // Handle different success types with accurate messaging
                if (data.type === 'qr_pending') {  // CHANGED
                    return { 
                        success: true, 
                        message: '📋 Book reserved! Show QR code to librarian for pickup.',  // CHANGED
                        qrData: data.qr_data,
                        transactionId: data.transaction_id,
                        type: 'qr_pending'  // CHANGED
                    };
                } else if (data.type === 'waitlist') {
                    return { 
                        success: true, 
                        message: `📋 Added to waitlist! Position: #${data.waitlist_position}. Estimated wait: ${data.estimated_wait}`,
                        waitlistPosition: data.waitlist_position,
                        estimatedWait: data.estimated_wait,
                        type: 'waitlist'
                    };
                } else {
                    return { 
                        success: true, 
                        message: 'Book reserved for pickup!',  // CHANGED
                        type: 'direct'
                    };
                }
            }
        } catch (error) {
            setErrorMessage('Error borrowing book. Please try again.');
            setShowErrorModal(true);
            return { error: error.message };
        }
    };

    const handleConfirmBorrow = async () => {
        if (!confirmBorrow) return;
        
        try {
            const response = await fetch(`http://localhost:8000/api/books/${confirmBorrow.bookId}/borrow/`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ confirmation: true })
            });

            const data = await response.json();
            
            if (data.success) {
                // Handle post-confirmation success with accurate messaging
                if (data.type === 'qr_pending') {  // CHANGED
                    return { 
                        success: true, 
                        message: '📋 Book reserved! Show QR code to librarian for pickup.',  // CHANGED
                        qrData: data.qr_data,
                        transactionId: data.transaction_id,
                        type: 'qr_pending'  // CHANGED
                    };
                } else if (data.type === 'waitlist') {
                    return { 
                        success: true, 
                        message: `📋 Added to waitlist! Position: #${data.waitlist_position}. Estimated wait: ${data.estimated_wait}`,
                        waitlistPosition: data.waitlist_position,
                        estimatedWait: data.estimated_wait,
                        type: 'waitlist'
                    };
                } else {
                    return { 
                        success: true, 
                        message: 'Book reserved for pickup!',  // CHANGED
                        type: 'direct'
                    };
                }
            } else if (data.error) {
                setErrorMessage(data.error);
                setShowErrorModal(true);
                return { error: data.error };
            }
        } catch (error) {
            setErrorMessage('Error confirming borrow. Please try again.');
            setShowErrorModal(true);
            return { error: error.message };
        } finally {
            setShowConfirmation(false);
            setConfirmBorrow(null);
        }
    };

    const handleQRModalClose = () => {
        setShowQRModal(false);
        setQrData(null);
    };

    const showQRCode = (qrData) => {
        setQrData(qrData);
        setShowQRModal(true);
    };

    return {
        confirmBorrow,
        showConfirmation,
        showErrorModal,
        errorMessage,
        qrData,
        showQRModal,
        waitlistInfo,
        handleBorrow,
        handleConfirmBorrow,
        handleQRModalClose,
        showQRCode,
        setShowConfirmation,
        setShowErrorModal,
        setShowQRModal
    };
};

export default useBorrow;