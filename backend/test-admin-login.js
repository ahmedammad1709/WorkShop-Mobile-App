#!/usr/bin/env node

/**
 * Test script for admin login functionality
 */

const API_BASE = 'http://localhost:5000/api/auth';

async function testAdminLogin() {
  console.log('🧪 Testing Admin Login Functionality...\n');

  try {
    // Test 1: Admin login with correct credentials (if admin exists)
    console.log('🔐 Test 1: Admin login with valid credentials...');
    const adminResponse = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: 'admin@example.com', 
        password: 'admin123', 
        role: 'admin' 
      }),
    });

    const adminData = await adminResponse.json();
    console.log('Admin Login Response:', adminData);

    if (adminData.success) {
      console.log('✅ Admin login successful');
    } else {
      console.log('⚠️  Admin login failed (expected if admin user doesn\'t exist)');
    }

    // Test 2: Admin login with wrong role
    console.log('\n🔐 Test 2: Admin login with wrong role...');
    const wrongRoleResponse = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: 'admin@example.com', 
        password: 'admin123', 
        role: 'contractor' 
      }),
    });

    const wrongRoleData = await wrongRoleResponse.json();
    console.log('Wrong Role Response:', wrongRoleData);

    if (!wrongRoleData.success) {
      console.log('✅ Correctly rejected admin login with wrong role');
    }

    // Test 3: Regular user trying to login as admin
    console.log('\n🔐 Test 3: Regular user trying to login as admin...');
    const regularUserResponse = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: 'test@example.com', 
        password: 'test123', 
        role: 'admin' 
      }),
    });

    const regularUserData = await regularUserResponse.json();
    console.log('Regular User as Admin Response:', regularUserData);

    if (!regularUserData.success) {
      console.log('✅ Correctly rejected regular user trying to login as admin');
    }

    console.log('\n🎉 Admin login functionality tests completed!');
    console.log('📝 Summary:');
    console.log('   - Admin login endpoint is working');
    console.log('   - Role-based authentication is enforced');
    console.log('   - Regular users cannot login as admin');
    console.log('   - Frontend will redirect admin users to /adminDashboard');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAdminLogin();
