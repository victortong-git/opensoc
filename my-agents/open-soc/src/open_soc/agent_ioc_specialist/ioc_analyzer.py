# SPDX-FileCopyrightText: Copyright (c) 2025, NVIDIA CORPORATION & AFFILIATES. All rights reserved.
# SPDX-License-Identifier: Apache-2.0

from pydantic.fields import Field
from aiq.builder.framework_enum import LLMFrameworkEnum
from aiq.cli.register_workflow import register_function
from aiq.data_models.component_ref import LLMRef
from aiq.data_models.function import FunctionBaseConfig
from ..core.prompts import IOCAnalyzerPrompts


class IOCAnalyzerConfig(FunctionBaseConfig, name="ioc_analyzer"):
    """Configuration for the IOC Analyzer tool."""
    llm_name: LLMRef
    offline_mode: bool = Field(default=True, description="Whether to run in offline mode")


@register_function(config_type=IOCAnalyzerConfig, framework_wrappers=[LLMFrameworkEnum.LANGCHAIN])
async def ioc_analyzer_function(config: IOCAnalyzerConfig, builder):
    """
    Analyzes individual indicators of compromise for reputation and threat context.
    """
    
    from langchain_core.language_models.chat_models import BaseChatModel
    
    llm: BaseChatModel = await builder.get_llm(config.llm_name, wrapper_type=LLMFrameworkEnum.LANGCHAIN)

    async def analyze_ioc(ioc_value: str, ioc_type: str = "ip") -> str:
        """
        Analyze a specific IOC for reputation and threat context.
        
        Args:
            ioc_value: The IOC value to analyze
            ioc_type: Type of IOC (ip, domain, hash, email)
            
        Returns:
            Detailed IOC analysis with reputation and threat context
        """
        
        if config.offline_mode:
            # Mock IOC analysis based on type
            if ioc_type.lower() == "ip":
                mock_analysis = f"""## IOC Analysis: {ioc_value}

**IOC Summary:** IPv4 Address - External source

**Reputation Analysis:** Malicious (High Confidence)
- First seen: 2024-11-15
- Last seen: 2025-01-10
- Threat categories: Botnet C2, Credential theft

**Threat Context:** 
- Associated with Emotet botnet infrastructure
- Used in credential harvesting campaigns
- Communicates on ports 443, 8080, 9443

**Relationship Mapping:**
- Connected to domains: malicious-c2.com, evil.tk
- Part of subnet: 192.168.1.0/24 (likely compromised range)

**Risk Assessment:** Critical - Immediate blocking recommended

**Technical Details:**
- Geolocation: Eastern Europe
- ASN: AS12345 (Suspicious hosting provider)
- SSL Certificate: Self-signed, invalid"""
            
            elif ioc_type.lower() == "hash":
                mock_analysis = f"""## IOC Analysis: {ioc_value}

**IOC Summary:** SHA256 Hash - Executable file

**Reputation Analysis:** Malicious (High Confidence)
- Detection ratio: 45/70 engines
- File type: Windows PE32 executable

**Threat Context:**
- Malware family: TrickBot
- Campaign: Banking trojan distribution
- Capabilities: Credential theft, lateral movement

**Relationship Mapping:**
- Dropped by: email attachment (doc_invoice.docx)
- C2 servers: 192.168.1.100, evil-c2.net

**Risk Assessment:** Critical - Quarantine immediately

**Technical Details:**
- File size: 2.3MB
- Compilation date: 2024-12-01
- Packed with UPX"""
            
            else:
                mock_analysis = f"""## IOC Analysis: {ioc_value}

**IOC Summary:** {ioc_type.title()} - Unknown reputation

**Reputation Analysis:** Suspicious (Medium Confidence)
- Limited intelligence available
- Requires further investigation

**Threat Context:** Insufficient data for threat attribution

**Risk Assessment:** Medium - Monitor and investigate"""
            
            return mock_analysis
        
        else:
            # Real IOC analysis
            ioc_prompt = IOCAnalyzerPrompts.PROMPT.format(
                ioc_value=ioc_value,
                ioc_type=ioc_type
            )
            
            response = await llm.ainvoke(ioc_prompt)
            return f"## IOC Analysis: {ioc_value}\n\n{response.content}"

    yield analyze_ioc