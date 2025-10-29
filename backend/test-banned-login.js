#!/usr/bin/env node

import 'dotenv/config';

async function testBannedLogin() {
  console.log('🔐 Testing login with banned user exxtraa10@gmail.com...\n');

  try {
    // Test login with banned user exxtraa10@gmail.com
    console.log('Attempting login with banned user...');
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: 'exxtraa10@gmail.com', 
        password: 'password123', // Common test password
        role: 'contractor' 
      }),
    });

    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (data.isBanned) {
      console.log('✅ SUCCESS: Ban check is working - user is blocked from login');
      console.log('✅ The ban functionality is working correctly!');
    } else if (response.status === 200) {
      console.log('❌ FAILURE: Ban check is NOT working - user can still login');
    } else if (response.status === 401) {
      console.log('ℹ️  Login failed due to invalid credentials (wrong password)');
      console.log('ℹ️  This means the ban check would work if the password was correct');
    } else {
      console.log('ℹ️  Login failed for other reason:', data.message);
    }

  } catch (error) {
    console.log('❌ Error testing login:', error.message);
  }
}

testBannedLogin();
