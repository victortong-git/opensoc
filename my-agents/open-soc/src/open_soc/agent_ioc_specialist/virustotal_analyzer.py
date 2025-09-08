# SPDX-FileCopyrightText: Copyright (c) 2025, NVIDIA CORPORATION & AFFILIATES. All rights reserved.
# SPDX-License-Identifier: Apache-2.0

import base64
import json
import os
import re
import time
from typing import Dict, Optional

import requests
from pydantic.fields import Field
from aiq.builder.framework_enum import LLMFrameworkEnum
from aiq.cli.register_workflow import register_function
from aiq.data_models.component_ref import LLMRef
from aiq.data_models.function import FunctionBaseConfig
from ..core.prompts import VirusTotalAnalyzerPrompts


class VirusTotalAnalyzerConfig(FunctionBaseConfig, name="virustotal_analyzer"):
    """Configuration for the VirusTotal Analyzer tool."""
    llm_name: LLMRef
    offline_mode: bool = Field(default=True, description="Whether to run in offline mode")
    api_key: str = Field(default="", description="VirusTotal API key")
    base_url: str = Field(default="https://www.virustotal.com/api/v3", description="VirusTotal API base URL")
    rate_limit: int = Field(default=4, description="Requests per minute (free tier: 4/min)")


@register_function(config_type=VirusTotalAnalyzerConfig, framework_wrappers=[LLMFrameworkEnum.LANGCHAIN])
async def virustotal_analyzer_function(config: VirusTotalAnalyzerConfig, builder):
    """
    Analyzes IOCs using VirusTotal v3 API to provide threat reputation and analysis.
    """
    
    from langchain_core.language_models.chat_models import BaseChatModel
    
    llm: BaseChatModel = await builder.get_llm(config.llm_name, wrapper_type=LLMFrameworkEnum.LANGCHAIN)

    class VirusTotalClient:
        def __init__(self):
            self.api_key = config.api_key or os.getenv("VIRUSTOTAL_API_KEY", "")
            self.base_url = config.base_url
            self.headers = {"x-apikey": self.api_key} if self.api_key else {}
            self.last_request_time = 0
            self.rate_limit_delay = 60 / config.rate_limit  # seconds between requests

        def _rate_limit(self):
            """Enforce rate limiting for API requests."""
            if not config.offline_mode and self.api_key:
                current_time = time.time()
                time_since_last = current_time - self.last_request_time
                if time_since_last < self.rate_limit_delay:
                    time.sleep(self.rate_limit_delay - time_since_last)
                self.last_request_time = time.time()

        def _make_request(self, endpoint: str, method: str = "GET", data: Optional[Dict] = None) -> Optional[Dict]:
            """Make HTTP request to VirusTotal API with error handling."""
            if config.offline_mode or not self.api_key:
                return None
            
            self._rate_limit()
            url = f"{self.base_url}/{endpoint}"
            
            try:
                if method == "GET":
                    response = requests.get(url, headers=self.headers, timeout=30)
                elif method == "POST":
                    response = requests.post(url, headers=self.headers, data=data, timeout=30)
                else:
                    return None
                
                response.raise_for_status()
                return response.json()
            
            except requests.exceptions.RequestException as e:
                print(f"VirusTotal API request failed: {e}")
                return None

        def analyze_file_hash(self, file_hash: str) -> Dict:
            """Analyze a file hash using VirusTotal API."""
            if config.offline_mode:
                return self._get_mock_file_analysis(file_hash)
            
            result = self._make_request(f"files/{file_hash}")
            if result and "data" in result:
                attributes = result["data"].get("attributes", {})
                stats = attributes.get("last_analysis_stats", {})
                return {
                    "hash": file_hash,
                    "malicious": stats.get("malicious", 0),
                    "suspicious": stats.get("suspicious", 0),
                    "undetected": stats.get("undetected", 0),
                    "harmless": stats.get("harmless", 0),
                    "total_engines": sum(stats.values()) if stats else 0,
                    "detection_ratio": f"{stats.get('malicious', 0)}/{sum(stats.values())}" if stats else "0/0",
                    "first_seen": attributes.get("first_submission_date"),
                    "last_seen": attributes.get("last_analysis_date"),
                    "reputation": attributes.get("reputation", 0),
                    "names": attributes.get("names", []),
                    "threat_labels": [cat for cat in attributes.get("popular_threat_classification", {}).get("suggested_threat_label", "").split() if cat]
                }
            return self._get_mock_file_analysis(file_hash)

        def analyze_url(self, url: str) -> Dict:
            """Analyze a URL using VirusTotal API."""
            if config.offline_mode:
                return self._get_mock_url_analysis(url)
            
            # Generate URL identifier using base64 encoding
            url_id = base64.urlsafe_b64encode(url.encode()).decode().strip("=")
            
            # Try to get existing analysis
            result = self._make_request(f"urls/{url_id}")
            if result and "data" in result:
                attributes = result["data"].get("attributes", {})
                stats = attributes.get("last_analysis_stats", {})
                return {
                    "url": url,
                    "malicious": stats.get("malicious", 0),
                    "suspicious": stats.get("suspicious", 0),
                    "undetected": stats.get("undetected", 0),
                    "harmless": stats.get("harmless", 0),
                    "total_engines": sum(stats.values()) if stats else 0,
                    "detection_ratio": f"{stats.get('malicious', 0)}/{sum(stats.values())}" if stats else "0/0",
                    "first_seen": attributes.get("first_submission_date"),
                    "last_seen": attributes.get("last_analysis_date"),
                    "reputation": attributes.get("reputation", 0),
                    "categories": attributes.get("categories", {}),
                    "threat_names": attributes.get("threat_names", [])
                }
            return self._get_mock_url_analysis(url)

        def analyze_ip(self, ip_address: str) -> Dict:
            """Analyze an IP address using VirusTotal API."""
            if config.offline_mode:
                return self._get_mock_ip_analysis(ip_address)
            
            result = self._make_request(f"ip_addresses/{ip_address}")
            if result and "data" in result:
                attributes = result["data"].get("attributes", {})
                stats = attributes.get("last_analysis_stats", {})
                return {
                    "ip": ip_address,
                    "malicious": stats.get("malicious", 0),
                    "suspicious": stats.get("suspicious", 0),
                    "undetected": stats.get("undetected", 0),
                    "harmless": stats.get("harmless", 0),
                    "total_engines": sum(stats.values()) if stats else 0,
                    "detection_ratio": f"{stats.get('malicious', 0)}/{sum(stats.values())}" if stats else "0/0",
                    "country": attributes.get("country", "Unknown"),
                    "asn": attributes.get("asn", "Unknown"),
                    "as_owner": attributes.get("as_owner", "Unknown"),
                    "reputation": attributes.get("reputation", 0),
                    "network": attributes.get("network", "Unknown")
                }
            return self._get_mock_ip_analysis(ip_address)

        def analyze_domain(self, domain: str) -> Dict:
            """Analyze a domain using VirusTotal API."""
            if config.offline_mode:
                return self._get_mock_domain_analysis(domain)
            
            result = self._make_request(f"domains/{domain}")
            if result and "data" in result:
                attributes = result["data"].get("attributes", {})
                stats = attributes.get("last_analysis_stats", {})
                return {
                    "domain": domain,
                    "malicious": stats.get("malicious", 0),
                    "suspicious": stats.get("suspicious", 0),
                    "undetected": stats.get("undetected", 0),
                    "harmless": stats.get("harmless", 0),
                    "total_engines": sum(stats.values()) if stats else 0,
                    "detection_ratio": f"{stats.get('malicious', 0)}/{sum(stats.values())}" if stats else "0/0",
                    "reputation": attributes.get("reputation", 0),
                    "categories": attributes.get("categories", {}),
                    "creation_date": attributes.get("creation_date"),
                    "whois": attributes.get("whois", "")
                }
            return self._get_mock_domain_analysis(domain)

        def _get_mock_file_analysis(self, file_hash: str) -> Dict:
            """Generate mock file analysis for offline mode."""
            malicious_count = len(file_hash) % 70
            if "backdoor" in file_hash.lower() or "malware" in file_hash.lower():
                malicious_count = max(45, malicious_count)
            elif "clean" in file_hash.lower():
                malicious_count = 0
            
            total_engines = 70
            return {
                "hash": file_hash,
                "malicious": malicious_count,
                "suspicious": 2,
                "undetected": total_engines - malicious_count - 2,
                "harmless": 0,
                "total_engines": total_engines,
                "detection_ratio": f"{malicious_count}/{total_engines}",
                "first_seen": "2024-12-01",
                "last_seen": "2024-12-15",
                "reputation": -malicious_count if malicious_count > 30 else 0,
                "names": ["suspicious.exe", "malware.bin"] if malicious_count > 30 else ["document.pdf"],
                "threat_labels": ["trojan", "backdoor"] if malicious_count > 30 else []
            }

        def _get_mock_url_analysis(self, url: str) -> Dict:
            """Generate mock URL analysis for offline mode."""
            malicious_count = 12 if "malicious" in url.lower() else 0
            total_engines = 70
            return {
                "url": url,
                "malicious": malicious_count,
                "suspicious": 1,
                "undetected": total_engines - malicious_count - 1,
                "harmless": 0,
                "total_engines": total_engines,
                "detection_ratio": f"{malicious_count}/{total_engines}",
                "first_seen": "2024-12-01",
                "last_seen": "2024-12-15",
                "reputation": -malicious_count if malicious_count > 5 else 0,
                "categories": {"malware": 1} if malicious_count > 5 else {"benign": 1},
                "threat_names": ["phishing", "malware"] if malicious_count > 5 else []
            }

        def _get_mock_ip_analysis(self, ip: str) -> Dict:
            """Generate mock IP analysis for offline mode."""
            malicious_ips = ["192.168.1.100", "203.0.113.100", "10.0.0.100"]
            malicious_count = 15 if ip in malicious_ips else 0
            total_engines = 70
            return {
                "ip": ip,
                "malicious": malicious_count,
                "suspicious": 2,
                "undetected": total_engines - malicious_count - 2,
                "harmless": 0,
                "total_engines": total_engines,
                "detection_ratio": f"{malicious_count}/{total_engines}",
                "country": "US" if not malicious_count else "Unknown",
                "asn": "AS12345",
                "as_owner": "Example ISP",
                "reputation": -malicious_count if malicious_count > 5 else 0,
                "network": "203.0.113.0/24"
            }

        def _get_mock_domain_analysis(self, domain: str) -> Dict:
            """Generate mock domain analysis for offline mode."""
            malicious_count = 8 if "malicious" in domain.lower() or "suspicious" in domain.lower() else 0
            total_engines = 70
            return {
                "domain": domain,
                "malicious": malicious_count,
                "suspicious": 1,
                "undetected": total_engines - malicious_count - 1,
                "harmless": 0,
                "total_engines": total_engines,
                "detection_ratio": f"{malicious_count}/{total_engines}",
                "reputation": -malicious_count if malicious_count > 3 else 0,
                "categories": {"malware": 1} if malicious_count > 3 else {"benign": 1},
                "creation_date": "2024-01-01",
                "whois": "Sample whois data"
            }

    def _detect_ioc_type(value: str) -> str:
        """Auto-detect the type of IOC."""
        value = value.strip()
        
        if len(value) in [32, 40, 64] and all(c in '0123456789abcdefABCDEF' for c in value):
            return "hash"
        
        if value.startswith(('http://', 'https://', 'ftp://')):
            return "url"
        
        ip_pattern = r'^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$'
        if re.match(ip_pattern, value):
            return "ip"
        
        return "domain"

    def _assess_threat_level(analysis: Dict) -> str:
        """Assess threat level based on VirusTotal results."""
        malicious = analysis.get('malicious', 0)
        total = analysis.get('total_engines', 70)
        
        if total == 0:
            return "Unknown"
        
        detection_percentage = (malicious / total) * 100
        
        if detection_percentage >= 70:
            return "Critical"
        elif detection_percentage >= 30:
            return "High" 
        elif detection_percentage >= 10:
            return "Medium"
        elif detection_percentage > 0:
            return "Low"
        else:
            return "Clean"

    def _calculate_confidence(analysis: Dict) -> str:
        """Calculate confidence level based on analysis completeness."""
        total_engines = analysis.get('total_engines', 0)
        
        if total_engines >= 60:
            return "High"
        elif total_engines >= 30:
            return "Medium"
        else:
            return "Low"

    def _generate_analysis_summary(analysis: Dict, ioc_type: str) -> str:
        """Generate analysis summary based on IOC type and results."""
        malicious = analysis.get('malicious', 0)
        
        if malicious > 30:
            return f"**HIGH RISK**: This {ioc_type} is flagged as malicious by {malicious} security engines. Immediate action recommended."
        elif malicious > 10:
            return f"**MEDIUM RISK**: This {ioc_type} shows suspicious activity with {malicious} detections. Investigation recommended."
        elif malicious > 0:
            return f"**LOW RISK**: This {ioc_type} has minimal detections ({malicious}) but should be monitored."
        else:
            return f"**CLEAN**: This {ioc_type} appears clean with no malicious detections from security engines."

    def _generate_threat_intelligence(analysis: Dict, ioc_type: str) -> str:
        """Generate threat intelligence context."""
        intel = []
        
        if 'threat_labels' in analysis and analysis['threat_labels']:
            intel.append(f"- **Threat Classification**: {', '.join(analysis['threat_labels'])}")
        
        if 'names' in analysis and analysis['names']:
            intel.append(f"- **Associated Names**: {', '.join(analysis['names'][:3])}")
        
        if ioc_type == "ip" and 'country' in analysis:
            intel.append(f"- **Geolocation**: {analysis['country']} ({analysis.get('as_owner', 'Unknown ISP')})")
        
        if 'categories' in analysis and analysis['categories']:
            categories = list(analysis['categories'].keys())
            intel.append(f"- **Categories**: {', '.join(categories)}")
        
        return "\n".join(intel) if intel else "- No additional threat intelligence available"

    def _generate_recommendations(analysis: Dict, threat_level: str) -> str:
        """Generate security recommendations based on threat level."""
        recommendations = {
            "Critical": [
                "Immediately isolate affected systems",
                "Block IOC at network perimeter (firewall/proxy)",
                "Initiate incident response procedures",
                "Scan for lateral movement indicators"
            ],
            "High": [
                "Block IOC in security controls",
                "Monitor for related activity",
                "Review system logs for exposure",
                "Consider quarantining suspicious files"
            ],
            "Medium": [
                "Add IOC to watchlists for monitoring",
                "Review associated network activity",
                "Update security signatures",
                "Schedule deeper investigation"
            ],
            "Low": [
                "Monitor IOC activity",
                "Document for future reference",
                "Consider adding to low-priority watchlist"
            ],
            "Clean": [
                "No immediate action required",
                "Continue routine monitoring",
                "Remove from active investigation if applicable"
            ],
            "Unknown": [
                "Gather additional intelligence",
                "Submit for further analysis if suspicious",
                "Monitor for future activity"
            ]
        }
        
        actions = recommendations.get(threat_level, recommendations["Unknown"])
        return "\n".join([f"- {action}" for action in actions])

    async def analyze_ioc_with_virustotal(ioc_value: str, ioc_type: str = "auto") -> str:
        """
        Analyze IOC using VirusTotal API and provide comprehensive threat assessment.
        
        Args:
            ioc_value: The IOC to analyze (hash, URL, IP, domain)
            ioc_type: Type of IOC (hash, url, ip, domain, auto)
            
        Returns:
            VirusTotal analysis results with threat assessment
        """
        vt_client = VirusTotalClient()
        
        if ioc_type == "auto":
            ioc_type = _detect_ioc_type(ioc_value)
        
        if ioc_type == "hash":
            analysis = vt_client.analyze_file_hash(ioc_value)
        elif ioc_type == "url":
            analysis = vt_client.analyze_url(ioc_value)
        elif ioc_type == "ip":
            analysis = vt_client.analyze_ip(ioc_value)
        elif ioc_type == "domain":
            analysis = vt_client.analyze_domain(ioc_value)
        else:
            return f"## VirusTotal Analysis Error\n\nUnsupported IOC type: {ioc_type}"
        
        threat_level = _assess_threat_level(analysis)
        confidence = _calculate_confidence(analysis)
        recommendations = _generate_recommendations(analysis, threat_level)
        
        report = f"""## VirusTotal Analysis Results

**IOC Details:**
- **Value**: {ioc_value}
- **Type**: {ioc_type.upper()}
- **Detection Ratio**: {analysis.get('detection_ratio', 'N/A')}

**Threat Assessment:**
- **Threat Level**: {threat_level}
- **Confidence**: {confidence}
- **Malicious Detections**: {analysis.get('malicious', 0)}/{analysis.get('total_engines', 0)} engines

**Analysis Summary:**
{_generate_analysis_summary(analysis, ioc_type)}

**Threat Intelligence:**
{_generate_threat_intelligence(analysis, ioc_type)}

**Security Recommendations:**
{recommendations}

**Technical Details:**
- **First Seen**: {analysis.get('first_seen', 'Unknown')}
- **Last Analysis**: {analysis.get('last_seen', 'Unknown')}
- **Reputation Score**: {analysis.get('reputation', 0)}"""

        if config.offline_mode:
            report += "\n\n*Note: This analysis was generated in offline mode using simulated data.*"
        
        return report

    yield analyze_ioc_with_virustotal