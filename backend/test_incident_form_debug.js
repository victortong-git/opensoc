#!/usr/bin/env node

const axios = require('axios');
const jwt = require('jsonwebtoken');

async function testIncidentFormGeneration() {
  try {
    // Use real token from login API
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjU1MGU4NDAwLWUyOWItNDFkNC1hNzE2LTQ0NjY1NTQ0MDAwMSIsInVzZXJuYW1lIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluQGRlbW8uY29ycCIsInJvbGUiOiJhZG1pbiIsIm9yZ2FuaXphdGlvbklkIjoiNTUwZTg0MDAtZTI5Yi00MWQ0LWE3MTYtNDQ2NjU1NDQwMDAwIiwiaWF0IjoxNzU2OTY4Nzg4LCJleHAiOjE3NTc1NzM1ODgsImF1ZCI6ImFnZW50aWMtc29jLXVzZXJzIiwiaXNzIjoiYWdlbnRpYy1zb2MifQ.RdDEmytBl7NUeCVdjDXQPTjFVZW2BeJb4KVVRVihgpg';

    console.log('🚀 Testing incident form generation API...');
    
    const response = await axios.post(
      'http://localhost:3001/api/alerts/315847fd-2910-4dd2-9306-4d2e4e20235d/ai-generate-incident-form',
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000
      }
    );

    console.log('✅ Response status:', response.status);
    console.log('📋 Response data:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    if (error.response) {
      console.log('❌ HTTP Error:', error.response.status);
      console.log('📄 Error response:', error.response.data);
    } else {
      console.log('❌ Request Error:', error.message);
    }
  }
}

testIncidentFormGeneration();