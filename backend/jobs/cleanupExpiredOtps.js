import 'dotenv/config';
import pool from '../config/db.js';

async function run() {
  try {
    const [r1] = await pool.execute('DELETE FROM otp_verifications WHERE used = TRUE OR expires_at < NOW()');
    const [r2] = await pool.execute("DELETE FROM pending_signups WHERE created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)");
    console.log(`Cleanup complete. otp rows removed: ${r1.affectedRows}, pending removed: ${r2.affectedRows}`);
  } catch (e) {
    console.error('Cleanup failed', e.message);
    process.exitCode = 1;
  } finally {
    pool.end();
  }
}

run();


