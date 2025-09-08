# SPDX-FileCopyrightText: Copyright (c) 2025, NVIDIA CORPORATION & AFFILIATES. All rights reserved.
# SPDX-License-Identifier: Apache-2.0

import logging
import typing
from pydantic.fields import Field

from aiq.builder.builder import Builder
from aiq.builder.framework_enum import LLMFrameworkEnum
from aiq.cli.register_workflow import register_function
from aiq.data_models.component_ref import LLMRef
from aiq.data_models.function import FunctionBaseConfig
from aiq.profiler.decorators.function_tracking import track_function

# Import SOC-specific tools
from ..agent_log_analysis import soc_log_analyzer
from ..agent_threat_intel_specialist import threat_intelligence_lookup
from . import security_event_classifier
from ..agent_ioc_specialist import ioc_analyzer
from ..agent_response_specialist import incident_response_planner
from ..agent_playbook_specialist import playbook_specialist
from ..agent_threat_intel_specialist import threat_hunting_specialist
from ..agent_ioc_specialist import virustotal_analyzer
from .prompts import SOC_AGENT_PROMPT


class SOCAgentWorkflowConfig(FunctionBaseConfig, name="soc_agent"):
    """
    Configuration for the SOC Agent workflow. This agent orchestrates multiple security tools
    to analyze and triage security alerts by:
    1. Analyzing security events and logs
    2. Performing threat intelligence lookups
    3. Classifying security incidents by severity and type
    4. Analyzing indicators of compromise (IOCs)
    5. Generating incident response recommendations
    """
    tool_names: list[str] = []
    llm_name: LLMRef
    offline_mode: bool = Field(default=True, description="Whether to run in offline mode")
    offline_data_path: str | None = Field(
        default="my-agents/open-soc/data/offline_security_data.csv",
        description="Path to the main offline dataset with security alerts and simulated environments")
    benign_fallback_data_path: str | None = Field(
        default="my-agents/open-soc/data/benign_security_fallback_data.json",
        description="Path to the JSON file with baseline/normal security behavior data")


@register_function(config_type=SOCAgentWorkflowConfig, framework_wrappers=[LLMFrameworkEnum.LANGCHAIN])
async def soc_agent_workflow(config: SOCAgentWorkflowConfig, builder: Builder):
    
    from langchain_core.messages import HumanMessage, SystemMessage
    from langgraph.graph import START, MessagesState, StateGraph
    from langgraph.prebuilt import ToolNode, tools_condition

    if typing.TYPE_CHECKING:
        from langchain_core.language_models.chat_models import BaseChatModel

    llm: "BaseChatModel" = await builder.get_llm(config.llm_name, wrapper_type=LLMFrameworkEnum.LANGCHAIN)

    # Get tools for SOC analysis
    tool_names = config.tool_names
    tools = []
    for tool_name in tool_names:
        tool = builder.get_tool(tool_name, wrapper_type=LLMFrameworkEnum.LANGCHAIN)
        tools.append(tool)
    llm_n_tools = llm.bind_tools(tools, parallel_tool_calls=True)

    # Get specialized tools
    security_classifier_tool = builder.get_tool("security_event_classifier", wrapper_type=LLMFrameworkEnum.LANGCHAIN)

    # Define assistant function that processes security events with the LLM
    async def soc_assistant(state: MessagesState):
        # Create system message with SOC-specific prompt
        sys_msg = SystemMessage(content=SOC_AGENT_PROMPT)
        # Invoke LLM with system message and conversation history
        return {"messages": [await llm_n_tools.ainvoke([sys_msg] + state["messages"])]}

    # Initialize state graph for managing conversation flow
    builder_graph = StateGraph(MessagesState)

    # Get tools specified in config
    tools = builder.get_tools(config.tool_names, wrapper_type=LLMFrameworkEnum.LANGCHAIN)

    # Add nodes to graph
    builder_graph.add_node("soc_assistant", soc_assistant)
    builder_graph.add_node("tools", ToolNode(tools))

    # Define graph edges to control conversation flow
    builder_graph.add_edge(START, "soc_assistant")
    builder_graph.add_conditional_edges(
        "soc_assistant",
        tools_condition,
    )
    builder_graph.add_edge("tools", "soc_assistant")

    # Compile graph into executable agent
    agent_executor = builder_graph.compile()

    @track_function()
    async def _process_security_alert(input_message: str) -> str:
        """Process a security alert through analysis, threat intel, and classification.
        
        Analyzes security events, performs threat intelligence lookups, and classifies
        the incident with appropriate response recommendations.
        """
        # Process security alert through agent
        output = await agent_executor.ainvoke({"messages": [HumanMessage(content=input_message)]})
        result = output["messages"][-1].content

        # Classify the security event and add severity/type information
        classification = await security_classifier_tool.arun(result)
        return result + classification

    async def _response_fn(input_message: str) -> str:
        """Process security alert message and return analysis with recommendations."""
        try:
            result = await _process_security_alert(input_message)
            return result
        finally:
            logging.info("Finished SOC agent execution")

    try:
        if config.offline_mode:
            # Note: offline data loading will be implemented later
            logging.info("Running SOC agent in offline mode")
        yield _response_fn

    except GeneratorExit:
        logging.info("SOC agent exited early!")
    finally:
        logging.info("SOC agent cleaning up")