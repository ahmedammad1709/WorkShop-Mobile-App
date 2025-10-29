import pool from '../config/db.js';
import transporter from '../config/mail.js';
import bcrypt from 'bcrypt';
import { generateOtp, hashOtp, compareOtp, invalidateOtpsForEmail, createOtpRecord, getLatestActiveOtp, incrementOtpAttempts, markOtpUsed } from '../services/otpService.js';
import { findUserByEmail, upsertPendingSignup, getPendingSignupByEmail, deletePendingSignupByEmail, createUserFromPending } from '../services/userService.js';

function isValidEmail(email) {
  return /.+@.+\..+/.test(email);
}

function isStrongPassword(pw) {
  return typeof pw === 'string' && pw.length >= 8;
}

export async function requestOtp(req, res) {
  try {
    const { name, email, password, role } = req.body || {};
    console.log('📧 OTP Request received:', { name, email, role });
    if (!name || !email || !password || !role) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const validRoles = ['contractor','technician','supplier','consultant'];
    if (!validRoles.includes(String(role).toLowerCase())) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email' });
    }
    if (!isStrongPassword(password)) {
      return res.status(400).json({ success: false, message: 'Password too weak (min 8 chars)' });
    }

    // Check existing user
    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    // Database: pending signup + OTP insert
    let expiresAt;
    try {
      console.log('💾 Creating pending signup...');
      await upsertPendingSignup(email, name, password, String(role).toLowerCase());
      console.log('✅ Pending signup created');

      console.log('🔐 Generating OTP...');
      const otp = generateOtp();
      const otpHash = await hashOtp(otp);
      const expiryMinutes = Number(process.env.OTP_EXPIRY_MINUTES || 5);
      console.log('✅ OTP generated');

      console.log('🗑️ Invalidating old OTPs...');
      await invalidateOtpsForEmail(email);
      console.log('📝 Creating OTP record...');
      const rec = await createOtpRecord(email, otpHash, expiryMinutes);
      expiresAt = rec.expiresAt;
      console.log('✅ OTP record created');

      // Email send
      try {
        if (!transporter) {
          console.error('❌ Email transporter not available');
          return res.status(500).json({ 
            success: false, 
            message: 'Email service not configured. Please contact administrator.', 
            errorCode: 'EMAIL_NOT_CONFIGURED' 
          });
        }

        console.log('📧 Sending email to:', email);
        console.log('📧 SMTP Config:', {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          secure: process.env.SMTP_SECURE,
          email: process.env.SMTP_EMAIL
        });
        await transporter.sendMail({
          from: process.env.SMTP_EMAIL,
          to: email,
          subject: 'Your verification code',
          text: `Your OTP is ${otp}. It expires in ${expiryMinutes} minutes.`,
          html: `<p>Your OTP is <b>${otp}</b>. It expires in ${expiryMinutes} minutes.</p>`
        });
        console.log('✅ Email sent successfully');
      } catch (mailErr) {
        console.error('❌ Email send failed:', mailErr.message);
        return res.status(500).json({ success: false, message: 'Failed to send OTP (email)', errorCode: 'EMAIL_SEND_FAILED' });
      }
    } catch (dbErr) {
      console.error('❌ Database error:', dbErr.message);
      console.error('❌ Full error:', dbErr);
      return res.status(500).json({ success: false, message: 'Failed to send OTP (database)', errorCode: 'DB_WRITE_FAILED' });
    }

    const resendCooldown = Number(process.env.OTP_RESEND_COOLDOWN_SECONDS || 60);
    return res.status(200).json({ success: true, message: 'OTP sent to your email', resendCooldownSeconds: resendCooldown, expiresAt });
  } catch (err) {
    console.error('requestOtp error', err.message);
    return res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
}

export async function verifyOtp(req, res) {
  try {
    const { email, otp } = req.body || {};
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Missing email or otp' });
    }

    const record = await getLatestActiveOtp(email);
    if (!record) {
      return res.status(400).json({ success: false, message: 'OTP expired or not found' });
    }
    const maxAttempts = Number(process.env.MAX_OTP_VERIFY_ATTEMPTS || 5);
    if (record.attempts >= maxAttempts || new Date(record.expires_at).getTime() < Date.now()) {
      await markOtpUsed(record.id);
      return res.status(400).json({ success: false, message: 'OTP expired or not found' });
    }

    const ok = await compareOtp(otp, record.otp_hash);
    if (!ok) {
      await incrementOtpAttempts(record.id);
      const remaining = Math.max(0, maxAttempts - (record.attempts + 1));
      if (remaining === 0) {
        await markOtpUsed(record.id);
        return res.status(429).json({ success: false, message: 'Too many attempts' });
      }
      return res.status(400).json({ success: false, message: 'Invalid OTP', remainingAttempts: remaining });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const pending = await getPendingSignupByEmail(email, conn);
      if (!pending) {
        await conn.rollback();
        await markOtpUsed(record.id);
        return res.status(400).json({ success: false, message: 'No pending signup found' });
      }

      const [existing] = await conn.execute('SELECT id FROM users WHERE email = ?', [email]);
      if (existing.length) {
        await conn.rollback();
        await markOtpUsed(record.id);
        return res.status(409).json({ success: false, message: 'Email already registered' });
      }

      await createUserFromPending(email, conn);
      await deletePendingSignupByEmail(email, conn);
      await markOtpUsed(record.id, conn);

      await conn.commit();
    } catch (txErr) {
      await conn.rollback();
      console.error('verifyOtp transaction error', txErr.message);
      return res.status(500).json({ success: false, message: 'Server error' });
    } finally {
      conn.release();
    }

    return res.status(201).json({ success: true, message: 'Account created successfully', redirect: '/login' });
  } catch (err) {
    console.error('verifyOtp error', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function resendOtp(req, res) {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });

    const pending = await getPendingSignupByEmail(email);
    if (!pending) return res.status(400).json({ success: false, message: 'No pending signup found' });

    const resendCooldown = Number(process.env.OTP_RESEND_COOLDOWN_SECONDS || 60);
    const latest = await getLatestActiveOtp(email);
    if (latest) {
      const createdMs = new Date(latest.created_at).getTime();
      if (Date.now() - createdMs < resendCooldown * 1000) {
        return res.status(429).json({ success: false, message: 'Please wait before requesting another OTP' });
      }
    }

    await invalidateOtpsForEmail(email);
    const otp = generateOtp();
    const otpHash = await hashOtp(otp);
    const expiryMinutes = Number(process.env.OTP_EXPIRY_MINUTES || 5);
    await createOtpRecord(email, otpHash, expiryMinutes);

    if (!transporter) {
      console.error('❌ Email transporter not available');
      return res.status(500).json({ 
        success: false, 
        message: 'Email service not configured. Please contact administrator.', 
        errorCode: 'EMAIL_NOT_CONFIGURED' 
      });
    }

    await transporter.sendMail({
      from: process.env.SMTP_EMAIL,
      to: email,
      subject: 'Your new verification code',
      text: `Your OTP is ${otp}. It expires in ${expiryMinutes} minutes.`,
      html: `<p>Your OTP is <b>${otp}</b>. It expires in ${expiryMinutes} minutes.</p>`
    });

    return res.status(200).json({ success: true, message: 'OTP sent to your email', resendCooldownSeconds: resendCooldown });
  } catch (err) {
    console.error('resendOtp error', err.message);
    return res.status(500).json({ success: false, message: 'Failed to resend OTP' });
  }
}

// Password Reset Functions
export async function requestPasswordReset(req, res) {
  try {
    const { email } = req.body || {};
    console.log('🔐 Password reset request received for:', email);

    if (!email || !isValidEmail(email)) {
      console.log('❌ Invalid email provided');
      return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
    }

    // Check if user exists in database
    const user = await findUserByEmail(email);
    if (!user) {
      console.log('❌ User not found:', email);
      // Don't reveal that user doesn't exist for security reasons
      return res.status(200).json({ 
        success: true, 
        message: 'If the email is registered, you will receive a password reset code' 
      });
    }

    console.log('✅ User found, generating password reset OTP');

    // Generate and store OTP for password reset
    const otp = generateOtp();
    const otpHash = await hashOtp(otp);
    const expiryMinutes = Number(process.env.OTP_EXPIRY_MINUTES || 5);
    
    // Invalidate any existing OTPs for this email
    await invalidateOtpsForEmail(email);
    
    // Create new OTP record
    await createOtpRecord(email, otpHash, expiryMinutes);
    console.log('✅ Password reset OTP generated and stored');

    // Send email
    if (!transporter) {
      console.error('❌ Email transporter not available');
      return res.status(500).json({ 
        success: false, 
        message: 'Email service not configured. Please contact administrator.', 
        errorCode: 'EMAIL_NOT_CONFIGURED' 
      });
    }

    try {
      console.log('📧 Sending password reset email to:', email);
      await transporter.sendMail({
        from: process.env.SMTP_EMAIL,
        to: email,
        subject: 'Password Reset Code',
        text: `Your password reset code is ${otp}. This code expires in ${expiryMinutes} minutes. If you did not request this, please ignore this email.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>Hello ${user.name},</p>
            <p>You requested to reset your password. Use the code below to proceed:</p>
            <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #059669; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
            </div>
            <p>This code expires in <strong>${expiryMinutes} minutes</strong>.</p>
            <p>If you did not request this password reset, please ignore this email.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply.</p>
          </div>
        `
      });
      console.log('✅ Password reset email sent successfully');
    } catch (mailErr) {
      console.error('❌ Failed to send password reset email:', mailErr.message);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to send reset code. Please try again later.', 
        errorCode: 'EMAIL_SEND_FAILED' 
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'If the email is registered, you will receive a password reset code',
      resendCooldownSeconds: Number(process.env.OTP_RESEND_COOLDOWN_SECONDS || 60)
    });

  } catch (err) {
    console.error('❌ Password reset request error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to process password reset request' });
  }
}

export async function verifyPasswordResetOtp(req, res) {
  try {
    const { email, otp } = req.body || {};
    console.log('🔐 Password reset OTP verification for:', email);

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    // Verify OTP
    const record = await getLatestActiveOtp(email);
    if (!record) {
      console.log('❌ No active OTP found for:', email);
      return res.status(400).json({ success: false, message: 'Invalid or expired reset code' });
    }

    const maxAttempts = Number(process.env.MAX_OTP_VERIFY_ATTEMPTS || 5);
    if (record.attempts >= maxAttempts || new Date(record.expires_at).getTime() < Date.now()) {
      console.log('❌ OTP expired or too many attempts for:', email);
      await markOtpUsed(record.id);
      return res.status(400).json({ success: false, message: 'Invalid or expired reset code' });
    }

    const otpValid = await compareOtp(otp, record.otp_hash);
    if (!otpValid) {
      console.log('❌ Invalid OTP for:', email);
      await incrementOtpAttempts(record.id);
      const remaining = Math.max(0, maxAttempts - (record.attempts + 1));
      if (remaining === 0) {
        await markOtpUsed(record.id);
        return res.status(429).json({ success: false, message: 'Too many invalid attempts. Please request a new code.' });
      }
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid reset code', 
        remainingAttempts: remaining 
      });
    }

    // OTP is valid, but DON'T mark it as used yet - keep it active for password reset
    console.log('✅ Password reset OTP verified for:', email);

    return res.status(200).json({ 
      success: true, 
      message: 'Reset code verified successfully' 
    });

  } catch (err) {
    console.error('❌ Password reset OTP verification error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to verify reset code' });
  }
}

export async function resetPassword(req, res) {
  try {
    const { email, otp, newPassword } = req.body || {};
    console.log('🔐 Password reset attempt for:', email);

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
    }

    // Verify OTP again (double-check) - get the most recent OTP (including used ones)
    const [otpRecords] = await pool.execute(
      `SELECT * FROM otp_verifications
       WHERE email = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [email]
    );
    
    const record = otpRecords[0];
    if (!record) {
      console.log('❌ No OTP found for password reset:', email);
      return res.status(400).json({ success: false, message: 'Invalid or expired reset code' });
    }

    // Check if OTP has expired
    if (new Date(record.expires_at).getTime() < Date.now()) {
      console.log('❌ Expired OTP for password reset:', email);
      return res.status(400).json({ success: false, message: 'Invalid or expired reset code' });
    }

    // Check if too many attempts
    const maxAttempts = Number(process.env.MAX_OTP_VERIFY_ATTEMPTS || 5);
    if (record.attempts >= maxAttempts) {
      console.log('❌ Too many attempts for OTP:', email);
      return res.status(400).json({ success: false, message: 'Too many invalid attempts. Please request a new code.' });
    }

    const otpValid = await compareOtp(otp, record.otp_hash);
    if (!otpValid) {
      console.log('❌ Invalid OTP for password reset:', email);
      return res.status(400).json({ success: false, message: 'Invalid or expired reset code' });
    }

    // Check if OTP was already used for password reset
    if (record.used) {
      console.log('❌ OTP already used for password reset:', email);
      return res.status(400).json({ success: false, message: 'This reset code has already been used. Please request a new one.' });
    }

    // Check if user exists
    const user = await findUserByEmail(email);
    if (!user) {
      console.log('❌ User not found for password reset:', email);
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Hash new password and update in database
    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 12);
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Update user password
      await conn.execute(
        'UPDATE users SET password_hash = ? WHERE email = ?',
        [newPasswordHash, email]
      );

      // Mark OTP as used
      await markOtpUsed(record.id, conn);

      await conn.commit();
      console.log('✅ Password reset successful for:', email);

      return res.status(200).json({ 
        success: true, 
        message: 'Password has been reset successfully. You can now login with your new password.',
        redirect: '/login'
      });

    } catch (txErr) {
      await conn.rollback();
      console.error('❌ Password reset transaction error:', txErr.message);
      return res.status(500).json({ success: false, message: 'Failed to reset password. Please try again.' });
    } finally {
      conn.release();
    }

  } catch (err) {
    console.error('❌ Password reset error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
}

// Login function
export async function login(req, res) {
  try {
    const { email, password, role } = req.body || {};
    console.log('🔐 Login attempt:', { email, role });
    
    if (!email || !password || !role) {
      console.log('❌ Missing credentials');
      return res.status(400).json({ success: false, message: 'Missing credentials' });
    }
    
    const roleLower = String(role).toLowerCase();
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ? AND role = ?', [email, roleLower]);
    const user = rows[0];
    
    if (!user) {
      console.log(`❌ Login failed: no match found for role ${roleLower} ${email}`);
      return res.status(404).json({ success: false, message: 'User not found for this role' });
    }
    
    // Check if user is banned
    if (user.isBan === 1) {
      console.log(`❌ Login failed: user is banned ${roleLower} ${email}`);
      return res.status(403).json({ 
        success: false, 
        message: 'You are banned by the admin. Please contact support for further assistance.',
        isBanned: true
      });
    }
    
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      console.log(`❌ Login failed: wrong password for role ${roleLower} ${email}`);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    console.log(`✅ Login successful: ${roleLower} ${email}`);
    return res.status(200).json({ success: true, message: 'Login successful' });
    
  } catch (err) {
    console.error('❌ Login error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}


