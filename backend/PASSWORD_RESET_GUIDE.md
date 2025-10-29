# Password Reset System Documentation

## Overview
A comprehensive password reset system has been implemented with secure OTP-based verification. The system follows industry best practices for security and user experience.

## System Flow

### 1. Request Password Reset
- **Frontend**: User enters email on forgot password page
- **Backend**: Validates email format and checks if user exists
- **Security**: Doesn't reveal if email exists for security reasons
- **Email**: Sends OTP with professional HTML template

### 2. Verify OTP
- **Frontend**: User enters 6-digit OTP
- **Backend**: Validates OTP against database (keeps OTP active for password reset)
- **Security**: Rate limiting on attempts, OTP expiration

### 3. Reset Password
- **Frontend**: User enters new password and confirmation
- **Backend**: Validates OTP again and updates password
- **Security**: Transaction-based update with rollback capability

## API Endpoints

### POST `/api/auth/request-password-reset`
**Purpose**: Request a password reset OTP
**Request Body**:
```json
{
  "email": "user@example.com"
}
```
**Response**:
```json
{
  "success": true,
  "message": "If the email is registered, you will receive a password reset code",
  "resendCooldownSeconds": 60
}
```

### POST `/api/auth/verify-password-reset-otp`
**Purpose**: Verify the OTP for password reset
**Request Body**:
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```
**Response**:
```json
{
  "success": true,
  "message": "Reset code verified successfully"
}
```

### POST `/api/auth/reset-password`
**Purpose**: Reset the user's password
**Request Body**:
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "newSecurePassword123"
}
```
**Response**:
```json
{
  "success": true,
  "message": "Password has been reset successfully. You can now login with your new password.",
  "redirect": "/login"
}
```

## Security Features

### 1. Rate Limiting
- OTP requests are rate-limited using the existing rate limiter middleware
- Prevents spam and brute force attacks

### 2. OTP Security
- OTPs are hashed using bcrypt before storage
- OTPs expire after 5 minutes (configurable)
- Maximum 5 verification attempts before OTP is invalidated
- OTPs are single-use (marked as used after password reset completion)

### 3. Email Security
- Professional HTML email template with clear instructions
- Doesn't reveal user existence for unregistered emails
- Clear expiration time and security warnings

### 4. Password Validation
- Minimum 8 characters required
- Uses bcrypt for password hashing (12 rounds)
- Transaction-based password updates with rollback

### 5. Input Validation
- Email format validation
- OTP format validation (6 digits)
- Password strength validation
- SQL injection protection via parameterized queries

## Frontend Features

### 1. Multi-Step Process
- **Step 1**: Email input with validation
- **Step 2**: OTP verification with resend functionality
- **Step 3**: New password input with confirmation

### 2. User Experience
- Loading states on all buttons
- Real-time form validation
- Success/error toast notifications
- Resend OTP with cooldown timer
- Clear navigation between steps

### 3. Error Handling
- Network error handling
- Server error handling
- User-friendly error messages
- Graceful fallbacks

## Database Schema

The system uses the existing `otp_verifications` table:
```sql
CREATE TABLE otp_verifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  otp_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  attempts INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  used BOOLEAN DEFAULT FALSE,
  INDEX idx_email_created (email, created_at)
);
```

## Configuration

Environment variables (in `.env`):
```env
OTP_EXPIRY_MINUTES=5
OTP_RESEND_COOLDOWN_SECONDS=60
MAX_OTP_VERIFY_ATTEMPTS=5
BCRYPT_SALT_ROUNDS=12
```

## Testing the System

### 1. Start the Backend
```bash
cd backend
node server.js
```

### 2. Start the Frontend
```bash
npm run dev
```

### 3. Test Flow
1. Go to `/login` and click "Forgot Password?"
2. Enter a registered email address
3. Check email for OTP
4. Enter OTP in the verification step
5. Set new password
6. Login with new password

## Error Scenarios Handled

### 1. Email Not Found
- Returns success message without revealing user existence
- No OTP is sent
- User sees generic success message

### 2. Invalid OTP
- Increments attempt counter
- Shows remaining attempts
- Blocks after maximum attempts

### 3. Expired OTP
- Shows "Invalid or expired reset code" message
- User must request new OTP

### 4. Network Errors
- Shows user-friendly network error messages
- Allows retry without losing progress

### 5. Email Service Down
- Returns appropriate error code
- User sees "Email service not configured" message

### 6. Already Used OTP
- Shows "This reset code has already been used" message
- User must request new OTP for another reset

## Troubleshooting

### Issue: "Invalid or expired reset code" after OTP verification
**Cause**: OTP was marked as used after verification but before password reset
**Solution**: Fixed in latest version - OTP remains active until password is actually reset

### Issue: Multiple password reset attempts with same OTP
**Cause**: User tries to use same OTP multiple times
**Solution**: System prevents reuse of OTP after successful password reset

### Issue: OTP expires during password reset process
**Cause**: User takes too long between steps
**Solution**: OTP has 5-minute expiration; user must request new OTP if expired

## Security Best Practices Implemented

1. **No User Enumeration**: Doesn't reveal if email exists
2. **Rate Limiting**: Prevents brute force attacks
3. **OTP Expiration**: Time-limited codes
4. **Attempt Limiting**: Prevents guessing attacks
5. **Secure Hashing**: bcrypt for passwords and OTPs
6. **Transaction Safety**: Database rollback on errors
7. **Input Validation**: All inputs validated and sanitized
8. **Professional Emails**: Clear, branded email templates

## Monitoring and Logging

The system includes comprehensive logging:
- Password reset requests
- OTP generation and verification
- Email sending status
- Error conditions
- Security events (failed attempts, etc.)

All logs use consistent emoji prefixes for easy filtering:
- 🔐 Password reset operations
- 📧 Email operations
- ✅ Success operations
- ❌ Error conditions

## Future Enhancements

1. **Audit Trail**: Log all password reset attempts
2. **SMS Backup**: Add SMS as alternative to email
3. **Security Questions**: Optional security questions
4. **Account Lockout**: Temporary lockout after multiple failed attempts
5. **Notification**: Notify user of successful password reset
6. **Session Invalidation**: Invalidate all active sessions after password reset
