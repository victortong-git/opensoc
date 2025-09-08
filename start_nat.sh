#!/bin/bash

# SPDX-FileCopyrightText: Copyright (c) 2025, NVIDIA CORPORATION & AFFILIATES. All rights reserved.
# SPDX-License-Identifier: Apache-2.0

# Start NeMo Agent Toolkit Docker Container

echo "Starting NeMo Agent Toolkit (NAT) container..."

# Start the container
docker compose -f docker-compose_nemo_agent_toolkit.yml up -d nvidia-nat

# Check if container started successfully
if [ $? -eq 0 ]; then
    echo "✅ NAT container started successfully!"
    echo ""
    echo "Container status:"
    docker compose -f docker-compose_nemo_agent_toolkit.yml ps nvidia-nat
    echo ""
    
    # Wait a moment for container to be fully ready
    sleep 2
    
    # Setup custom agents
    echo "🤖 Setting up custom agents..."
    if docker compose -f docker-compose_nemo_agent_toolkit.yml exec nvidia-nat bash -c "uv pip install -e my-agents/open-soc" 2>/dev/null; then
        echo "✅ Custom agents installed successfully"
    else
        echo "⚠️  Custom agent installation encountered issues"
    fi
    echo ""
    
    # Check and setup Ollama provider
    echo "🔧 Setting up Ollama provider..."
    if docker compose -f docker-compose_nemo_agent_toolkit.yml exec nvidia-nat bash -c "nat info components -t llm_provider | grep -q 'ollama'" 2>/dev/null; then
        echo "✅ Ollama provider already installed"
    else
        echo "📦 Installing Ollama provider..."
        if docker compose -f docker-compose_nemo_agent_toolkit.yml exec nvidia-nat bash -c "cd /workspace/ollama_provider && ./setup.sh --no-test" 2>/dev/null; then
            echo "✅ Ollama provider installed successfully"
        else
            echo "⚠️  Ollama provider installation encountered issues (may still work)"
        fi
    fi
    echo ""
    
    # Test connectivity to Ollama service
    echo "🔗 Testing Ollama connectivity..."
    if docker compose -f docker-compose_nemo_agent_toolkit.yml exec nvidia-nat bash -c "curl -s http://localhost:11434/api/version >/dev/null 2>&1"; then
        echo "✅ Ollama service is reachable at localhost:11434"
        # Try to get available models
        MODELS=$(docker compose -f docker-compose_nemo_agent_toolkit.yml exec nvidia-nat bash -c "curl -s http://localhost:11434/api/tags 2>/dev/null | jq -r '.models[].name' 2>/dev/null | head -3" 2>/dev/null)
        if [ ! -z "$MODELS" ]; then
            echo "📋 Available models: $(echo $MODELS | tr '\n' ' ')"
        fi
    else
        echo "❌ Cannot reach Ollama service at localhost:11434"
        echo "   Make sure Ollama is running on the host system"
        echo "   Or update OLLAMA_HOST in docker-compose_nemo_agent_toolkit.yml"
    fi
    echo ""
    
    echo "🚀 NAT is ready to use!"
    echo ""
    echo "Quick start commands:"
    echo "  • Test ollama: ./run_nat_example.sh"
    echo "  • Access container: docker compose exec nvidia-nat bash"
    echo "  • Check version: docker compose exec nvidia-nat nat --version"
    echo "  • View logs: docker compose -f docker-compose_nemo_agent_toolkit.yml logs nvidia-nat"
    echo ""
    echo "Example NAT command:"
    echo "  docker compose exec nvidia-nat nat run --config_file ollama_provider/examples/config_ollama_simple.yml --input 'Hello, world!'"
else
    echo "❌ Failed to start NAT container"
    exit 1
fi