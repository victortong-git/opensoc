# SPDX-FileCopyrightText: Copyright (c) 2025, NVIDIA CORPORATION & AFFILIATES. All rights reserved.
# SPDX-License-Identifier: Apache-2.0

"""
Open-SOC: AI-Powered Security Operations Center Platform

This package provides a comprehensive set of AI-powered security analysis tools
organized into specialized agent categories:

- Core: Main orchestrator and essential classification services
- Log Analysis: Security log processing and analysis
- Threat Intelligence: External threat intelligence and hunting capabilities  
- IOC Analysis: Indicator analysis including VirusTotal integration
- Response Planning: Incident response and containment strategies
- Playbook Generation: Custom playbook creation and automation
"""

# Import all agent modules to ensure proper registration
from . import core
from . import agent_log_analysis
from . import agent_threat_intel_specialist
from . import agent_ioc_specialist
from . import agent_response_specialist
from . import agent_playbook_specialist
