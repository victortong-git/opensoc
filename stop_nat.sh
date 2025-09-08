#!/bin/bash

# SPDX-FileCopyrightText: Copyright (c) 2025, NVIDIA CORPORATION & AFFILIATES. All rights reserved.
# SPDX-License-Identifier: Apache-2.0

# Stop NeMo Agent Toolkit Docker Container

echo "Stopping NeMo Agent Toolkit (NAT) container..."

# Stop the container
docker compose -f docker-compose_nemo_agent_toolkit.yml down

# Check if container stopped successfully
if [ $? -eq 0 ]; then
    echo "✅ NAT container stopped successfully!"
    echo ""
    echo "Container and network have been removed."
    echo ""
    echo "To start again, run:"
    echo "  ./start_nat.sh"
else
    echo "❌ Failed to stop NAT container"
    exit 1
fi