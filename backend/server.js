import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.js';
import workOrdersRoutes from './routes/workOrders.js';
import activityItemsRoutes from './routes/activityItems.js';
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
    await pool.query('SELECT 1');
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/api/health/smtp', async (_req, res) => {
  try {
    await transporter.verify();
    res.json({ ok: true });
  } catch (e) {
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
      await pool.query(c.sql);
      results[c.name] = true;
    } catch (e) {
      results[c.name] = false;
    }
  }
  res.json({ ok: true, tables: results });
});

app.use('/api/auth', authRoutes);
app.use('/api/work-orders', workOrdersRoutes);
app.use('/api/activity-items', activityItemsRoutes);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  // Do not log secrets; basic startup log only
  console.log(`API listening on port ${port}`);
});


