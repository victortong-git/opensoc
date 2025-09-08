# SPDX-FileCopyrightText: Copyright (c) 2025, NVIDIA CORPORATION & AFFILIATES. All rights reserved.  
# SPDX-License-Identifier: Apache-2.0

import json
from pydantic.fields import Field
from aiq.builder.framework_enum import LLMFrameworkEnum
from aiq.cli.register_workflow import register_function
from aiq.data_models.component_ref import LLMRef
from aiq.data_models.function import FunctionBaseConfig
from ..core.prompts import SOCLogAnalyzerPrompts


class SOCLogAnalyzerConfig(FunctionBaseConfig, name="soc_log_analyzer"):
    """Configuration for the SOC Log Analyzer tool that analyzes security logs for patterns and IOCs."""
    llm_name: LLMRef
    offline_mode: bool = Field(default=True, description="Whether to run in offline mode with mock data")


@register_function(config_type=SOCLogAnalyzerConfig, framework_wrappers=[LLMFrameworkEnum.LANGCHAIN])
async def soc_log_analyzer_function(config: SOCLogAnalyzerConfig, builder):
    """
    Analyzes security logs and events to identify patterns, correlations, and indicators of compromise.
    """
    
    from langchain_core.language_models.chat_models import BaseChatModel
    
    # Get the LLM for log analysis
    llm: BaseChatModel = await builder.get_llm(config.llm_name, wrapper_type=LLMFrameworkEnum.LANGCHAIN)

    async def analyze_security_logs(log_data: str, time_range: str = "24h") -> str:
        """
        Analyze security log data for suspicious patterns and potential IOCs.
        
        Args:
            log_data: Security log entries to analyze (JSON or text format)
            time_range: Time range for the analysis (default: 24h)
            
        Returns:
            Structured analysis of the log data with security insights
        """
        
        if config.offline_mode:
            # Mock log analysis for offline testing
            mock_analysis = {
                "timeline_analysis": [
                    "2025-01-15 14:23:12 - Multiple failed SSH login attempts from IP 192.168.1.100",
                    "2025-01-15 14:25:45 - Successful login from same IP after brute force attempt",  
                    "2025-01-15 14:27:30 - Privilege escalation attempt detected",
                    "2025-01-15 14:30:15 - Unusual file access patterns in /etc/passwd"
                ],
                "suspicious_activities": [
                    "Brute force SSH attack pattern detected",
                    "Successful authentication after multiple failures",
                    "Privilege escalation via sudo",
                    "Access to sensitive system files"
                ],
                "ioc_candidates": [
                    "IP: 192.168.1.100 (source of attack)",
                    "User: admin (compromised account)",
                    "Process: /usr/bin/sudo (privilege escalation)"
                ],
                "confidence_assessment": "High - Clear attack pattern with successful compromise",
                "recommended_followup": [
                    "Block IP 192.168.1.100 immediately",
                    "Reset credentials for 'admin' account",
                    "Review all sudo activity in timeframe",
                    "Check for lateral movement indicators"
                ]
            }
            
            # Format as readable analysis report
            result = f"""## Security Log Analysis Results

**Timeline Analysis:**
{chr(10).join(f"- {event}" for event in mock_analysis['timeline_analysis'])}

**Suspicious Activities:**
{chr(10).join(f"- {activity}" for activity in mock_analysis['suspicious_activities'])}

**IOC Candidates:**
{chr(10).join(f"- {ioc}" for ioc in mock_analysis['ioc_candidates'])}

**Confidence Assessment:** {mock_analysis['confidence_assessment']}

**Recommended Follow-up:**
{chr(10).join(f"- {action}" for action in mock_analysis['recommended_followup'])}"""

            return result
        
        else:
            # Real log analysis using LLM
            analysis_prompt = SOCLogAnalyzerPrompts.PROMPT.format(
                log_data=log_data,
                time_range=time_range
            )
            
            # Get analysis from LLM
            response = await llm.ainvoke(analysis_prompt)
            
            return f"## Security Log Analysis Results\n\n{response.content}"

    # Return the tool function
    yield analyze_security_logs