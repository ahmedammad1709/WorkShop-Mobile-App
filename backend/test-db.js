import 'dotenv/config';
import pool from './config/db.js';

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    console.log('DB Config:', {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      database: process.env.DB_NAME
    });
    
    // Test basic connection
    await pool.execute('SELECT 1');
    console.log('✅ Database connection successful');
    
    // Check if tables exist
    const tables = ['users', 'pending_signups', 'otp_verifications'];
    
    for (const table of tables) {
      try {
        await pool.execute(`SELECT 1 FROM ${table} LIMIT 1`);
        console.log(`✅ Table '${table}' exists`);
      } catch (err) {
        console.log(`❌ Table '${table}' missing:`, err.message);
      }
    }
    
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
  } finally {
    await pool.end();
  }
}

testDatabase();
