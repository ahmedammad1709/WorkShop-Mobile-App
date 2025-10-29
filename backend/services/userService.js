import bcrypt from 'bcrypt';
import pool from '../config/db.js';

export async function findUserByEmail(email) {
  const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
}

export async function upsertPendingSignup(email, name, passwordPlain, role) {
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 12);
  const passwordHash = await bcrypt.hash(passwordPlain, saltRounds);
  await pool.execute(
    `INSERT INTO pending_signups (email, name, password_hash, role)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE name = VALUES(name), password_hash = VALUES(password_hash), role = VALUES(role), created_at = CURRENT_TIMESTAMP`,
    [email, name, passwordHash, role]
  );
  return { passwordHash };
}

export async function getPendingSignupByEmail(email, conn = null) {
  const runner = conn || pool;
  const [rows] = await runner.execute('SELECT * FROM pending_signups WHERE email = ?', [email]);
  return rows[0] || null;
}

export async function deletePendingSignupByEmail(email, conn = null) {
  const runner = conn || pool;
  await runner.execute('DELETE FROM pending_signups WHERE email = ?', [email]);
}

export async function createUserFromPending(email, conn) {
  const pending = await getPendingSignupByEmail(email, conn);
  if (!pending) return null;
  const { name, password_hash: passwordHash, role } = pending;
  const [result] = await conn.execute(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [name, email, passwordHash, role]
  );
  return { id: result.insertId, name, email };
}


