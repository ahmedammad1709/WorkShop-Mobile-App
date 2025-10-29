#!/usr/bin/env node

import 'dotenv/config';

async function testLogin() {
  console.log('🔐 Testing login with banned user...\n');

  try {
    // Test login with banned user exxtraa10@gmail.com
    console.log('Testing login with exxtraa10@gmail.com (banned user)...');
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: 'exxtraa10@gmail.com', 
        password: 'testpassword', // You may need to adjust this
        role: 'contractor' 
      }),
    });

    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', data);
    
    if (data.isBanned) {
      console.log('✅ Ban check is working - user is blocked from login');
    } else if (response.status === 200) {
      console.log('❌ Ban check is NOT working - user can still login');
    } else {
      console.log('ℹ️  Login failed for other reason:', data.message);
    }

  } catch (error) {
    console.log('❌ Error testing login:', error.message);
  }
}

testLogin();
