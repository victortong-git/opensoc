#!/bin/bash

# SPDX-FileCopyrightText: Copyright (c) 2025, NVIDIA CORPORATION & AFFILIATES. All rights reserved.
# SPDX-License-Identifier: Apache-2.0

# NeMo Agent Toolkit (NAT) Example Scripts
# Clone official examples and test NAT functionality

echo "🚀 Running NAT examples and tests..."
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

# Show Ollama environment configuration
echo "🔧 Ollama environment configuration:"
docker compose exec nvidia-nat bash -c 'echo "OLLAMA_HOST: $OLLAMA_HOST"; echo "OLLAMA_PORT: $OLLAMA_PORT"; echo "OLLAMA_URL: $OLLAMA_URL"'
echo ""

# Test connection to Ollama host
echo "🔗 Testing connection to Ollama service:"
docker compose exec nvidia-nat bash -c 'curl -s $OLLAMA_URL/api/version 2>/dev/null && echo "✅ Ollama service is reachable at $OLLAMA_URL" || echo "❌ Cannot reach Ollama service at $OLLAMA_URL"'
echo ""

# Clone official examples if not already present
echo "📦 Setting up official NAT examples..."
docker compose exec nvidia-nat bash -c '
if [ ! -d "/workspace/nvidia-nat" ]; then
    echo "Cloning official NeMo Agent Toolkit repository..."
    git clone https://github.com/NVIDIA/NeMo-Agent-Toolkit.git nvidia-nat
    if [ $? -eq 0 ]; then
        echo "✅ Successfully cloned NAT repository"
    else
        echo "❌ Failed to clone repository"
        exit 1
    fi
else
    echo "✅ NAT repository already exists"
fi
'
echo ""

# Run a simple example (if examples exist)
echo "🎯 Running example workflows:"
echo ""

# Example 1: Ollama simple test (if ollama provider is installed)
echo "Example 1: Ollama Simple Test"
docker compose exec nvidia-nat bash -c '
if nat info components -t llm_provider | grep -q "ollama"; then
    echo "Running Ollama simple test..."
    cd /workspace
    nat run --config_file ollama_provider/examples/config_ollama_simple.yml --input '\''What is data security and data encryption? Explain it in 500 words'\''
else
    echo "⚠️  Ollama provider not installed - run ollama_provider/setup.sh first"
fi
'
echo ""


echo "✅ NAT example execution completed."
