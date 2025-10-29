import 'dotenv/config';
import mysql from 'mysql2/promise';

async function repair() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const stmts = [
    // Ensure role exists on pending_signups
    "ALTER TABLE pending_signups ADD COLUMN role ENUM('contractor','technician','supplier','consultant','admin') NOT NULL DEFAULT 'contractor'",
    // Ensure created_at has default
    "ALTER TABLE pending_signups MODIFY COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP",
    // Align otp_verifications columns
    "ALTER TABLE otp_verifications ADD COLUMN attempts INT DEFAULT 0",
    "ALTER TABLE otp_verifications ADD COLUMN used BOOLEAN DEFAULT FALSE",
    "ALTER TABLE otp_verifications CHANGE COLUMN otp_code otp_hash VARCHAR(255)",
  ];

  for (const sql of stmts) {
    try {
      await conn.query(sql);
      console.log(`✅ Ran: ${sql.slice(0, 60)}...`);
    } catch (e) {
      // Skip if column exists or change not applicable
      console.log(`ℹ️  Skip: ${e.code || e.message}`);
    }
  }

  await conn.end();
  console.log('Done.');
}

repair().catch((e) => {
  console.error('Repair failed:', e);
  process.exit(1);
});
