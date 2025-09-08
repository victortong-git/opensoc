# SPDX-FileCopyrightText: Copyright (c) 2025, NVIDIA CORPORATION & AFFILIATES. All rights reserved.
# SPDX-License-Identifier: Apache-2.0

from pydantic.fields import Field
from aiq.builder.framework_enum import LLMFrameworkEnum
from aiq.cli.register_workflow import register_function
from aiq.data_models.component_ref import LLMRef
from aiq.data_models.function import FunctionBaseConfig
from ..core.prompts import IncidentResponsePlannerPrompts


class IncidentResponsePlannerConfig(FunctionBaseConfig, name="incident_response_planner"):
    """Configuration for the Incident Response Planner tool."""
    llm_name: LLMRef
    offline_mode: bool = Field(default=True, description="Whether to run in offline mode")


@register_function(config_type=IncidentResponsePlannerConfig, framework_wrappers=[LLMFrameworkEnum.LANGCHAIN])
async def incident_response_planner_function(config: IncidentResponsePlannerConfig, builder):
    """
    Generates incident response procedures and containment strategies based on threat analysis.
    """
    
    from langchain_core.language_models.chat_models import BaseChatModel
    
    llm: BaseChatModel = await builder.get_llm(config.llm_name, wrapper_type=LLMFrameworkEnum.LANGCHAIN)

    async def plan_incident_response(threat_type: str, severity_level: str, affected_systems: str) -> str:
        """
        Generate an incident response plan based on threat analysis.
        
        Args:
            threat_type: Type of security threat identified
            severity_level: Severity level (critical, high, medium, low)
            affected_systems: List of affected systems or assets
            
        Returns:
            Comprehensive incident response plan
        """
        
        if config.offline_mode:
            # Mock incident response plan
            mock_plan = f"""## Incident Response Plan: {threat_type.title()} - {severity_level.title()} Severity

### Immediate Response Actions (0-1 hours)
- **CONTAINMENT**: Isolate affected systems from network immediately
- **PRESERVATION**: Create forensic images of compromised systems
- **BLOCKING**: Implement firewall rules to block malicious IP addresses
- **NOTIFICATION**: Alert SOC manager and security team leads
- **DOCUMENTATION**: Begin incident tracking in security platform

### Investigation Procedures (1-24 hours)
- **LOG ANALYSIS**: Collect and analyze logs from affected systems
- **MALWARE ANALYSIS**: Submit suspicious files to sandbox for analysis
- **NETWORK FORENSICS**: Examine network traffic for lateral movement
- **USER INTERVIEWS**: Interview affected users about suspicious activities
- **SYSTEM IMAGING**: Create full forensic images for detailed analysis

### Communication Plan
- **INTERNAL**: Notify CISO, IT management, affected business units
- **EXTERNAL**: Contact law enforcement if required, prepare customer notifications
- **REGULATORY**: Assess reporting requirements (GDPR, SOX, etc.)
- **MEDIA**: Prepare communications strategy if public disclosure needed

### Recovery Strategy
- **REBUILD**: Rebuild compromised systems from clean backups
- **PATCH**: Apply security updates to prevent reinfection
- **MONITOR**: Enhanced monitoring of recovered systems for 30 days
- **VALIDATION**: Verify system integrity before returning to production

### Follow-up Actions
- **LESSONS LEARNED**: Conduct post-incident review within 1 week
- **SECURITY IMPROVEMENTS**: Implement additional controls based on findings
- **POLICY UPDATES**: Review and update security policies as needed
- **TRAINING**: Conduct security awareness training for affected users

**Estimated Recovery Time**: 2-5 business days
**Resources Required**: SOC analysts (2), Network engineers (1), System administrators (2)"""
            
            return mock_plan
        
        else:
            # Real incident response planning
            response_prompt = IncidentResponsePlannerPrompts.PROMPT.format(
                threat_type=threat_type,
                severity_level=severity_level,
                affected_systems=affected_systems
            )
            
            response = await llm.ainvoke(response_prompt)
            return f"## Incident Response Plan\n\n{response.content}"

    yield plan_incident_response