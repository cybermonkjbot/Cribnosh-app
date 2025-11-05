#!/usr/bin/env node

/**
 * Test script for Apple Sign in notification endpoint
 * Run with: node scripts/test-apple-notifications.js
 */

const testEndpoint = async () => {
  const endpoint = 'https://cribnosh.co.uk/api/apple/signin-notifications';
  
  // Test payloads for different notification types
  const testCases = [
    {
      name: 'Email Disabled',
      payload: {
        type: 'email-disabled',
        sub: '001234.567890abcdef.1234',
        aud: 'com.cribnosh.app',
        iss: 'https://appleid.apple.com',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      }
    },
    {
      name: 'Email Enabled',
      payload: {
        type: 'email-enabled',
        sub: '001234.567890abcdef.1234',
        aud: 'com.cribnosh.app',
        iss: 'https://appleid.apple.com',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      }
    },
    {
      name: 'Consent Withdrawn',
      payload: {
        type: 'consent-withdrawn',
        sub: '001234.567890abcdef.1234',
        aud: 'com.cribnosh.app',
        iss: 'https://appleid.apple.com',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      }
    },
    {
      name: 'Account Deleted',
      payload: {
        type: 'account-deleted',
        sub: '001234.567890abcdef.1234',
        aud: 'com.cribnosh.app',
        iss: 'https://appleid.apple.com',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      }
    }
  ];

  console.log('🧪 Testing Apple Sign in notification endpoint...\n');

  for (const testCase of testCases) {
    try {
      console.log(`📤 Testing: ${testCase.name}`);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-jwt-token' // This will fail JWT verification, which is expected
        },
        body: JSON.stringify(testCase.payload)
      });

      const result = await response.json();
      
      console.log(`📥 Response Status: ${response.status}`);
      console.log(`📥 Response Body:`, JSON.stringify(result, null, 2));
      console.log('---\n');
      
    } catch (error) {
      console.error(`❌ Error testing ${testCase.name}:`, error.message);
      console.log('---\n');
    }
  }

  console.log('✅ Test completed!');
  console.log('\n📝 Notes:');
  console.log('- JWT verification will fail with test tokens (expected)');
  console.log('- User lookup will fail for test Apple IDs (expected)');
  console.log('- The endpoint should return 401 for invalid JWT');
  console.log('- The endpoint should return 200 for valid JWT (when implemented)');
};

// Run the test
testEndpoint().catch(console.error);
