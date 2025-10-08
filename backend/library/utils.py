# library/utils.py
import random
from django.core.mail import send_mail
from django.conf import settings

def generate_otp(length=6):
    """Generate a random numeric OTP of given length."""
    # Generate a random number with 'length' digits, ensuring it has leading zeros if needed.
    # random.randint(100000, 999999) only works for 6 digits.
    # This method works for any length.
    otp = ''.join([str(random.randint(0, 9)) for _ in range(length)])
    return otp

def send_otp_email(email, otp_code):
    """
    Sends an OTP code to the user's email address.
    Returns True if successful, False otherwise.
    """
    subject = 'Your Infinitum Library Verification Code'
    message = f'''
    Welcome to Infinitum Library!

    Your One-Time Password (OTP) for account verification is:

    {otp_code}

    This code will expire in 10 minutes.

    If you did not request this, please ignore this email.

    Happy Reading!
    The Infinitum Library Team
    '''
    from_email = settings.DEFAULT_FROM_EMAIL  # We'll set this in settings.py
    recipient_list = [email]

    try:
        # This is the core Django function for sending email
        send_mail(subject, message, from_email, recipient_list, fail_silently=False)
        print(f"OTP email sent successfully to {email}") # Good for debugging
        return True
    except Exception as e:
        # It's very important to catch errors here so our server doesn't crash
        # if there's an email configuration problem.
        print(f"Failed to send OTP email to {email}. Error: {str(e)}")
        return False