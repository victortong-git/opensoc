#!/bin/bash

# SPDX-FileCopyrightText: Copyright (c) 2025, NVIDIA CORPORATION & AFFILIATES. All rights reserved.
# SPDX-License-Identifier: Apache-2.0

# Quick VirusTotal Integration Test Script for Open-SOC Agent
# Tests VirusTotal API functionality with focused test cases

echo "🦠 Quick VirusTotal Integration Test..."
echo ""

# Check if NAT container is running
if ! docker compose exec nvidia-nat echo "NAT container is running" 2>/dev/null; then
    echo "❌ NAT container is not running. Please start it with: ./start_nat.sh"
    exit 1
fi

# Check VIRUSTOTAL_API_KEY environment variable
echo "🔑 Checking VirusTotal API key configuration:"
docker compose exec nvidia-nat bash -c 'if [ -n "$VIRUSTOTAL_API_KEY" ]; then echo "✅ VIRUSTOTAL_API_KEY is set (length: ${#VIRUSTOTAL_API_KEY} chars)"; else echo "❌ VIRUSTOTAL_API_KEY is not set"; fi'
echo ""

# Test 1: EICAR Test File (Known Malicious)
echo "🔴 Test 1: EICAR Test File Analysis (Expected: High detections)"
echo "================================================================"
docker compose exec nvidia-nat bash -c '
cd /workspace && timeout 45 nat run \
    --config_file=my-agents/open-soc/src/open_soc/configs/config.yml \
    --input "VirusTotal test: Analyze hash 275a021bbfb6489e54d471899f7db9d1663fc695ec2fe2a2c4538aabf651fd0f"
'
echo ""

# Test 2: Direct VirusTotal API Test
echo "🌐 Test 2: Direct VirusTotal API Connectivity"
echo "=============================================="
docker compose exec nvidia-nat bash -c '
if [ -n "$VIRUSTOTAL_API_KEY" ]; then
    echo "Testing direct VirusTotal API access..."
    curl -s -H "x-apikey: $VIRUSTOTAL_API_KEY" \
        "https://www.virustotal.com/api/v3/files/275a021bbfb6489e54d471899f7db9d1663fc695ec2fe2a2c4538aabf651fd0f" \
        | python3 -m json.tool | head -20
    echo ""
    echo "✅ If you see JSON output above, VirusTotal API is working!"
else
    echo "❌ VIRUSTOTAL_API_KEY not available for direct test"
fi
'
echo ""

echo "🎯 Quick Test Summary:"
echo "======================"
echo "✅ Test completed. If you see VirusTotal analysis results above,"
echo "   the integration is working correctly!"
echo ""
echo "🔍 Look for:"
echo "   • Detection ratios (e.g., '65/76 engines')"
echo "   • Threat levels (Critical/High/Medium/Low/Clean)"  
echo "   • Real API data (not mock/offline data)"
echo ""