import { Router } from 'express';
import { requestOtp, verifyOtp, resendOtp, requestPasswordReset, verifyPasswordResetOtp, resetPassword, login } from '../controllers/authController.js';
import { otpRequestLimiter } from '../middleware/rateLimiter.js';
import pool from '../config/db.js';

const router = Router();

// Signup OTP routes
router.post('/request-otp', otpRequestLimiter, requestOtp);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', otpRequestLimiter, resendOtp);

// Password reset routes
router.post('/request-password-reset', otpRequestLimiter, requestPasswordReset);
router.post('/verify-password-reset-otp', verifyPasswordResetOtp);
router.post('/reset-password', resetPassword);

// Login route
router.post('/login', login);

// Get users by role route (active users only)
router.get('/users/:role', async (req, res) => {
  try {
    const { role } = req.params;
    const validRoles = ['contractor', 'technician', 'supplier', 'consultant', 'admin'];
    
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }

    const [users] = await pool.execute(
      'SELECT id, name, email, role, is_active, isBan, created_at FROM users WHERE role = ? AND is_active = TRUE AND (isBan IS NULL OR isBan = 0) ORDER BY created_at DESC',
      [role]
    );

    res.json({ users });
  } catch (error) {
    console.error('Error fetching users by role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get banned users by role route
router.get('/users/:role/banned', async (req, res) => {
  try {
    const { role } = req.params;
    const validRoles = ['contractor', 'technician', 'supplier', 'consultant', 'admin'];
    
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }

    const [bannedUsers] = await pool.execute(
      'SELECT id, name, email, role, is_active, isBan, created_at FROM users WHERE role = ? AND isBan = 1 ORDER BY created_at DESC',
      [role]
    );

    res.json({ users: bannedUsers });
  } catch (error) {
    console.error('Error fetching banned users by role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Ban user route
router.put('/users/:id/ban', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.execute(
      'UPDATE users SET isBan = 1 WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User banned successfully' });
  } catch (error) {
    console.error('Error banning user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Unban user route
router.put('/users/:id/unban', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.execute(
      'UPDATE users SET isBan = 0 WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User unbanned successfully' });
  } catch (error) {
    console.error('Error unbanning user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user details by email route
router.get('/user/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, is_active, isBan, created_at FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = rows[0];
    res.json({ 
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.is_active,
        isBanned: user.isBan,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get admin user details (role = admin)
router.get('/admin', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, is_active, isBan, created_at FROM users WHERE role = ?',
      ['admin']
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Admin user not found' });
    }

    const admin = rows[0];
    res.json({ 
      success: true,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        isActive: admin.is_active,
        isBanned: admin.isBan,
        createdAt: admin.created_at
      }
    });
  } catch (error) {
    console.error('Error fetching admin:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Verify admin password
router.post('/verify-admin-password', async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }

    const [rows] = await pool.execute(
      'SELECT password_hash FROM users WHERE role = ?',
      ['admin']
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Admin user not found' });
    }

    const admin = rows[0];
    const bcrypt = await import('bcrypt');
    const isValid = await bcrypt.compare(password, admin.password_hash);

    if (isValid) {
      res.json({ success: true, message: 'Password verified' });
    } else {
      res.json({ success: false, message: 'Invalid password' });
    }
  } catch (error) {
    console.error('Error verifying admin password:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update admin profile
router.put('/update-admin-profile', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    // First verify the password
    const [adminRows] = await pool.execute(
      'SELECT password_hash FROM users WHERE role = ?',
      ['admin']
    );

    if (adminRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Admin user not found' });
    }

    const bcrypt = await import('bcrypt');
    const isValid = await bcrypt.compare(password, adminRows[0].password_hash);

    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    // Check if new email already exists (excluding current admin)
    const [existingRows] = await pool.execute(
      'SELECT id FROM users WHERE email = ? AND role != ?',
      [email, 'admin']
    );

    if (existingRows.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }

    // Update admin profile
    const [result] = await pool.execute(
      'UPDATE users SET name = ?, email = ? WHERE role = ?',
      [name, email, 'admin']
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Admin user not found' });
    }

    res.json({ success: true, message: 'Admin profile updated successfully' });
  } catch (error) {
    console.error('Error updating admin profile:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Change admin password
router.put('/change-admin-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
    }

    // First verify the current password
    const [adminRows] = await pool.execute(
      'SELECT password_hash FROM users WHERE role = ?',
      ['admin']
    );

    if (adminRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Admin user not found' });
    }

    const bcrypt = await import('bcrypt');
    const isValid = await bcrypt.compare(currentPassword, adminRows[0].password_hash);

    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid current password' });
    }

    // Hash new password
    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 12);
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update admin password
    const [result] = await pool.execute(
      'UPDATE users SET password_hash = ? WHERE role = ?',
      [newPasswordHash, 'admin']
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Admin user not found' });
    }

    res.json({ success: true, message: 'Admin password changed successfully' });
  } catch (error) {
    console.error('Error changing admin password:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get user counts grouped by role
router.get('/roles-stats', async (_req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT role, COUNT(*) AS count FROM users GROUP BY role'
    );
    const stats = rows.map(r => ({ role: String(r.role || '').toLowerCase(), count: Number(r.count) || 0 }));
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching roles stats:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;


