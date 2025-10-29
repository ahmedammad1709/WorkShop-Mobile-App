import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.js';
import pool from './config/db.js';
import transporter from './config/mail.js';

const app = express();

app.use(helmet());
app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/health/db', async (_req, res) => {
  try {
    await pool.execute('SELECT 1');
    res.json({ ok: true });
  } catch (e) {
    console.error('DB Health check failed:', e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/api/health/smtp', async (_req, res) => {
  try {
    await transporter.verify();
    res.json({ ok: true });
  } catch (e) {
    console.error('SMTP Health check failed:', e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/api/health/schema', async (_req, res) => {
  const results = {};
  const checks = [
    { name: 'users', sql: 'SELECT 1 FROM users LIMIT 1' },
    { name: 'pending_signups', sql: 'SELECT 1 FROM pending_signups LIMIT 1' },
    { name: 'otp_verifications', sql: 'SELECT 1 FROM otp_verifications LIMIT 1' },
  ];
  for (const c of checks) {
    try {
      await pool.execute(c.sql);
      results[c.name] = true;
    } catch (e) {
      console.error(`Schema check failed for ${c.name}:`, e.message);
      results[c.name] = false;
    }
  }
  res.json({ ok: true, tables: results });
});

app.use('/api/auth', authRoutes);

const port = process.env.PORT || 5000;

// Add error handling for the server
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

app.listen(port, () => {
  console.log(`🚀 API listening on port ${port}`);
  console.log(`📧 SMTP Email: ${process.env.SMTP_EMAIL}`);
  console.log(`🗄️  Database: ${process.env.DB_NAME}`);
});
