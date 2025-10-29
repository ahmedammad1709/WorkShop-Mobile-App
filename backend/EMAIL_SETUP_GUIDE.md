# Email Setup Guide

## Problem
Your application is showing the error "failed to send OTP" because Gmail SMTP authentication is failing with "535-5.7.8 Username and Password not accepted".

## Root Cause
1. **Missing environment configuration** - No `.env` file was configured
2. **Gmail security requirements** - Gmail requires App Passwords, not regular passwords
3. **Incorrect SMTP settings** - Default port 465 with secure=true was causing issues

## Solution

### Step 1: Configure Gmail App Password

1. **Enable 2-Factor Authentication** on your Gmail account:
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable "2-Step Verification" if not already enabled

2. **Generate App Password**:
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Click on "App passwords" (you may need to search for it)
   - Select "Mail" as the app
   - Generate a 16-character password
   - **Copy this password** - you'll need it for the `.env` file

### Step 2: Configure Environment Variables

The `.env` file has been created with the correct Gmail settings. Edit it with your actual credentials:

```bash
# Edit the .env file
nano .env  # or use your preferred editor
```

Update these values:
```env
SMTP_EMAIL=your-actual-gmail@gmail.com
SMTP_PASSWORD=your-16-character-app-password
```

### Step 3: Verify Configuration

1. **Restart your server** after updating the `.env` file
2. **Check the console** - you should see:
   ```
   ✅ SMTP connection verified successfully
   ```
   instead of:
   ```
   ❌ SMTP connection failed
   ```

### Step 4: Test Signup

Try the signup process again. The OTP email should now be sent successfully.

## Alternative Email Providers

If you prefer not to use Gmail, here are other SMTP configurations:

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_EMAIL=your-email@outlook.com
SMTP_PASSWORD=your-password
```

### Yahoo
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_EMAIL=your-email@yahoo.com
SMTP_PASSWORD=your-app-password
```

## Troubleshooting

### Still getting authentication errors?
1. **Double-check the App Password** - Make sure you're using the 16-character app password, not your regular Gmail password
2. **Verify 2FA is enabled** - App passwords only work with 2-factor authentication enabled
3. **Check the email address** - Ensure `SMTP_EMAIL` matches the Gmail account where you generated the app password

### Connection timeout errors?
1. **Check your firewall** - Make sure port 587 is not blocked
2. **Try port 465** - If 587 doesn't work, try:
   ```env
   SMTP_PORT=465
   SMTP_SECURE=true
   ```

### Still having issues?
1. **Check the console logs** - The application now provides detailed error messages
2. **Verify all environment variables** - Run `node setup-env.js` to recreate the `.env` file
3. **Test SMTP connection** - The application automatically tests the connection on startup

## Security Notes

- ✅ The `.env` file is now in `.gitignore` to prevent committing credentials
- ✅ The application validates email configuration on startup
- ✅ Better error messages help diagnose configuration issues
- ✅ SMTP connection is verified automatically

## Quick Setup Commands

```bash
# Navigate to backend directory
cd backend

# Run setup script (creates .env file)
node setup-env.js

# Edit .env with your credentials
# Then restart your server
npm start
```
