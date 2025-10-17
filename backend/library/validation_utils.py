# library/validation_utils.py
import re
import logging
from django.core.exceptions import ValidationError

logger = logging.getLogger(__name__)

class InputValidator:
    """
    Utility for input validation and sanitization
    """
    
    @staticmethod
    def sanitize_string(value, max_length=255):
        """
        Basic string sanitization
        """
        if not value:
            return value
            
        # Remove potentially dangerous characters
        sanitized = re.sub(r'[<>{}]', '', str(value))
        
        # Limit length
        if len(sanitized) > max_length:
            sanitized = sanitized[:max_length]
            logger.warning(f"String truncated to {max_length} characters")
            
        return sanitized.strip()
    
    @staticmethod
    def validate_email(email):
        """
        Validate email format
        """
        if not email:
            raise ValidationError("Email is required")
            
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            raise ValidationError("Invalid email format")
            
        return email.lower()
    
    @staticmethod
    def validate_phone(phone):
        """
        Validate phone number (basic validation)
        """
        if not phone:
            return phone
            
        # Remove all non-digit characters
        digits = re.sub(r'\D', '', phone)
        
        # Basic length check
        if len(digits) < 10:
            raise ValidationError("Phone number must be at least 10 digits")
            
        return digits
    
    @staticmethod
    def validate_role(role):
        """
        Validate user role
        """
        valid_roles = ['student', 'teacher', 'librarian', 'admin']
        if role not in valid_roles:
            raise ValidationError(f"Role must be one of: {', '.join(valid_roles)}")
        return role
    
    @staticmethod
    def prevent_sql_injection(value):
        """
        Basic SQL injection prevention
        """
        if not value:
            return value
            
        dangerous_patterns = [
            r'(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC)\b)',
            r'(\-\-|\#|\/\*)',
            r'(\b(OR|AND)\b.*=)',
        ]
        
        for pattern in dangerous_patterns:
            if re.search(pattern, value, re.IGNORECASE):
                logger.warning(f"Potential SQL injection attempt detected: {value}")
                raise ValidationError("Invalid input detected")
                
        return value