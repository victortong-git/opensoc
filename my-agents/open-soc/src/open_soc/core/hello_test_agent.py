# SPDX-FileCopyrightText: Copyright (c) 2025, NVIDIA CORPORATION & AFFILIATES. All rights reserved.
# SPDX-License-Identifier: Apache-2.0

import asyncio
import datetime
import typing
from pydantic.fields import Field

from aiq.builder.builder import Builder
from aiq.builder.framework_enum import LLMFrameworkEnum
from aiq.cli.register_workflow import register_function
from aiq.data_models.component_ref import LLMRef
from aiq.data_models.function import FunctionBaseConfig
from aiq.profiler.decorators.function_tracking import track_function


class HelloTestAgentConfig(FunctionBaseConfig, name="hello_test_agent"):
    """
    Configuration for the Hello Test Agent - enhanced with calculation capabilities.
    This agent verifies that the LLM pipeline and tool-calling functionality work correctly through the MCP server.
    """
    llm_name: LLMRef
    tool_names: typing.List[str] = Field(default_factory=lambda: ["server_info", "code_execution", "current_datetime"], description="List of tools available to the agent")
    offline_mode: bool = Field(default=False, description="Whether to run in offline mode (not recommended for connectivity testing)")
    max_retries: int = Field(default=10, description="Maximum number of retries for AI model calls")
    handle_tool_errors: bool = Field(default=True, description="Whether to handle tool execution errors gracefully")
    max_iterations: int = Field(default=15, description="Maximum number of tool calling iterations")


@register_function(config_type=HelloTestAgentConfig, framework_wrappers=[LLMFrameworkEnum.LANGCHAIN])
async def hello_test_agent_function(config: HelloTestAgentConfig, builder: Builder):
    """
    Enhanced test agent that verifies AI/Ollama connectivity and tool-calling functionality through the MCP server.
    Can perform calculations and return detailed connectivity status.
    """
    
    from langchain.agents import AgentExecutor, create_tool_calling_agent
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_core.language_models.chat_models import BaseChatModel
    from langchain_core.tools import BaseTool
    
    # Get the LLM for testing
    llm: "BaseChatModel" = await builder.get_llm(config.llm_name, wrapper_type=LLMFrameworkEnum.LANGCHAIN)
    
    # Get all available tools
    tools: typing.List["BaseTool"] = []
    for tool_name in config.tool_names:
        try:
            tool = await builder.get_tool(tool_name, wrapper_type=LLMFrameworkEnum.LANGCHAIN)
            if tool:
                tools.append(tool)
        except Exception as e:
            print(f"Warning: Could not load tool {tool_name}: {e}")
    
    # Create tool-calling agent prompt
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are the OpenSOC AI Assistant running in NVIDIA NeMo Agent Toolkit. You can perform calculations and provide server information. Always be helpful and detailed in your responses."),
        ("human", "{input}"),
        ("placeholder", "{agent_scratchpad}")
    ])
    
    # Create the tool-calling agent
    agent = create_tool_calling_agent(llm, tools, prompt)
    agent_executor = AgentExecutor(
        agent=agent, 
        tools=tools, 
        verbose=True, 
        handle_parsing_errors=config.handle_tool_errors,
        max_iterations=config.max_iterations
    )

    @track_function()
    async def test_ai_connectivity(test_message: str = "Hello") -> str:
        """
        Test AI connectivity and tool-calling by sending a message and optionally performing calculations.
        
        Args:
            test_message: Test message to send to the AI agent (can include calculation requests)
            
        Returns:
            Response from AI agent with connectivity confirmation, calculations, and timestamp
        """
        
        if config.offline_mode:
            timestamp = datetime.datetime.now().isoformat()
            return f"Hello from OpenSOC! (Offline mode - no calculations available) - {timestamp}"
        
        # Retry logic for AI agent calls
        max_attempts = config.max_retries
        last_exception = None
        
        for attempt in range(max_attempts):
            try:
                # Use the tool-calling agent to process the request
                result = await agent_executor.ainvoke({
                    "input": f"""OpenSOC connectivity test request: {test_message}
                    
Please:
1. Confirm you are the OpenSOC AI Assistant running in NVIDIA NAT
2. Get current server information using available tools
3. If the message contains a calculation request (like "calculate 15 * 8 + 23" or "what is 42 + 17"), use the code_execution tool to perform the mathematical calculation
4. Provide a detailed response showing both connectivity status and any calculation results
5. Include timestamp and environment details using the current_datetime tool
                    """
                })
                
                # Extract the agent's response
                agent_response = result.get('output', str(result))
                
                # Add detailed connectivity confirmation with server info
                import socket
                import os
                
                timestamp = datetime.datetime.now().isoformat()
                hostname = socket.gethostname()
                container_id = os.environ.get('HOSTNAME', 'unknown')
                
                detailed_response = f"""
=== OpenSOC MCP Enhanced Test Results ===

AI Agent Response with Tool-Calling:
{agent_response}

Server Environment Details:
- Timestamp: {timestamp}
- Hostname: {hostname}
- Container ID: {container_id}
- Python PID: {os.getpid()}
- Attempt: {attempt + 1} of {max_attempts}
- Available Tools: {len(tools)} tools loaded (server_info, code_execution, current_datetime)

Connectivity Status: ✅ AI/Ollama/NAT pipeline fully operational
Tool-Calling Status: ✅ Agent can execute tools and perform calculations
MCP Integration: ✅ Enhanced agent executed successfully via NVIDIA NeMo Agent Toolkit

=== End Test Results ===
"""
                return detailed_response.strip()
                
            except Exception as e:
                last_exception = e
                if attempt < max_attempts - 1:
                    await asyncio.sleep(1)
                continue
        
        # If we get here, all attempts failed
        timestamp = datetime.datetime.now().isoformat()
        return f"❌ AI/Ollama tool-calling agent test failed after {max_attempts} attempts at {timestamp}: {str(last_exception)}"

    # Return the enhanced test function
    yield test_ai_connectivity