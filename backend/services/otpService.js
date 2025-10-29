import crypto from 'crypto';
import bcrypt from 'bcrypt';
import pool from '../config/db.js';

const OTP_LENGTH = 6;

export function generateOtp() {
  const random = crypto.randomInt(0, 10 ** OTP_LENGTH);
  return String(random).padStart(OTP_LENGTH, '0');
}

export async function hashOtp(otp) {
  const rounds = Number(process.env.BCRYPT_SALT_ROUNDS || 12);
  return bcrypt.hash(otp, rounds);
}

export async function compareOtp(otp, otpHash) {
  return bcrypt.compare(otp, otpHash);
}

export async function invalidateOtpsForEmail(email, conn = null) {
  const sql = 'UPDATE otp_verifications SET used = TRUE WHERE email = ? AND used = FALSE';
  const runner = conn || pool;
  await runner.execute(sql, [email]);
}

export async function createOtpRecord(email, otpHash, minutesFromNow, conn = null) {
  const expiresAt = new Date(Date.now() + minutesFromNow * 60 * 1000);
  const sql = `INSERT INTO otp_verifications (email, otp_hash, expires_at) VALUES (?, ?, ?)`;
  const runner = conn || pool;
  await runner.execute(sql, [email, otpHash, expiresAt]);
  return { expiresAt };
}

export async function getLatestActiveOtp(email) {
  const [rows] = await pool.execute(
    `SELECT * FROM otp_verifications
     WHERE email = ? AND used = FALSE
     ORDER BY id DESC
     LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}

export async function incrementOtpAttempts(id) {
  await pool.execute('UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = ?', [id]);
}

export async function markOtpUsed(id, conn = null) {
  const runner = conn || pool;
  await runner.execute('UPDATE otp_verifications SET used = TRUE WHERE id = ?', [id]);
}

export async function cleanupExpiredOtps() {
  await pool.execute('DELETE FROM otp_verifications WHERE used = TRUE OR expires_at < NOW()');
}


