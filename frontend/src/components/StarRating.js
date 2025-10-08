import React, { useState, useEffect } from 'react';

const StarRating = ({ rating, onRatingChange, editable = true, size = 'lg' }) => {
    const [hoverRating, setHoverRating] = useState(0);
    
    const sizes = {
        sm: 'text-lg',
        md: 'text-xl',
        lg: 'text-2xl'
    };

    const handleClick = (value) => {
        if (editable && onRatingChange) {
            onRatingChange(value);
        }
    };

    const handleMouseEnter = (value) => {
        if (editable) {
            setHoverRating(value);
        }
    };

    const handleMouseLeave = () => {
        if (editable) {
            setHoverRating(0);
        }
    };

    return (
        <div className="star-rating">
            {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = (hoverRating || rating) >= star;
                return (
                    <span
                        key={star}
                        className={`${sizes[size]} ${
                            editable ? 'cursor-pointer' : 'cursor-default'
                        } ${
                            isFilled ? 'text-warning' : 'text-muted'
                        } transition-colors duration-200`}
                        onClick={() => handleClick(star)}
                        onMouseEnter={() => handleMouseEnter(star)}
                        onMouseLeave={handleMouseLeave}
                        title={editable ? `Rate ${star} star${star > 1 ? 's' : ''}` : `${rating} stars`}
                    >
                        {isFilled ? '★' : '☆'}
                    </span>
                );
            })}
            {rating > 0 && !editable && (
                <span className="text-muted ms-2">({rating.toFixed(1)})</span>
            )}
        </div>
    );
};

export default StarRating;