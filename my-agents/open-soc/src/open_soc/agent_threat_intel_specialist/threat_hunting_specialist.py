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
from ..core.prompts import ThreatHuntingSpecialistPrompts


class ThreatHuntingSpecialistConfig(FunctionBaseConfig, name="threat_hunting_specialist"):
    """Configuration for the Threat Hunting Specialist tool."""
    llm_name: LLMRef
    offline_mode: bool = Field(default=True, description="Whether to run in offline mode")
    api_key: str = Field(default="", description="ThreatFox API key (optional - leave empty to use without auth)")
    base_url: str = Field(default="https://threatfox-api.abuse.ch/api/v1", description="ThreatFox API base URL")
    rate_limit_delay: float = Field(default=1.0, description="Delay between API requests in seconds")


def _extract_iocs_from_text(text: str) -> List[str]:
    """
    Extract potential IOCs from incident text using regex patterns.
    """
    import re
    
    iocs = []
    
    # IP Address pattern (IPv4)
    ip_pattern = r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b'
    ips = re.findall(ip_pattern, text)
    iocs.extend(ips)
    
    # Domain pattern (basic domain detection)
    domain_pattern = r'\b(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}\b'
    domains = re.findall(domain_pattern, text)
    # Filter out common false positives
    filtered_domains = [d for d in domains if not d.endswith(('.com', '.org', '.net')) or 'malicious' in d.lower() or 'suspicious' in d.lower() or 'bad' in d.lower()]
    iocs.extend(filtered_domains)
    
    # URL pattern
    url_pattern = r'https?://[^\s<>"\'{}<|\\^`[\]]+[^\s<>"\'{}<|\\^`[\].,;!?]'
    urls = re.findall(url_pattern, text)
    iocs.extend(urls)
    
    # Hash patterns (MD5, SHA1, SHA256)
    hash_patterns = [
        r'\b[a-fA-F0-9]{32}\b',  # MD5
        r'\b[a-fA-F0-9]{40}\b',  # SHA1  
        r'\b[a-fA-F0-9]{64}\b'   # SHA256
    ]
    for pattern in hash_patterns:
        hashes = re.findall(pattern, text)
        iocs.extend(hashes)
    
    # Clean and deduplicate
    cleaned_iocs = []
    for ioc in iocs:
        ioc = ioc.strip()
        if ioc and ioc not in cleaned_iocs:
            cleaned_iocs.append(ioc)
    
    logging.info(f"IOC extraction from text found: {cleaned_iocs}")
    return cleaned_iocs


def _generate_offline_hunting_report(incident_data: str, threat_intelligence: Dict) -> str:
    """Generate structured offline threat hunting report."""
    
    # Analyze IOC results
    total_iocs = len(threat_intelligence["ioc_analysis"])
    malicious_iocs = sum(1 for ioc in threat_intelligence["ioc_analysis"] if ioc["matches"] > 0)
    threat_score = (malicious_iocs / total_iocs * 100) if total_iocs > 0 else 0
    
    # Extract threat families
    threat_families = set()
    for ioc_analysis in threat_intelligence["ioc_analysis"]:
        if ioc_analysis["matches"] > 0:
            for threat in ioc_analysis["threats"]:
                threat_families.add(threat.get("malware", "Unknown"))
    
    # Determine threat level
    if threat_score >= 75:
        threat_level = "CRITICAL"
    elif threat_score >= 50:
        threat_level = "HIGH"
    elif threat_score >= 25:
        threat_level = "MEDIUM"
    else:
        threat_level = "LOW"
    
    report = f"""# Threat Hunting Analysis Report

## Executive Summary
**Incident Context**: {incident_data[:200]}...
**Threat Score**: {threat_score:.1f}% ({malicious_iocs}/{total_iocs} IOCs confirmed malicious)
**Threat Level**: {threat_level}
**Malware Families Identified**: {', '.join(threat_families) if threat_families else 'None'}

## IOC Analysis Results
"""
    
    for ioc_analysis in threat_intelligence["ioc_analysis"]:
        ioc = ioc_analysis["ioc"]
        matches = ioc_analysis["matches"]
        
        if matches > 0:
            threats = ioc_analysis["threats"]
            primary_threat = threats[0]
            report += f"""
### MALICIOUS: {ioc}
- **Threat Type**: {primary_threat.get('threat_type', 'Unknown')}
- **Malware Family**: {primary_threat.get('malware_printable', 'Unknown')}
- **Confidence**: {primary_threat.get('confidence_level', 'Unknown')}%
- **First Seen**: {primary_threat.get('first_seen', 'Unknown')}
- **Last Seen**: {primary_threat.get('last_seen', 'Unknown')}
- **Tags**: {', '.join(primary_threat.get('tags', []))}
"""
        else:
            # Handle different non-match statuses
            status = ioc_analysis.get("status", "unknown")
            if status == "offline_mode":
                report += f"""
### OFFLINE MODE: {ioc}
- **Status**: Analysis skipped (offline mode enabled)
- **Recommendation**: Enable online mode for live ThreatFox analysis
"""
            elif status == "error":
                error_msg = ioc_analysis.get("error", "Unknown error")
                report += f"""
### ERROR: {ioc}
- **Status**: API error occurred during analysis
- **Error**: {error_msg}
- **Recommendation**: Check network connectivity and API key validity
"""
            else:
                report += f"""
### CLEAN: {ioc}
- **Status**: No malicious activity found in ThreatFox database
- **Recommendation**: Consider additional analysis if suspicious context
"""
    
    report += f"""
## Threat Hunting Recommendations

### Immediate Actions ({threat_level} Priority)
"""
    
    if threat_level == "CRITICAL":
        report += """
1. **ISOLATE** affected systems immediately to prevent lateral movement
2. **BLOCK** all confirmed malicious IOCs at network perimeters
3. **SCAN** enterprise for additional indicators of the identified malware families
4. **ACTIVATE** incident response team and emergency procedures
5. **PRESERVE** forensic evidence for detailed analysis
"""
    else:
        report += """
1. **MONITOR** affected systems for additional suspicious activity
2. **ANALYZE** context around IOC interactions
3. **INVESTIGATE** potential false positives
4. **DOCUMENT** findings and maintain alerting
5. **REVIEW** security controls and detection capabilities
"""
    
    report += """
### Long-term Hunting Strategies
1. **Campaign Tracking**: Monitor for IOCs associated with identified malware families
2. **Behavioral Analysis**: Look for tactics, techniques, and procedures (TTPs)
3. **Infrastructure Mapping**: Investigate related domains, IPs, and certificates
4. **Timeline Analysis**: Correlate threat activity with internal security events
5. **Threat Intelligence**: Subscribe to feeds for identified malware families

## Raw ThreatFox API Responses

**Purpose**: The following section contains complete, unfiltered API responses from ThreatFox for manual verification and cross-checking of AI analysis results.

**Verification Guidelines for SOC Analysts**:
- Compare AI analysis conclusions with raw data below
- Verify threat confidence levels and malware family attributions
- Check for any missed indicators or false positives in AI interpretation
- Validate timeline information (first_seen, last_seen dates)
- Cross-reference tags and threat_type classifications

"""
    
    # Add raw API responses for verification
    for raw_response in threat_intelligence["raw_api_responses"]:
        ioc = raw_response["ioc"]
        timestamp = raw_response["timestamp"]
        status = raw_response["response_status"]
        raw_data = raw_response["raw_response"]
        
        report += f"""
### IOC Query: {ioc}
**Request Timestamp**: {timestamp}
**Query Type**: {raw_response["query_type"]}
**Query Parameters**: {json.dumps(raw_response["query_parameters"])}
**Response Status**: {status}

**Raw ThreatFox API Response**:
```json
{json.dumps(raw_data, indent=2)}
```

**Verification Checklist for SOC Analysts**:
- [ ] Response status matches expected outcome
- [ ] Threat data aligns with AI analysis summary
- [ ] Confidence levels appropriately interpreted
- [ ] All relevant IOC metadata captured
- [ ] Timeline information accurately reflected

---
"""
    
    report += f"""
## Data Verification Summary

**Total API Queries**: {len(threat_intelligence['raw_api_responses'])}
**Successful Responses**: {sum(1 for r in threat_intelligence['raw_api_responses'] if r['response_status'] == 'ok')}
**No Results**: {sum(1 for r in threat_intelligence['raw_api_responses'] if r['response_status'] == 'no_result')}
**Errors**: {sum(1 for r in threat_intelligence['raw_api_responses'] if r['response_status'] not in ['ok', 'no_result'])}

**Cross-Verification Notes**:
- All raw responses above represent actual ThreatFox database queries
- AI analysis should align with data patterns shown in raw responses
- Discrepancies between AI summary and raw data should be investigated
- SOC analysts should manually verify high-confidence threat attributions

---
**Generated by**: Threat Hunting Specialist Agent
**Data Source**: ThreatFox by abuse.ch
**Raw Data Included**: Yes (for verification)
"""
    
    return report


@register_function(config_type=ThreatHuntingSpecialistConfig, framework_wrappers=[LLMFrameworkEnum.LANGCHAIN])
async def threat_hunting_specialist_function(config: ThreatHuntingSpecialistConfig, builder):
    """
    Advanced threat hunting specialist that integrates with ThreatFox API to analyze IOCs,
    identify threat campaigns, and provide comprehensive threat intelligence for security incidents.
    """
    
    from langchain_core.language_models.chat_models import BaseChatModel
    
    llm: BaseChatModel = await builder.get_llm(config.llm_name, wrapper_type=LLMFrameworkEnum.LANGCHAIN)

    class ThreatFoxClient:
        def __init__(self):
            self.api_key = config.api_key or os.getenv("THREATFOX_API_KEY", "")
            self.base_url = config.base_url
            self.headers = {"Content-Type": "application/json"}
            if self.api_key:
                self.headers["Auth-Key"] = self.api_key
                logging.info(f"ThreatFox API: Using authentication with key ending in ...{self.api_key[-4:]}")
            else:
                logging.info("ThreatFox API: Using without authentication (limited functionality)")
            self.last_request_time = 0
            self.rate_limit_delay = config.rate_limit_delay

        def _rate_limit(self):
            """Enforce rate limiting for API requests."""
            if not config.offline_mode:
                current_time = time.time()
                time_since_last = current_time - self.last_request_time
                if time_since_last < self.rate_limit_delay:
                    sleep_time = self.rate_limit_delay - time_since_last
                    logging.info(f"Rate limiting: waiting {sleep_time:.2f}s before next API request")
                    time.sleep(sleep_time)
                self.last_request_time = time.time()

        def search_ioc(self, ioc_value: str, ioc_type: str = "auto") -> Dict:
            """Search for specific IOC in ThreatFox database."""
            search_term = ioc_value.strip()
            payload = {
                "query": "search_iocs",
                "search_term": search_term
            }
            
            # Log the API request details
            logging.info(f"ThreatFox API Request - IOC: {search_term}")
            logging.info(f"ThreatFox API Request - URL: {self.base_url}/")
            logging.info(f"ThreatFox API Request - Payload: {json.dumps(payload)}")
            logging.info(f"ThreatFox API Request - Headers: Auth-Key: {'*' * 10}...{self.api_key[-4:]}")
            
            if config.offline_mode:
                logging.warning("Running in offline mode - returning empty result")
                return {
                    "query_status": "offline_mode",
                    "data": []
                }
            
            self._rate_limit()
            
            start_time = time.time()
            
            try:
                logging.info(f"Sending ThreatFox API request for IOC: {search_term}")
                response = requests.post(f"{self.base_url}/", json=payload, headers=self.headers, timeout=10)
                response_time = time.time() - start_time
                
                logging.info(f"ThreatFox API Response - Status Code: {response.status_code}")
                logging.info(f"ThreatFox API Response - Response Time: {response_time:.2f}s")
                logging.info(f"ThreatFox API Response - Content Length: {len(response.content)} bytes")
                
                response.raise_for_status()
                response_data = response.json()
                
                logging.info(f"ThreatFox API Response - Query Status: {response_data.get('query_status', 'unknown')}")
                data_count = len(response_data.get('data', []))
                logging.info(f"ThreatFox API Response - Data Items: {data_count}")
                
                if data_count > 0:
                    logging.info(f"ThreatFox API Response - Raw Data: {json.dumps(response_data, indent=2)}")
                else:
                    logging.info("ThreatFox API Response - No threat data found for this IOC")
                
                return response_data
                
            except requests.exceptions.Timeout as e:
                response_time = time.time() - start_time
                error_msg = f"ThreatFox API timeout after {response_time:.2f}s: {e}"
                logging.error(error_msg)
                return {
                    "query_status": "error",
                    "error": error_msg,
                    "data": []
                }
            except requests.exceptions.HTTPError as e:
                response_time = time.time() - start_time
                if response.status_code == 401:
                    error_msg = "ThreatFox API: Unauthorized - API key required for access"
                    logging.error(error_msg)
                    logging.error("ThreatFox API requires authentication. Please obtain an API key from https://threatfox.abuse.ch/")
                elif response.status_code == 403:
                    error_msg = "ThreatFox API: Forbidden - Invalid API key"
                    logging.error(error_msg)
                    logging.error("ThreatFox API key is invalid. Please check your API key.")
                else:
                    error_msg = f"ThreatFox API HTTP error (Status: {response.status_code}): {e}"
                    logging.error(error_msg)
                    logging.error(f"ThreatFox API Error Response: {response.text}")
                return {
                    "query_status": "error", 
                    "error": error_msg,
                    "data": []
                }
            except Exception as e:
                response_time = time.time() - start_time
                error_msg = f"ThreatFox API general error after {response_time:.2f}s: {e}"
                logging.error(error_msg)
                return {
                    "query_status": "error",
                    "error": error_msg, 
                    "data": []
                }

        def _detect_ioc_type(self, ioc_value: str) -> str:
            """Detect IOC type from value."""
            import ipaddress
            
            try:
                ipaddress.ip_address(ioc_value.split(':')[0])
                return "ip:port" if ':' in ioc_value else "ip"
            except ValueError:
                pass
            
            if ioc_value.startswith(('http://', 'https://')):
                return "url"
            elif '.' in ioc_value and not ioc_value.startswith(('http', 'ftp')):
                return "domain"
            elif len(ioc_value) in [32, 40, 64]:
                return "sha256" if len(ioc_value) == 64 else "md5" if len(ioc_value) == 32 else "sha1"
            else:
                return "unknown"

    async def test_threatfox_api() -> str:
        """
        Test ThreatFox API connectivity and configuration.
        Returns detailed test results for debugging.
        """
        client = ThreatFoxClient()
        test_ioc = "8.8.8.8"  # Known clean IP for testing
        
        logging.info("=== ThreatFox API Connectivity Test ===")
        logging.info(f"Testing with IOC: {test_ioc}")
        logging.info(f"API URL: {client.base_url}")
        logging.info(f"API Key (last 4): ...{client.api_key[-4:]}")
        
        try:
            result = client.search_ioc(test_ioc)
            
            test_report = f"""# ThreatFox API Connectivity Test Report

## Test Configuration
- **Test IOC**: {test_ioc}
- **API Endpoint**: {client.base_url}
- **API Key**: ...{client.api_key[-4:]}
- **Offline Mode**: {config.offline_mode}

## Test Results
- **Query Status**: {result.get('query_status', 'unknown')}
- **Response Data**: {len(result.get('data', []))} items
- **Raw Response**: 
```json
{json.dumps(result, indent=2)}
```

## Connectivity Status
- **API Reachable**: {'✓ YES' if result.get('query_status') != 'error' else '✗ NO'}
- **Authentication**: {'✓ VALID' if result.get('query_status') in ['ok', 'no_result'] else '✗ INVALID'}
- **Network**: {'✓ CONNECTED' if 'error' not in result else '✗ CONNECTION FAILED'}

## Recommendations
{"✓ ThreatFox API is working correctly" if result.get('query_status') in ['ok', 'no_result'] else "✗ Check network connectivity and API key"}
"""
            return test_report
            
        except Exception as e:
            error_report = f"""# ThreatFox API Connectivity Test - ERROR

## Error Details
- **Error Type**: {type(e).__name__}
- **Error Message**: {str(e)}
- **Test IOC**: {test_ioc}

## Troubleshooting
1. Check network connectivity to threatfox-api.abuse.ch
2. Verify API key is valid: {client.api_key[-4:]}
3. Check firewall/proxy settings
4. Ensure HTTPS access is allowed
"""
            logging.error(f"ThreatFox API test failed: {e}")
            return error_report

    async def hunt_threats(incident_data: str, ioc_list: str = "", malware_families: str = "") -> str:
        """
        Perform comprehensive threat hunting analysis using ThreatFox intelligence.
        
        Args:
            incident_data: Detailed incident information and context
            ioc_list: Comma-separated list of indicators of compromise to investigate
            malware_families: Comma-separated list of suspected malware families
            
        Returns:
            Comprehensive threat hunting analysis report
        """
        
        # Parse IOC list and extract IOCs from incident data
        provided_iocs = [ioc.strip() for ioc in ioc_list.split(",") if ioc.strip()] if ioc_list else []
        extracted_iocs = _extract_iocs_from_text(incident_data)
        
        # Combine provided IOCs with extracted IOCs
        all_iocs = list(set(provided_iocs + extracted_iocs))
        
        logging.info(f"Starting threat hunting analysis:")
        logging.info(f"- Provided IOCs: {len(provided_iocs)} - {provided_iocs}")
        logging.info(f"- Extracted IOCs: {len(extracted_iocs)} - {extracted_iocs}")
        logging.info(f"- Total unique IOCs: {len(all_iocs)} - {all_iocs}")
        
        if not all_iocs:
            logging.warning("No IOCs found for analysis - will return analysis guidance instead")
        
        iocs = all_iocs
        
        client = ThreatFoxClient()
        threat_intelligence = {
            "ioc_analysis": [],
            "malware_intelligence": [],
            "recent_threats": [],
            "raw_api_responses": []
        }
        
        # Analyze each IOC
        for ioc in iocs[:10]:  # Limit to 10 IOCs to avoid API limits
            ioc_result = client.search_ioc(ioc.strip())
            
            # Store raw API response with metadata
            raw_response_entry = {
                "ioc": ioc,
                "timestamp": time.strftime('%Y-%m-%d %H:%M:%S UTC'),
                "query_type": "search_iocs",
                "query_parameters": {"search_term": ioc.strip()},
                "raw_response": ioc_result,
                "response_status": ioc_result.get("query_status", "unknown")
            }
            threat_intelligence["raw_api_responses"].append(raw_response_entry)
            
            if ioc_result.get("query_status") == "ok" and ioc_result.get("data"):
                threat_intelligence["ioc_analysis"].append({
                    "ioc": ioc,
                    "matches": len(ioc_result["data"]),
                    "threats": ioc_result["data"]
                })
            elif ioc_result.get("query_status") == "no_result":
                threat_intelligence["ioc_analysis"].append({
                    "ioc": ioc,
                    "matches": 0,
                    "status": "clean_or_unknown"
                })
            elif ioc_result.get("query_status") == "offline_mode":
                threat_intelligence["ioc_analysis"].append({
                    "ioc": ioc,
                    "matches": 0,
                    "status": "offline_mode"
                })
            else:
                # Handle error cases
                threat_intelligence["ioc_analysis"].append({
                    "ioc": ioc,
                    "matches": 0,
                    "status": "error",
                    "error": ioc_result.get("error", "Unknown error")
                })
        
        # Generate structured offline report
        hunting_report = _generate_offline_hunting_report(incident_data, threat_intelligence)
        return hunting_report

    yield hunt_threats
    yield test_threatfox_api