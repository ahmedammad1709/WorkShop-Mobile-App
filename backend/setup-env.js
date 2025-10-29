#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

console.log('🔧 Setting up environment configuration...\n');

// Check if .env already exists
if (fs.existsSync(envPath)) {
  console.log('⚠️  .env file already exists!');
  console.log('📝 Please edit it manually with your actual email credentials.\n');
} else {
  // Copy from .env.example if it exists
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Created .env file from .env.example');
  } else {
    // Create a basic .env file
    const envContent = `# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=workshop_app

# Email Configuration (Gmail SMTP)
# IMPORTANT: For Gmail, you need to use an App Password, not your regular password
# 1. Enable 2-factor authentication on your Gmail account
# 2. Go to Google Account settings > Security > App passwords
# 3. Generate a new app password for "Mail"
# 4. Use that app password below
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# OTP Configuration
OTP_EXPIRY_MINUTES=5
OTP_RESEND_COOLDOWN_SECONDS=60
MAX_OTP_VERIFY_ATTEMPTS=5

# Security
BCRYPT_SALT_ROUNDS=12
JWT_SECRET=your-jwt-secret-key

# Server Configuration
PORT=5000`;

    fs.writeFileSync(envPath, envContent);
    console.log('✅ Created .env file with default configuration');
  }
}

console.log('\n📋 Next steps:');
console.log('1. Edit the .env file with your actual Gmail credentials');
console.log('2. For Gmail, you MUST use an App Password (not your regular password)');
console.log('3. To get a Gmail App Password:');
console.log('   - Enable 2-factor authentication on your Gmail account');
console.log('   - Go to Google Account settings > Security > App passwords');
console.log('   - Generate a new app password for "Mail"');
console.log('   - Use that app password in SMTP_PASSWORD');
console.log('\n4. Restart your server after updating the .env file');
console.log('\n🔗 For more details, see: https://support.google.com/mail/answer/185833');
