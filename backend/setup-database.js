import 'dotenv/config';
import mysql from 'mysql2/promise';
import fs from 'fs';

async function setupDatabase() {
  let connection;
  
  try {
    console.log('🔧 Setting up database...');
    
    // Connect directly to the specific database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'workshop_app',
    });

    console.log('✅ Connected to database');

    // Check if tables exist
    const tables = ['users', 'pending_signups', 'otp_verifications'];
    
    for (const table of tables) {
      try {
        await connection.execute(`SELECT 1 FROM ${table} LIMIT 1`);
        console.log(`✅ Table '${table}' exists`);
      } catch (err) {
        console.log(`❌ Table '${table}' missing:`, err.message);
      }
    }

    // If tables don't exist, create them
    const schema = fs.readFileSync('./sql/schema.sql', 'utf8');
    const statements = schema.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await connection.query(statement); // Use query instead of execute
          console.log('✅ Created table');
        } catch (err) {
          if (err.code === 'ER_TABLE_EXISTS_ERROR') {
            console.log('ℹ️  Table already exists');
          } else {
            console.log('❌ Error:', err.message);
          }
        }
      }
    }
    
    console.log('✅ Database setup completed');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase();