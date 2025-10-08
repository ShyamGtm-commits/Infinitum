// useBorrow.js - Updated to handle the borrow flow better
import { useState } from 'react';

const useBorrow = () => {
    const [confirmBorrow, setConfirmBorrow] = useState(null);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleBorrow = async (bookId) => {
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
                return { success: true };
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
                return { success: true };
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

    return {
        confirmBorrow,
        showConfirmation,
        showErrorModal,
        errorMessage,
        handleBorrow,
        handleConfirmBorrow,
        setShowConfirmation,
        setShowErrorModal
    };
};

export default useBorrow;