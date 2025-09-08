# SPDX-FileCopyrightText: Copyright (c) 2025, NVIDIA CORPORATION & AFFILIATES. All rights reserved.
# SPDX-License-Identifier: Apache-2.0

from pydantic.fields import Field
from aiq.builder.framework_enum import LLMFrameworkEnum
from aiq.cli.register_workflow import register_function
from aiq.data_models.component_ref import LLMRef
from aiq.data_models.function import FunctionBaseConfig
from ..core.prompts import ThreatIntelligenceLookupPrompts


class ThreatIntelligenceLookupConfig(FunctionBaseConfig, name="threat_intelligence_lookup"):
    """Configuration for the Threat Intelligence Lookup tool."""
    llm_name: LLMRef
    offline_mode: bool = Field(default=True, description="Whether to run in offline mode")


@register_function(config_type=ThreatIntelligenceLookupConfig, framework_wrappers=[LLMFrameworkEnum.LANGCHAIN])
async def threat_intelligence_lookup_function(config: ThreatIntelligenceLookupConfig, builder):
    """
    Queries threat intelligence databases for IOCs and attack attribution information.
    """
    
    from langchain_core.language_models.chat_models import BaseChatModel
    
    llm: BaseChatModel = await builder.get_llm(config.llm_name, wrapper_type=LLMFrameworkEnum.LANGCHAIN)

    async def lookup_threat_intelligence(ioc_list: str, threat_type: str = "unknown") -> str:
        """
        Look up threat intelligence for provided IOCs.
        
        Args:
            ioc_list: List of IOCs to analyze
            threat_type: Type of threat being investigated
            
        Returns:
            Threat intelligence analysis results
        """
        
        if config.offline_mode:
            # Mock threat intelligence data
            mock_intel = f"""## Threat Intelligence Analysis Results

**IOC Analysis Results:**
- 192.168.1.100: High Risk - Associated with APT29 campaigns, known C2 infrastructure
- admin@malicious.com: Medium Risk - Linked to phishing campaigns, first seen 2024-12
- c:\\temp\\backdoor.exe: Critical Risk - Known malware family 'SilentDrop', detected by 45/70 engines

**Threat Campaign Match:** APT29 (Cozy Bear) - Operation Ghost Writer

**Attack Techniques:** 
- T1110 (Brute Force)
- T1078 (Valid Accounts) 
- T1055 (Process Injection)

**Confidence Level:** High - Multiple corroborating sources

**Additional Context:** This IOC set matches recent APT29 infrastructure rotation patterns observed in Q4 2024."""
            
            return mock_intel
        
        else:
            # Real threat intelligence lookup
            intel_prompt = ThreatIntelligenceLookupPrompts.PROMPT.format(
                ioc_list=ioc_list,
                threat_type=threat_type
            )
            
            response = await llm.ainvoke(intel_prompt)
            return f"## Threat Intelligence Analysis Results\n\n{response.content}"

    yield lookup_threat_intelligence