#!/bin/bash

# SPDX-FileCopyrightText: Copyright (c) 2025, NVIDIA CORPORATION & AFFILIATES. All rights reserved.
# SPDX-License-Identifier: Apache-2.0

# Combined VirusTotal and ThreatFox Integration Test Script for Open-SOC Agent
# Tests both VirusTotal and ThreatFox API functionality with real threat analysis

echo "🦠🦊 Testing VirusTotal + ThreatFox Integration with Open-SOC Agent..."
echo ""

# Check if NAT container is running
if ! docker compose exec nvidia-nat echo "NAT container is running" 2>/dev/null; then
    echo "❌ NAT container is not running. Please start it with: ./start_nat.sh"
    exit 1
fi

# Check NAT version
echo "📋 Checking NAT version:"
docker compose exec nvidia-nat bash -c 'nat --version'
echo ""

# Check API key configurations
echo "🔑 Checking API key configurations:"
docker compose exec nvidia-nat bash -c 'if [ -n "$VIRUSTOTAL_API_KEY" ]; then echo "✅ VIRUSTOTAL_API_KEY is set (length: ${#VIRUSTOTAL_API_KEY} chars)"; else echo "❌ VIRUSTOTAL_API_KEY is not set"; fi'
docker compose exec nvidia-nat bash -c 'if [ -n "$THREATFOX_API_KEY" ]; then echo "✅ THREATFOX_API_KEY is set (length: ${#THREATFOX_API_KEY} chars)"; else echo "❌ THREATFOX_API_KEY is not set"; fi'
echo ""

# Verify Open-SOC package is registered
echo "📦 Verifying Open-SOC package registration:"
docker compose exec nvidia-nat bash -c 'nat info components -t package | grep open_soc || echo "❌ open_soc package not found"'
echo ""

# Verify function registrations
echo "🔍 Verifying function registrations:"
docker compose exec nvidia-nat bash -c 'nat info components -t function | grep virustotal_analyzer || echo "❌ virustotal_analyzer function not found"'
docker compose exec nvidia-nat bash -c 'nat info components -t function | grep threat_hunting || echo "❌ threat_hunting_specialist function not found"'
echo ""

# Test VirusTotal API connectivity directly
echo "🌐 Testing direct VirusTotal API connectivity:"
docker compose exec nvidia-nat bash -c '
if [ -n "$VIRUSTOTAL_API_KEY" ]; then
    echo "Testing VirusTotal API with provided key..."
    curl -s -H "x-apikey: $VIRUSTOTAL_API_KEY" "https://www.virustotal.com/api/v3/files/44d88612fea8a8f36de82e1278abb02f" | head -5
    if [ $? -eq 0 ]; then
        echo "✅ VirusTotal API is accessible"
    else
        echo "❌ VirusTotal API connection failed"
    fi
else
    echo "⚠️  VIRUSTOTAL_API_KEY not set - API test skipped"
fi'
echo ""

# Test 1: Known Malicious File Hash (EICAR test file)
echo "🔴 Test 1: Analyzing known malicious file hash (EICAR test file)"
echo "========================================================"
docker compose exec nvidia-nat bash -c '
cd /workspace && nat run \
    --config_file=my-agents/open-soc/src/open_soc/configs/config.yml \
    --input "Security Alert: Suspicious file detected on workstation WS-001. File hash SHA256: 275a021bbfb6489e54d471899f7db9d1663fc695ec2fe2a2c4538aabf651fd0f (EICAR test file). Antivirus flagged as potential malware. Please verify with VirusTotal to confirm threat level and provide detailed virus score analysis."
'
echo ""

# Test 2: Known Clean File Hash
echo "🟢 Test 2: Analyzing known clean file hash"
echo "==========================================="
docker compose exec nvidia-nat bash -c '
cd /workspace && nat run \
    --config_file=my-agents/open-soc/src/open_soc/configs/config.yml \
    --input "Security Alert: File quarantined by endpoint protection. Hash: cleanfile123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef. Need VirusTotal analysis to determine if this is a false positive or legitimate threat."
'
echo ""

# Test 3: Malicious IP Address Analysis
echo "🌐 Test 3: Analyzing suspicious IP address"
echo "==========================================="
docker compose exec nvidia-nat bash -c '
cd /workspace && nat run \
    --config_file=my-agents/open-soc/src/open_soc/configs/config.yml \
    --input "Security Alert: Suspicious network activity detected from workstation to external IP 198.51.100.5. Multiple outbound connections detected. Please analyze this IP address with VirusTotal to determine reputation and threat level."
'
echo ""

# Test 4: Malicious Domain Analysis
echo "🌍 Test 4: Analyzing suspicious domain"
echo "======================================"
docker compose exec nvidia-nat bash -c '
cd /workspace && nat run \
    --config_file=my-agents/open-soc/src/open_soc/configs/config.yml \
    --input "Security Alert: DNS queries detected to suspicious domain malicious-example.com from multiple workstations. Domain appears to be hosting malware C2 infrastructure. Please verify with VirusTotal and provide threat assessment."
'
echo ""

# Test 5: Multiple IOCs Analysis
echo "📊 Test 5: Comprehensive analysis with multiple IOCs"
echo "===================================================="
docker compose exec nvidia-nat bash -c '
cd /workspace && nat run \
    --config_file=my-agents/open-soc/src/open_soc/configs/config.yml \
    --input "Security Alert: Advanced persistent threat detected. Multiple IOCs identified: malicious hash d1ce4e040c4c0b5191e006d27f9c8202b52dcacb9b1b4fc5a8a7d8d0e8f9c0e1, suspicious IP 192.168.1.100, and command & control domain malicious-domain.example.com. Please analyze all IOCs with VirusTotal to confirm threat attribution and provide comprehensive security assessment."
'
echo ""

# Test 6: URL Analysis
echo "🔗 Test 6: Analyzing suspicious URL"
echo "==================================="
docker compose exec nvidia-nat bash -c '
cd /workspace && nat run \
    --config_file=my-agents/open-soc/src/open_soc/configs/config.yml \
    --input "Security Alert: Phishing URL detected in user email. URL: https://suspicious-phishing-site.example.com/login. Multiple users may have accessed this link. Please analyze with VirusTotal to determine threat level and provide security recommendations."
'
echo ""

# Test Scenario 7: ThreatFox Threat Campaign Analysis
echo "🦊 Test 7: ThreatFox Threat Campaign Analysis"
echo "=============================================="
docker compose exec nvidia-nat bash -c '
cd /workspace && nat run \
    --config_file=my-agents/open-soc/src/open_soc/configs/config.yml \
    --input "Security Alert: Advanced persistent threat detected with suspicious IP 185.220.101.182 and malicious domain banking-update.example.com. Please perform comprehensive threat hunting using ThreatFox to identify malware families, threat campaigns, and provide hunting recommendations."
'
echo ""

# Test Scenario 8: Combined VirusTotal + ThreatFox Analysis  
echo "🦠🦊 Test 8: Combined VirusTotal + ThreatFox Analysis"
echo "====================================================="
docker compose exec nvidia-nat bash -c '
cd /workspace && nat run \
    --config_file=my-agents/open-soc/src/open_soc/configs/config.yml \
    --input "Security Alert: Critical malware incident detected. File hash: 275a021bbfb6489e54d471899f7db9d1663fc695ec2fe2a2c4538aabf651fd0f, suspicious IP: 185.220.101.182, malicious domain: malware-c2.example.com. Please analyze ALL IOCs using both VirusTotal and ThreatFox to provide comprehensive threat assessment, malware attribution, and security recommendations."
'
echo ""

echo "🎯 VirusTotal + ThreatFox Integration Test Summary:"
echo "======================================"
echo "✅ Tests completed. Review the analysis results above to verify:"
echo "   • VirusTotal API integration is working correctly"
echo "   • ThreatFox API integration and threat hunting is functional"
echo "   • Threat assessment and virus scores are accurate"
echo "   • Malware family attribution and campaign tracking works"
echo "   • Security recommendations are appropriate"
echo "   • Both offline and live API modes function properly"
echo ""
echo "🔍 Expected Results:"
echo "   • Test 1 (EICAR): Should show high malicious detection ratio"
echo "   • Test 2 (Clean): Should show minimal to no detections"
echo "   • Test 3-6: Should provide comprehensive VirusTotal IOC analysis"
echo "   • Test 7-8: Should show ThreatFox threat campaign attribution"
echo ""
echo "📊 Key Metrics to Verify:"
echo "   • VirusTotal detection ratios (e.g., '45/70 engines detected')"
echo "   • ThreatFox threat campaign attribution and malware families"
echo "   • Threat levels (Critical/High/Medium/Low/Clean)"
echo "   • Security recommendations based on analysis"
echo "   • Proper handling of different IOC types"
echo "   • Combined analysis leveraging both threat intelligence sources"
echo ""