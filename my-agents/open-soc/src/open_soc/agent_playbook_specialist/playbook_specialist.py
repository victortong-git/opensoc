# SPDX-FileCopyrightText: Copyright (c) 2025, NVIDIA CORPORATION & AFFILIATES. All rights reserved.
# SPDX-License-Identifier: Apache-2.0

import json
import logging
from pydantic.fields import Field
from aiq.builder.framework_enum import LLMFrameworkEnum
from aiq.cli.register_workflow import register_function
from aiq.data_models.component_ref import LLMRef
from aiq.data_models.function import FunctionBaseConfig
from ..core.prompts import PlaybookSpecialistPrompts


class PlaybookSpecialistConfig(FunctionBaseConfig, name="playbook_specialist"):
    """Configuration for the Playbook Specialist tool."""
    llm_name: LLMRef
    offline_mode: bool = Field(default=True, description="Whether to run in offline mode")


@register_function(config_type=PlaybookSpecialistConfig, framework_wrappers=[LLMFrameworkEnum.LANGCHAIN])
async def playbook_specialist_function(config: PlaybookSpecialistConfig, builder):
    """
    Generates custom, incident-specific playbooks based on security events, incidents, 
    host information, and case details tailored for specific security scenarios.
    """
    
    from langchain_core.language_models.chat_models import BaseChatModel
    
    llm: BaseChatModel = await builder.get_llm(config.llm_name, wrapper_type=LLMFrameworkEnum.LANGCHAIN)

    async def generate_playbook(incident_data: str, incident_type: str, severity: str, affected_systems: str = "") -> str:
        """
        Generate a custom playbook based on incident context.
        
        Args:
            incident_data: Detailed incident information and context
            incident_type: Type of security incident (e.g., malware_infection, network_intrusion)
            severity: Severity level (critical, high, medium, low)
            affected_systems: List of affected systems or hosts
            
        Returns:
            JSON-formatted playbook compatible with OpenSOC backend API
        """
        
        if config.offline_mode:
            # Generate mock playbook based on incident type and severity
            logging.info(f"Generating offline playbook for {incident_type} - {severity} severity")
            
            # Determine playbook category and base steps
            category_mapping = {
                "malware_infection": "Malware Response",
                "network_intrusion": "Network Security",
                "data_exfiltration": "Data Protection",
                "phishing_attack": "Email Security", 
                "unauthorized_access": "Access Control",
                "vulnerability_exploitation": "Vulnerability Management",
                "denial_of_service": "Service Availability",
                "insider_threat": "Insider Threat Response"
            }
            
            category = category_mapping.get(incident_type, "General Security Response")
            
            # Base playbook structure with context-aware steps
            base_steps = []
            step_id = 1
            
            # Initial assessment steps (common for all incidents)
            base_steps.extend([
                {
                    "id": f"step-{step_id}",
                    "name": "Initial Incident Assessment",
                    "type": "manual",
                    "description": f"Assess the {incident_type} incident and gather initial information about scope and impact",
                    "timeout": 300,
                    "isRequired": True,
                    "order": step_id
                }
            ])
            step_id += 1
            
            # Incident-specific containment steps
            if incident_type == "malware_infection":
                base_steps.extend([
                    {
                        "id": f"step-{step_id}",
                        "name": "Isolate Infected Systems",
                        "type": "automated",
                        "description": "Automatically isolate infected systems from network to prevent malware spread",
                        "timeout": 180,
                        "isRequired": True,
                        "order": step_id
                    },
                    {
                        "id": f"step-{step_id + 1}",
                        "name": "Malware Analysis",
                        "type": "manual",
                        "description": "Analyze malware sample using sandbox and threat intelligence tools",
                        "timeout": 1800,
                        "isRequired": True,
                        "order": step_id + 1
                    }
                ])
                step_id += 2
                
            elif incident_type == "network_intrusion":
                base_steps.extend([
                    {
                        "id": f"step-{step_id}",
                        "name": "Block Malicious Network Traffic",
                        "type": "automated",
                        "description": "Configure firewall rules to block identified malicious IP addresses and ports",
                        "timeout": 120,
                        "isRequired": True,
                        "order": step_id
                    },
                    {
                        "id": f"step-{step_id + 1}",
                        "name": "Network Forensics Analysis",
                        "type": "manual",
                        "description": "Analyze network logs and traffic patterns to identify attack vectors and lateral movement",
                        "timeout": 2400,
                        "isRequired": True,
                        "order": step_id + 1
                    }
                ])
                step_id += 2
                
            elif incident_type == "data_exfiltration":
                base_steps.extend([
                    {
                        "id": f"step-{step_id}",
                        "name": "Block Data Transfer",
                        "type": "automated",
                        "description": "Implement DLP controls to prevent further unauthorized data transfers",
                        "timeout": 240,
                        "isRequired": True,
                        "order": step_id
                    },
                    {
                        "id": f"step-{step_id + 1}",
                        "name": "Data Impact Assessment",
                        "type": "manual",
                        "description": "Assess which data was compromised and evaluate business impact",
                        "timeout": 3600,
                        "isRequired": True,
                        "order": step_id + 1
                    }
                ])
                step_id += 2
                
            elif incident_type == "phishing_attack":
                base_steps.extend([
                    {
                        "id": f"step-{step_id}",
                        "name": "Email Quarantine",
                        "type": "automated",
                        "description": "Remove malicious emails from all user mailboxes and quarantine threats",
                        "timeout": 300,
                        "isRequired": True,
                        "order": step_id
                    },
                    {
                        "id": f"step-{step_id + 1}",
                        "name": "User Communication",
                        "type": "manual",
                        "description": "Notify affected users and provide security awareness guidance",
                        "timeout": 600,
                        "isRequired": True,
                        "order": step_id + 1
                    }
                ])
                step_id += 2
            
            # Evidence collection (severity-dependent timing)
            evidence_timeout = 900 if severity in ["critical", "high"] else 1800
            base_steps.append({
                "id": f"step-{step_id}",
                "name": "Evidence Collection",
                "type": "automated",
                "description": "Collect digital forensics evidence including system images, logs, and memory dumps",
                "timeout": evidence_timeout,
                "isRequired": True,
                "order": step_id
            })
            step_id += 1
            
            # Communication and reporting
            base_steps.append({
                "id": f"step-{step_id}",
                "name": "Stakeholder Notification",
                "type": "manual",
                "description": "Notify relevant stakeholders including CISO, legal team, and affected business units",
                "timeout": 600,
                "isRequired": True,
                "order": step_id
            })
            step_id += 1
            
            # Recovery steps
            recovery_timeout = 3600 if severity == "critical" else 7200
            base_steps.append({
                "id": f"step-{step_id}",
                "name": "System Recovery",
                "type": "manual", 
                "description": "Restore affected systems from clean backups and verify system integrity",
                "timeout": recovery_timeout,
                "isRequired": True,
                "order": step_id
            })
            
            # Calculate total estimated time
            total_time = sum(step.get("timeout", 0) for step in base_steps)
            
            # Generate contextual trigger conditions
            trigger_conditions = {
                "incident_type": incident_type,
                "severity_threshold": severity,
                "affected_system_types": affected_systems.split(",") if affected_systems else [],
                "auto_trigger": severity in ["critical", "high"]
            }
            
            # Create playbook structure compatible with OpenSOC backend
            playbook_data = {
                "name": f"{category} Playbook - {incident_type.replace('_', ' ').title()}",
                "description": f"Custom playbook for {incident_type.replace('_', ' ')} incidents with {severity} severity level. Generated based on specific incident context and affected systems.",
                "category": category,
                "triggerType": "automatic" if severity in ["critical", "high"] else "manual",
                "steps": base_steps,
                "isActive": True,
                "estimatedTime": total_time,
                "complexityLevel": "advanced" if severity in ["critical", "high"] else "intermediate",
                "triggerConditions": trigger_conditions,
                "inputParameters": {
                    "incident_type": incident_type,
                    "severity": severity,
                    "affected_systems": affected_systems,
                    "incident_data": "Contextual incident information"
                },
                "outputFormat": {
                    "execution_log": "Detailed step-by-step execution results",
                    "evidence_collected": "List of forensic artifacts and evidence",
                    "remediation_status": "Status of containment and recovery actions"
                },
                "metadata": {
                    "generated_by": "playbook_specialist_agent",
                    "generation_timestamp": "2025-01-15T00:00:00Z",
                    "incident_context": incident_data[:200] + "..." if len(incident_data) > 200 else incident_data,
                    "customization_level": "high"
                }
            }
            
            return json.dumps(playbook_data, indent=2)
        
        else:
            # Real playbook generation using LLM
            playbook_prompt = PlaybookSpecialistPrompts.PROMPT.format(
                incident_data=incident_data,
                incident_type=incident_type,
                severity=severity,
                affected_systems=affected_systems
            )
            
            response = await llm.ainvoke(playbook_prompt)
            
            try:
                # Try to parse as JSON first
                playbook_json = json.loads(response.content)
                return json.dumps(playbook_json, indent=2)
            except json.JSONDecodeError:
                # If not JSON, wrap in a structured format
                return json.dumps({
                    "name": f"Custom Playbook - {incident_type.replace('_', ' ').title()}",
                    "description": f"Generated playbook for {incident_type} incident",
                    "category": "Custom Response",
                    "playbook_content": response.content,
                    "generated_by": "playbook_specialist_agent"
                }, indent=2)

    yield generate_playbook