# Creating New SOC AI Agents for OpenSOC

This comprehensive guide teaches developers how to create custom AI agents for the OpenSOC (Open Security Operations Center) platform using NVIDIA AIQ Toolkit.

## 📋 Table of Contents

1. [Introduction & Architecture](#introduction--architecture)
2. [Development Prerequisites](#development-prerequisites)
3. [Understanding Agent Patterns](#understanding-agent-patterns)
4. [Step-by-Step Agent Creation](#step-by-step-agent-creation)
5. [Configuration Management](#configuration-management)
6. [API Integration Patterns](#api-integration-patterns)
7. [Testing & Validation](#testing--validation)
8. [Advanced Features](#advanced-features)
9. [Integration Examples](#integration-examples)
10. [Troubleshooting Guide](#troubleshooting-guide)

## 📖 Introduction & Architecture

### OpenSOC Agent Framework

OpenSOC is built on NVIDIA AIQ Toolkit and follows a modular agent architecture where each agent specializes in specific security functions. The platform uses:

- **NVIDIA AIQ Toolkit** for agent orchestration and LLM integration
- **LangChain** for LLM operations and tool chaining
- **Pydantic** for configuration management and validation
- **Async/Await** patterns for concurrent operations
- **Local Ollama LLMs** for privacy and performance

### Current Agent Categories

```
OpenSOC Agent Structure
├── core/                          # Main orchestrator & essential services
├── agent_log_analysis/            # Security log processing
├── agent_threat_intel_specialist/ # Threat intelligence & hunting
├── agent_ioc_specialist/          # Indicator analysis
├── agent_response_specialist/     # Incident response planning
└── agent_playbook_specialist/     # Custom playbook generation
```

## 🛠️ Development Prerequisites

### Technical Requirements

- **Python 3.8+** with async/await support
- **NVIDIA AIQ Toolkit** knowledge
- **LangChain** framework familiarity
- **Pydantic** for data validation
- **Docker** and **Docker Compose**
- Understanding of **security concepts** (IOCs, SIEM, threat intelligence)

### Development Environment Setup

```bash
# Verify OpenSOC installation
docker compose exec aiqtoolkit bash -c "aiq info components -t package | grep open_soc"

# Check agent registration
docker compose exec aiqtoolkit bash -c "aiq info components -t function | grep soc"

# Verify configuration
docker compose exec aiqtoolkit bash -c "aiq run --config_file=my-agents/open-soc/src/open_soc/configs/config.yml --help"
```

## 🔍 Understanding Agent Patterns

### Core Agent Structure

Every OpenSOC agent follows this pattern:

```python
# 1. Imports and Dependencies
from aiq.builder.framework_enum import LLMFrameworkEnum
from aiq.cli.register_workflow import register_function
from aiq.data_models.component_ref import LLMRef
from aiq.data_models.function import FunctionBaseConfig
from pydantic.fields import Field

# 2. Configuration Class
class YourAgentConfig(FunctionBaseConfig, name="your_agent_name"):
    """Configuration for your agent."""
    llm_name: LLMRef
    offline_mode: bool = Field(default=True, description="Offline mode toggle")
    # Add your specific configuration fields

# 3. Function Registration and Implementation
@register_function(config_type=YourAgentConfig, framework_wrappers=[LLMFrameworkEnum.LANGCHAIN])
async def your_agent_function(config: YourAgentConfig, builder):
    """Your agent implementation."""
    
    # LLM setup
    from langchain_core.language_models.chat_models import BaseChatModel
    llm: BaseChatModel = await builder.get_llm(config.llm_name, wrapper_type=LLMFrameworkEnum.LANGCHAIN)
    
    # Agent implementation
    async def your_agent_tool(input_data: str) -> str:
        """Your agents main function."""
        # Implementation here
        return analysis_result
    
    # Yield the tool for registration
    yield your_agent_tool
```

## 🚀 Step-by-Step Agent Creation

### Example: Creating a "DNS Security Specialist" Agent

#### Step 1: Create the Agent File

**File**: `my-agents/open-soc/src/open_soc/agent_ioc_specialist/dns_security_specialist.py`

```python
# SPDX-FileCopyrightText: Copyright (c) 2025, NVIDIA CORPORATION & AFFILIATES. All rights reserved.
# SPDX-License-Identifier: Apache-2.0

import json
import logging
import os
import time
from typing import Dict, List, Optional
import requests
from pydantic.fields import Field
from aiq.builder.framework_enum import LLMFrameworkEnum
from aiq.cli.register_workflow import register_function
from aiq.data_models.component_ref import LLMRef
from aiq.data_models.function import FunctionBaseConfig
from ..core.prompts import DNSSecuritySpecialistPrompts


class DNSSecuritySpecialistConfig(FunctionBaseConfig, name="dns_security_specialist"):
    """Configuration for the DNS Security Specialist tool."""
    llm_name: LLMRef
    offline_mode: bool = Field(default=True, description="Whether to run in offline mode")
    dns_api_key: str = Field(default="", description="DNS API key")
    dns_api_url: str = Field(default="https://dns.quad9.net/dns-query", description="DNS-over-HTTPS endpoint")
    rate_limit_delay: float = Field(default=0.5, description="Delay between DNS queries in seconds")
    max_queries: int = Field(default=10, description="Maximum DNS queries per analysis")


@register_function(config_type=DNSSecuritySpecialistConfig, framework_wrappers=[LLMFrameworkEnum.LANGCHAIN])
async def dns_security_specialist_function(config: DNSSecuritySpecialistConfig, builder):
    """DNS Security Specialist for domain threat analysis."""
    
    from langchain_core.language_models.chat_models import BaseChatModel
    llm: BaseChatModel = await builder.get_llm(config.llm_name, wrapper_type=LLMFrameworkEnum.LANGCHAIN)

    class DNSAnalysisClient:
        def __init__(self):
            self.api_key = config.dns_api_key or os.getenv("DNS_API_KEY", "")
            self.api_url = config.dns_api_url
            self.rate_limit_delay = config.rate_limit_delay

        def analyze_domain(self, domain: str) -> Dict:
            """Analyze a domain for security threats."""
            
            if config.offline_mode:
                return {
                    "domain": domain,
                    "status": "offline_mode", 
                    "threat_score": 0,
                    "analysis": "Offline mode - no real DNS analysis"
                }
            
            # Real DNS analysis implementation would go here
            return {"domain": domain, "status": "analyzed", "threat_score": 25}

    async def analyze_dns_security(incident_data: str, domains: str = "") -> str:
        """Perform DNS security analysis on domains from incident data."""
        
        # Extract domains from input
        domain_list = [d.strip() for d in domains.split(",") if d.strip()] if domains else []
        
        if not domain_list:
            return "No domains provided for DNS security analysis."
        
        client = DNSAnalysisClient()
        results = []
        
        for domain in domain_list[:config.max_queries]:
            result = client.analyze_domain(domain)
            results.append(result)
        
        # Generate report
        report = f"# DNS Security Analysis Report\\n\\n"
        for result in results:
            report += f"**{result[domain]}**: Threat Score {result[threat_score]} ({result[status]})\\n"
        
        return report

    yield analyze_dns_security
```

#### Step 2: Add Prompt Template

Update `my-agents/open-soc/src/open_soc/core/prompts.py`:

```python
class DNSSecuritySpecialistPrompts:
    TOOL_DESCRIPTION = """Analyzes domain names and DNS queries for security threats. Args: incident_data: str, domains: str"""
    PROMPT = """You are analyzing DNS security for potential threats and malicious domains.
    
Analyze the provided domains for:
- Domain reputation and threat intelligence
- DNS anomalies and suspicious patterns
- Links to known malware campaigns
- Risk assessment and recommendations

Domains to analyze: {domains}
Incident context: {incident_data}

Provide detailed security analysis with actionable recommendations."""
```

#### Step 3: Register the Agent

Update `my-agents/open-soc/src/open_soc/agent_ioc_specialist/__init__.py`:

```python
from .dns_security_specialist import *
```

Update `my-agents/open-soc/src/open_soc/register.py`:

```python
from .agent_ioc_specialist import dns_security_specialist
```

#### Step 4: Configure the Agent

Update `my-agents/open-soc/src/open_soc/configs/config.yml`:

```yaml
functions:
  dns_security_specialist:
    _type: dns_security_specialist
    llm_name: soc_tool_llm
    offline_mode: true
    dns_api_key: "${DNS_API_KEY}"
    dns_api_url: "https://dns.quad9.net/dns-query"
    rate_limit_delay: 0.5
    max_queries: 10

workflow:
  tool_names:
    - dns_security_specialist
```

## ⚙️ Configuration Management

### Configuration Best Practices

1. **Environment Variables**: Use for sensitive data
```yaml
api_key: "${YOUR_API_KEY}"  # Reads from environment
```

2. **Offline Mode**: Always support offline testing
```python
offline_mode: bool = Field(default=True, description="Enable for testing")
```

3. **Rate Limiting**: Implement for external APIs
```python
rate_limit_delay: float = Field(default=1.0)
```

## 🔌 API Integration Patterns

### Simple HTTP API Integration

```python
class APIClient:
    def __init__(self, api_key: str, base_url: str):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {"Authorization": f"Bearer {api_key}"}
    
    def query_api(self, endpoint: str, params: Dict) -> Dict:
        response = requests.get(f"{self.base_url}/{endpoint}", 
                              params=params, headers=self.headers)
        response.raise_for_status()
        return response.json()
```

### Rate-Limited API Integration

```python
import time

class RateLimitedClient:
    def __init__(self, rate_limit_delay: float):
        self.rate_limit_delay = rate_limit_delay
        self.last_request_time = 0
    
    def _enforce_rate_limit(self):
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        if time_since_last < self.rate_limit_delay:
            sleep_time = self.rate_limit_delay - time_since_last
            time.sleep(sleep_time)
        self.last_request_time = time.time()
```

## 🧪 Testing & Validation

### Test Your Agent

```bash
# Check registration
docker compose exec aiqtoolkit bash -c "aiq info components -t function | grep dns_security"

# Test functionality
docker compose exec aiqtoolkit bash -c "aiq run --config_file=my-agents/open-soc/src/open_soc/configs/config.yml --input \"Security alert involving suspicious domain example.com\""
```

### Validation Checklist

- [ ] Agent registers successfully
- [ ] Configuration loads without errors  
- [ ] Offline mode works
- [ ] Online mode works with API credentials
- [ ] Error handling works for API failures
- [ ] Rate limiting prevents API abuse
- [ ] Output format matches SOC requirements
- [ ] Logging provides debugging information

## 🚀 Advanced Features

### Offline Mode Implementation

```python
async def your_analysis_function(data: str) -> str:
    if config.offline_mode:
        return {
            "status": "offline_mode",
            "analysis": "Mock analysis result", 
            "recommendations": ["Enable online mode for live analysis"]
        }
    
    # Real implementation
    return await perform_real_analysis(data)
```

### Error Handling

```python
async def robust_api_call(self, endpoint: str, data: Dict) -> Dict:
    try:
        response = await self._make_request(endpoint, data)
        return self._parse_response(response)
    
    except requests.exceptions.Timeout:
        logging.error(f"API timeout for {endpoint}")
        return {"error": "timeout", "status": "failed"}
    
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 401:
            return {"error": "authentication_failed", "status": "failed"}
        elif e.response.status_code == 429:
            return {"error": "rate_limit_exceeded", "status": "failed"}
    
    except Exception as e:
        logging.error(f"Unexpected error: {e}")
        return {"error": "unexpected_error", "status": "failed"}
```

## 💡 Integration Examples

### SIEM Integration Agent

```python
class SIEMIntegrationConfig(FunctionBaseConfig, name="siem_integration"):
    siem_type: str = Field(default="splunk", description="SIEM platform type")
    siem_url: str = Field(description="SIEM API endpoint")
    username: str = Field(description="SIEM username")
    password: str = Field(description="SIEM password")

@register_function(config_type=SIEMIntegrationConfig, framework_wrappers=[LLMFrameworkEnum.LANGCHAIN])
async def siem_integration_function(config: SIEMIntegrationConfig, builder):
    
    async def search_siem(incident_data: str, search_query: str = "") -> str:
        """Search SIEM for related events."""
        
        if config.offline_mode:
            return "Offline mode - mock SIEM search results"
        
        # Real SIEM integration
        client = SIEMClient(config.siem_url, config.username, config.password)
        results = await client.search(search_query)
        return format_siem_results(results)
    
    yield search_siem
```

## 🔧 Troubleshooting Guide

### Common Issues

#### Agent Not Registering
**Problem**: Agent doesnt appear in function list

**Solutions**:
1. Check import in `register.py`
2. Verify `@register_function` decorator
3. Check for syntax errors
4. Ensure `__init__.py` exports are correct

#### Configuration Errors
**Problem**: Configuration validation fails

**Solutions**:
1. Validate YAML syntax
2. Check Pydantic field definitions
3. Verify field names match config file
4. Check required vs optional fields

#### Import Path Issues
**Problem**: `ImportError` or `ModuleNotFoundError`

**Solutions**:
1. Check relative import paths
2. Verify `__init__.py` files exist
3. Ensure folder structure matches imports

### Debug Commands

```bash
# Check registration
docker compose exec aiqtoolkit bash -c "aiq info components -t function"

# Test configuration
docker compose exec aiqtoolkit bash -c "aiq run --config_file=path/to/config.yml --help"

# View logs
docker-compose logs aiqtoolkit | tail -100
```

## 📚 Best Practices Summary

### Development Best Practices
1. **Always implement offline mode** for testing
2. **Use type hints** and Pydantic validation
3. **Implement proper error handling** for all external calls
4. **Add comprehensive logging** for debugging
5. **Follow async/await patterns** consistently
6. **Rate limit external API calls**
7. **Validate all inputs** before processing

### Security Best Practices
1. **Never hardcode credentials** in source code
2. **Use environment variables** for sensitive data
3. **Implement proper authentication** for APIs
4. **Validate and sanitize** all external data
5. **Log security events** appropriately
6. **Use HTTPS** for all external communications

---

**Ready to Build? 🚀**

You now have everything needed to create powerful SOC AI agents for the OpenSOC platform. Start with the DNS Security Specialist example, then adapt the patterns to create agents that integrate with your specific security tools and workflows.

**Happy Building\! 🔐**
