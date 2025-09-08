# SPDX-FileCopyrightText: Copyright (c) 2025, NVIDIA CORPORATION & AFFILIATES. All rights reserved.
# SPDX-License-Identifier: Apache-2.0

import json
import logging
import time
from typing import Dict, List, Optional
from pydantic.fields import Field
from aiq.builder.framework_enum import LLMFrameworkEnum
from aiq.cli.register_workflow import register_function
from aiq.data_models.component_ref import LLMRef
from aiq.data_models.function import FunctionBaseConfig
from ..core.prompts import TakedownSpecialistPrompts


class TakedownSpecialistConfig(FunctionBaseConfig, name="takedown_specialist"):
    """Configuration for the Takedown Specialist tool."""
    llm_name: LLMRef
    offline_mode: bool = Field(default=True, description="Whether to run in offline mode")
    enable_aggressive_actions: bool = Field(default=False, description="Enable aggressive takedown actions")
    isolation_level: str = Field(default="network", description="Isolation level: network, process, system")
    auto_execution: bool = Field(default=False, description="Enable automatic script execution")


@register_function(config_type=TakedownSpecialistConfig, framework_wrappers=[LLMFrameworkEnum.LANGCHAIN])
async def takedown_specialist_function(config: TakedownSpecialistConfig, builder):
    """
    Specialized agent for generating automated takedown and isolation procedures
    based on threat intelligence and asset context.
    """
    
    from langchain_core.language_models.chat_models import BaseChatModel
    
    llm: BaseChatModel = await builder.get_llm(config.llm_name, wrapper_type=LLMFrameworkEnum.LANGCHAIN)

    def _generate_network_isolation_procedures(threat_level: str, asset_info: Dict) -> Dict:
        """Generate network isolation procedures based on threat level."""
        
        procedures = {
            "isolation_steps": [],
            "verification_commands": [],
            "rollback_procedures": [],
            "estimated_downtime": "0 minutes"
        }
        
        if threat_level in ["CRITICAL", "HIGH"]:
            procedures["isolation_steps"] = [
                "Isolate affected system from network immediately",
                "Block all traffic to/from compromised asset",
                "Preserve network logs for forensic analysis",
                "Notify incident response team"
            ]
            procedures["verification_commands"] = [
                "ping -c 1 <asset_ip> (should fail)",
                "nmap -p 22,80,443 <asset_ip> (should show filtered)",
                "tcpdump -i <interface> host <asset_ip> (should show no traffic)"
            ]
            procedures["estimated_downtime"] = "5-15 minutes"
            
        elif threat_level == "MEDIUM":
            procedures["isolation_steps"] = [
                "Monitor network traffic closely", 
                "Apply restrictive firewall rules",
                "Log all connections for analysis",
                "Prepare for escalation if needed"
            ]
            procedures["estimated_downtime"] = "0 minutes"
            
        return procedures

    def _generate_process_termination_procedures(threat_families: List[str], script_language: str) -> Dict:
        """Generate process termination and cleanup procedures."""
        
        procedures = {
            "process_analysis": [],
            "termination_commands": [],
            "cleanup_steps": [],
            "persistence_removal": []
        }
        
        # Generic process analysis commands
        if script_language == 'bash':
            procedures["process_analysis"] = [
                "ps aux | grep -E '(malware|trojan|backdoor)'",
                "netstat -tulpn | grep ESTABLISHED",
                "lsof -i | grep ESTABLISHED"
            ]
            procedures["termination_commands"] = [
                "# Kill suspicious processes (REVIEW BEFORE EXECUTION)",
                "# pkill -f '<suspicious_process_name>'",
                "# killall -9 <malicious_binary>"
            ]
        elif script_language == 'powershell':
            procedures["process_analysis"] = [
                "Get-Process | Where-Object {$_.ProcessName -match '(malware|trojan|backdoor)'}",
                "Get-NetTCPConnection | Where-Object {$_.State -eq 'Established'}",
                "Get-WmiObject Win32_Process | Select ProcessId,Name,CommandLine"
            ]
            procedures["termination_commands"] = [
                "# Stop suspicious processes (REVIEW BEFORE EXECUTION)",
                "# Stop-Process -Name '<suspicious_process>' -Force",
                "# Get-Process | Where-Object {$_.Name -match '<pattern>'} | Stop-Process -Force"
            ]
            
        # Add threat family specific procedures
        for family in threat_families:
            family_lower = family.lower()
            if 'rat' in family_lower or 'backdoor' in family_lower:
                procedures["persistence_removal"].append(f"Check for {family} persistence mechanisms")
                procedures["cleanup_steps"].append(f"Remove {family} registry entries/cron jobs")
        
        return procedures

    def _generate_evidence_preservation_procedures(iocs: List[Dict]) -> Dict:
        """Generate evidence preservation procedures."""
        
        return {
            "memory_capture": [
                "Create memory dump before system changes",
                "Preserve volatile data and running processes",
                "Document network connections and open files"
            ],
            "disk_evidence": [
                "Create disk image of affected partitions",
                "Hash all collected evidence",
                "Maintain chain of custody documentation"
            ],
            "network_evidence": [
                "Capture network traffic for IOC analysis",
                "Export firewall and proxy logs",
                "Document DNS query history"
            ],
            "timeline_preservation": [
                "Export system event logs",
                "Capture file modification timestamps",
                "Document user activity during incident timeframe"
            ]
        }

    async def generate_takedown_procedures(orchestration_data: str, takedown_type: str = "network_isolation") -> str:
        """
        Generate comprehensive takedown and mitigation procedures.
        
        Args:
            orchestration_data: JSON string containing orchestration analysis results
            takedown_type: Type of takedown (network_isolation, process_termination, full_containment)
            
        Returns:
            Detailed takedown procedures with step-by-step instructions
        """
        
        try:
            start_time = time.time()
            
            # Parse orchestration data
            data = json.loads(orchestration_data) if isinstance(orchestration_data, str) else orchestration_data
            threat_assessment = data.get('threat_assessment', {})
            extracted_iocs = data.get('extracted_iocs', [])
            asset_context = data.get('asset_context', {})
            script_language = data.get('script_language', 'bash')
            
            threat_level = threat_assessment.get('threat_level', 'UNKNOWN')
            threat_families = threat_assessment.get('threat_families', [])
            
            logging.info(f"Generating {takedown_type} procedures for {threat_level} threat")
            
            # Generate appropriate procedures based on takedown type
            takedown_procedures = {}
            
            if takedown_type == "network_isolation":
                takedown_procedures = _generate_network_isolation_procedures(threat_level, asset_context)
                
            elif takedown_type == "process_termination":
                takedown_procedures = _generate_process_termination_procedures(threat_families, script_language)
                
            elif takedown_type == "full_containment":
                # Combine all procedures for comprehensive containment
                network_procedures = _generate_network_isolation_procedures(threat_level, asset_context)
                process_procedures = _generate_process_termination_procedures(threat_families, script_language)
                evidence_procedures = _generate_evidence_preservation_procedures(extracted_iocs)
                
                takedown_procedures = {
                    "containment_strategy": "full_containment",
                    "execution_phases": [
                        {
                            "phase": "evidence_preservation",
                            "priority": 1,
                            "procedures": evidence_procedures
                        },
                        {
                            "phase": "threat_containment",
                            "priority": 2, 
                            "procedures": {
                                "network_isolation": network_procedures,
                                "process_termination": process_procedures
                            }
                        }
                    ]
                }
            
            # Generate execution timeline
            execution_timeline = [
                {
                    "step": "threat_analysis_review",
                    "description": "Review threat assessment and IOC analysis",
                    "estimated_time": "2-5 minutes",
                    "criticality": "high"
                },
                {
                    "step": "procedure_validation", 
                    "description": "Validate takedown procedures against environment",
                    "estimated_time": "5-10 minutes",
                    "criticality": "high"
                },
                {
                    "step": "execution_preparation",
                    "description": "Prepare systems and tools for takedown execution",
                    "estimated_time": "10-15 minutes", 
                    "criticality": "medium"
                },
                {
                    "step": "takedown_execution",
                    "description": "Execute takedown procedures with monitoring",
                    "estimated_time": "15-30 minutes",
                    "criticality": "high"
                },
                {
                    "step": "verification_and_monitoring",
                    "description": "Verify effectiveness and establish ongoing monitoring",
                    "estimated_time": "30-60 minutes",
                    "criticality": "medium"
                }
            ]
            
            # Compile final results
            processing_time = time.time() - start_time
            
            takedown_results = {
                "status": "completed",
                "takedown_type": takedown_type,
                "threat_context": {
                    "threat_level": threat_level,
                    "risk_score": threat_assessment.get('risk_score', 0),
                    "affected_iocs": len(extracted_iocs),
                    "threat_families": threat_families
                },
                "generated_procedures": takedown_procedures,
                "execution_timeline": execution_timeline,
                "safety_recommendations": {
                    "test_in_staging": True,
                    "backup_before_execution": True,
                    "manual_approval_required": threat_level in ["CRITICAL", "HIGH"],
                    "rollback_plan_required": True
                },
                "automation_readiness": {
                    "ready_for_automation": threat_level not in ["CRITICAL"] and config.auto_execution,
                    "requires_human_oversight": True,
                    "risk_assessment": "medium" if threat_level in ["HIGH", "MEDIUM"] else "low"
                },
                "processing_time_ms": round(processing_time * 1000),
                "generation_timestamp": time.strftime('%Y-%m-%d %H:%M:%S UTC')
            }
            
            logging.info(f"Takedown procedures generated in {processing_time:.2f}s")
            return json.dumps(takedown_results, indent=2)
            
        except Exception as e:
            error_result = {
                "status": "failed",
                "error": str(e),
                "error_type": type(e).__name__,
                "takedown_type": takedown_type,
                "processing_time_ms": round((time.time() - start_time) * 1000) if 'start_time' in locals() else 0
            }
            
            logging.error(f"Takedown procedure generation failed: {e}")
            return json.dumps(error_result, indent=2)

    yield generate_takedown_procedures