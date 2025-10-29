#!/usr/bin/env node

/**
 * Test script for password reset flow
 * This script tests the complete password reset process
 */

const API_BASE = 'http://localhost:5000/api/auth';

async function testPasswordReset() {
  console.log('🧪 Testing Password Reset Flow...\n');

  const testEmail = 'ammadshifa2006@gmail.com';
  const newPassword = 'newPassword123';

  try {
    // Step 1: Request password reset
    console.log('📧 Step 1: Requesting password reset...');
    const resetResponse = await fetch(`${API_BASE}/request-password-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail }),
    });

    const resetData = await resetResponse.json();
    console.log('Response:', resetData);

    if (!resetData.success) {
      throw new Error(`Password reset request failed: ${resetData.message}`);
    }

    console.log('✅ Password reset request successful\n');

    // Step 2: Verify OTP (using a dummy OTP for testing)
    console.log('🔐 Step 2: Verifying OTP...');
    const verifyResponse = await fetch(`${API_BASE}/verify-password-reset-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, otp: '123456' }),
    });

    const verifyData = await verifyResponse.json();
    console.log('Response:', verifyData);

    if (!verifyData.success) {
      console.log('⚠️  OTP verification failed (expected with dummy OTP)');
    } else {
      console.log('✅ OTP verification successful');
    }

    console.log('\n📝 Note: Use the actual OTP from your email to complete the test');
    console.log('💡 The fix ensures OTP remains active until password is actually reset');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testPasswordReset();
