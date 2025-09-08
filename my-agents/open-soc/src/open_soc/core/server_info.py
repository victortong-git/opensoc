# SPDX-FileCopyrightText: Copyright (c) 2025, NVIDIA CORPORATION & AFFILIATES. All rights reserved.
# SPDX-License-Identifier: Apache-2.0

import datetime
import socket
import os
from nat.cli.register_workflow import register_function
from nat.data_models.function import FunctionBaseConfig
from nat.builder.builder import Builder
from nat.builder.function_info import FunctionInfo


class ServerInfoConfig(FunctionBaseConfig, name="server_info"):
    """
    Simple server information tool for connectivity testing.
    Returns current server details, timestamp, and environment info.
    """
    pass


@register_function(config_type=ServerInfoConfig)
async def server_info_function(config: ServerInfoConfig, builder: Builder):
    """
    Simple tool that returns server information for MCP connectivity testing.
    """

    async def get_server_info(unused: str) -> str:
        """
        Get current server information including timestamp, hostname, and environment details.
        
        Args:
            unused: Unused parameter for NAT compatibility
            
        Returns:
            String with formatted server information for connectivity verification
        """
        
        try:
            timestamp = datetime.datetime.now().isoformat()
            hostname = socket.gethostname()
            container_id = os.environ.get('HOSTNAME', 'unknown')
            process_pid = os.getpid()
            
            server_info = f"""OpenSOC MCP Server Information:
- Current Time: {timestamp}
- Hostname: {hostname}
- Container ID: {container_id}  
- Process PID: {process_pid}
- MCP Server: Operational
- NVIDIA NAT: Running
- Ollama: Available at {os.getenv("LLM_BASE_URL", "").replace("/v1", "")}"""
            
            return server_info
            
        except Exception as e:
            timestamp = datetime.datetime.now().isoformat()
            return f"Server info error at {timestamp}: {str(e)}"

    yield FunctionInfo.from_fn(get_server_info,
                              description="Returns current server information including timestamp, hostname, and MCP connectivity status.")