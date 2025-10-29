#!/usr/bin/env node

/**
 * Test script for admin login API
 */

const API_BASE = 'http://localhost:5000/api/auth';

async function testAdminAPI() {
  console.log('🧪 Testing Admin Login API...\n');

  try {
    // Test the exact API call
    console.log('📡 Making API call to /login...');
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'Admin123!',
        role: 'admin'
      })
    });

    console.log('📊 Response status:', response.status);
    
    const data = await response.json();
    console.log('📊 Response data:', data);

    if (data.success) {
      console.log('✅ Admin login API test PASSED');
    } else {
      console.log('❌ Admin login API test FAILED');
      console.log('   Error:', data.message);
    }

  } catch (error) {
    console.error('❌ API test error:', error.message);
  }
}

// Run the test
testAdminAPI();
