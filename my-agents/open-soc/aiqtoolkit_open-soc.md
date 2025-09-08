# AIQ Toolkit Open-SOC Agent Documentation

This document provides instructions for running and testing the Open-SOC AI agent built with NVIDIA AIQ Toolkit.

## 🚀 Recent Updates

**Latest Improvements (2025-08-12):**
- ✅ **Restructured Agent Organization**: Reorganized code into specialized folders (core/, agent_log_analysis/, agent_threat_intel_specialist/, etc.)
- ✅ **Enhanced ThreatFox Integration**: Fixed and improved threat hunting specialist with comprehensive API logging
- ✅ **Improved IOC Extraction**: Advanced regex patterns for extracting indicators from incident text
- ✅ **Verified Full Functionality**: All 8 agents tested and working correctly with new folder structure
- ✅ **Better Maintainability**: Clear separation of concerns with logical agent groupings

## 📋 Overview

The Open-SOC agent is a comprehensive Security Operations Center (SOC) analysis system that:
- **Analyzes security alerts** using AI-powered tools
- **Correlates threat intelligence** from multiple sources  
- **Classifies incidents** by type and severity
- **Generates incident response plans** with detailed procedures
- **Creates custom playbooks** tailored to specific incidents and contexts
- **Performs advanced threat hunting** using ThreatFox intelligence from abuse.ch
- **Uses local Ollama LLMs** for privacy and performance

### Architecture Components

```
Open-SOC Agent (Reorganized Structure)
├── core/                          # Main orchestrator & essential services
│   ├── soc_agent                  # Main orchestration workflow
│   ├── security_event_classifier  # Classifies events by type/severity
│   └── prompts                    # Centralized prompt templates
├── agent_log_analysis/            # Security log processing
│   └── soc_log_analyzer          # Analyzes security logs for patterns and IOCs
├── agent_threat_intel_specialist/ # Threat intelligence & hunting
│   ├── threat_intelligence_lookup # Queries threat intel databases
│   └── threat_hunting_specialist  # Advanced threat hunting with ThreatFox API
├── agent_ioc_specialist/          # Indicator analysis
│   ├── ioc_analyzer              # Analyzes indicators of compromise
│   └── virustotal_analyzer       # VirusTotal v3 API analysis with 70+ AV engines
├── agent_response_specialist/     # Incident response planning
│   └── incident_response_planner  # Generates response procedures
└── agent_playbook_specialist/     # Custom playbook generation
    └── playbook_specialist       # Generates custom incident-specific playbooks
```

## 🛠️ Prerequisites

### 1. Docker Environment
Ensure Docker and Docker Compose are running:
```bash
docker --version
docker-compose --version
```

### 2. AIQ Toolkit Container
The AIQ Toolkit should be running in Docker:
```bash
docker-compose ps aiqtoolkit
```

### 3. Ollama Configuration
Ensure Ollama is configured with the `gpt-oss:20b` model. The configuration expects Ollama at `http://192.168.8.21:11434`. Update the IP address in the config file if different:
```yaml
# Location: my-agents/open-soc/src/open_soc/configs/config.yml
llms:
  soc_main_llm:
    base_url: http://YOUR_OLLAMA_IP:11434/v1  # Update this IP
```

### 4. VirusTotal API Configuration (Optional)
For live VirusTotal analysis, obtain a free API key from [VirusTotal](https://www.virustotal.com/gui/join-us). The agent works in offline mode by default with simulated results:

```bash
# Set VirusTotal API key (optional for live mode)
export VIRUSTOTAL_API_KEY="your_api_key_here"

# Update config to enable live mode (optional)
# Location: my-agents/open-soc/src/open_soc/configs/config.yml
functions:
  virustotal_analyzer:
    offline_mode: false  # Set to false for live VirusTotal queries
    rate_limit: 4        # Free tier: 4 requests per minute
```

**Note**: The free VirusTotal API has limitations:
- 4 requests per minute
- 500 requests per day
- For production use, consider VirusTotal Premium API

### 5. ThreatFox API Configuration (Optional)
ThreatFox API from abuse.ch provides threat hunting capabilities. The agent works without authentication by default:

```bash
# ThreatFox API works without authentication (limited functionality)
# For full access, obtain an API key from https://threatfox.abuse.ch/

# Update config to enable live mode (optional)
# Location: my-agents/open-soc/src/open_soc/configs/config.yml
functions:
  threat_hunting_specialist:
    offline_mode: false      # Set to false for live ThreatFox queries
    api_key: "your_api_key"  # Optional - leave empty for no auth
    rate_limit_delay: 1.0    # Delay between requests in seconds
```

**ThreatFox Features**:
- Real-time IOC analysis from abuse.ch database
- Malware family attribution and campaign tracking
- Threat scoring and confidence assessment
- Historical threat activity analysis

## 🚀 Installation & Setup

### 1. Verify Open-SOC Installation
Check that the Open-SOC package is properly registered:
```bash
docker compose exec aiqtoolkit bash -c 'aiq info components -t package | grep open_soc'
```
Expected output should show the `open_soc` package.

### 2. Verify Function Registration
Check that all SOC functions are registered:
```bash
docker compose exec aiqtoolkit bash -c 'aiq info components -t function | grep soc'
```
Expected output should show all SOC functions:
- `soc_log_analyzer`
- `threat_intelligence_lookup`
- `security_event_classifier`
- `ioc_analyzer`
- `virustotal_analyzer`
- `incident_response_planner`
- `playbook_specialist`
- `threat_hunting_specialist`
- `soc_agent`

### 3. Test Configuration
Verify the configuration loads correctly:
```bash
docker compose exec aiqtoolkit bash -c 'aiq run --config_file=my-agents/open-soc/src/open_soc/configs/config.yml --help'
```

## 🧪 Testing the Open-SOC Agent

### Basic Test Command Structure
```bash
docker compose exec aiqtoolkit bash -c 'aiq run --config_file=my-agents/open-soc/src/open_soc/configs/config.yml --input "YOUR_SECURITY_ALERT_HERE"'
```

### Test Scenario 1: Malware Detection
```bash
docker compose exec aiqtoolkit bash -c 'aiq run --config_file=my-agents/open-soc/src/open_soc/configs/config.yml --input "Security Alert: Trojan.Win32.Emotet detected on workstation WS-001. Malicious executable found at c:\temp\backdoor.exe. Multiple outbound connections to suspicious IP addresses detected."'
```

### Test Scenario 2: Network Intrusion
```bash
docker compose exec aiqtoolkit bash -c 'aiq run --config_file=my-agents/open-soc/src/open_soc/configs/config.yml --input "Security Alert: Suspicious network traffic detected from workstation WS-001 to known malicious IP 192.168.1.100 on port 443. Multiple failed authentication attempts followed by successful login detected. Potential credential compromise and C2 communication established."'
```

### Test Scenario 3: Data Exfiltration  
```bash
docker compose exec aiqtoolkit bash -c 'aiq run --config_file=my-agents/open-soc/src/open_soc/configs/config.yml --input "Security Alert: Large data transfer detected during off-hours. 50GB of sensitive files transferred to external IP 203.0.113.5 from server SRV-FILE-001. Transfer occurred at 2:30 AM outside normal business hours."'
```

### Test Scenario 4: Phishing Attack
```bash
docker compose exec aiqtoolkit bash -c 'aiq run --config_file=my-agents/open-soc/src/open_soc/configs/config.yml --input "Security Alert: Phishing email detected with malicious attachment. Email from admin@suspicious-domain.com with subject Invoice Urgent - Payment Required contained executable attachment invoice.exe. Multiple users received similar emails."'
```

### Test Scenario 5: VirusTotal Malware Verification
```bash
docker compose exec aiqtoolkit bash -c 'aiq run --config_file=my-agents/open-soc/src/open_soc/configs/config.yml --input "Security Alert: Suspicious file detected on server SRV-WEB-001. File hash SHA256: d1ce4e040c4c0b5191e006d27f9c8202b52dcacb9b1b4fc5 found at /tmp/suspicious.exe. Antivirus flagged as potential trojan. Please verify with VirusTotal to confirm if this is real malware and provide virus score."'
```

### Test Scenario 6: VirusTotal Clean File Analysis
```bash
docker compose exec aiqtoolkit bash -c 'aiq run --config_file=my-agents/open-soc/src/open_soc/configs/config.yml --input "Security Alert: File quarantined by endpoint protection. Hash: cleanfile123456789abcdef. Need VirusTotal analysis to determine if this is a false positive or legitimate threat."'
```

### Test Scenario 7: JSON Format Alert with VirusTotal IOCs
```bash
docker compose exec aiqtoolkit bash -c 'aiq run --config_file=my-agents/open-soc/src/open_soc/configs/config.yml --input "{
  \"alert_id\": 12345,
  \"alert_type\": \"Unauthorized Access\",
  \"severity\": \"High\", 
  \"description\": \"Failed login attempts followed by successful authentication from suspicious IP\",
  \"affected_systems\": [\"SRV-DB-001\", \"WS-ADMIN-002\"],
  \"timestamp\": \"2025-01-15T16:12:45Z\",
  \"source_ip\": \"203.0.113.100\",
  \"iocs\": [\"203.0.113.100\", \"admin@malicious.com\"]
}"'
```

### Test Scenario 8: Custom Playbook Generation
```bash
docker compose exec aiqtoolkit bash -c 'aiq run --config_file=my-agents/open-soc/src/open_soc/configs/config.yml --input "Security Alert: Ransomware detected on critical server SRV-FILE-001. Multiple encrypted files with .locked extension found. Network shares compromised. Generate custom incident response playbook for this critical ransomware incident affecting file server and network infrastructure."'
```

### Test Scenario 9: Advanced Threat Hunting with ThreatFox
```bash
docker compose exec aiqtoolkit bash -c 'aiq run --config_file=my-agents/open-soc/src/open_soc/configs/config.yml --input "Security Alert: Suspicious connections detected to malicious-domain.example.com and 192.168.1.100. Outbound traffic on port 443 with encrypted payload. Perform comprehensive threat hunting analysis using ThreatFox IOC database to identify malware families, threat campaigns, and provide hunting recommendations."'
```

## 📊 Expected Output

A successful test will produce a comprehensive security analysis report including:

### 1. Alert Summary
- Brief description of the security incident
- Initial threat assessment

### 2. Threat Intelligence  
- IOC analysis results with reputation scores
- Threat campaign attribution (e.g., APT groups)
- Associated attack techniques (MITRE ATT&CK)

### 3. Security Analysis
- Timeline of events and suspicious activities
- IOC candidates identified
- Confidence assessment

### 4. Threat Assessment
- Risk level (Critical, High, Medium, Low)
- Potential business impact
- Likelihood of lateral movement

### 5. Incident Response Plan
- Immediate containment actions (0-1 hours)
- Investigation procedures (1-24 hours)  
- Recovery strategy (1-7 days)
- Communication plan

### 6. Recommended Actions
- Specific remediation steps with timelines
- Preventive measures for future incidents

### 7. VirusTotal Analysis Results
- **Virus Score**: Detection ratio (e.g., "45/70 engines detected as malicious")
- **Threat Verification**: Confirmed malware family or clean status
- **Confidence Level**: High/Medium/Low based on engine consensus
- **Risk Assessment**: Critical/High/Medium/Low threat level
- **Security Recommendations**: Actions based on VirusTotal results

### 8. Alert Classification
- Event type classification (e.g., malware_infection, network_intrusion)
- Severity level with detailed reasoning

### 9. Custom Playbook Generation Results
- **Playbook Structure**: JSON-formatted playbook compatible with OpenSOC backend
- **Incident-Specific Steps**: Tailored response actions based on incident type and context
- **Step Details**: Each step includes ID, name, type (automated/manual), description, timeout, and order
- **Timing Estimates**: Total execution time and per-step duration estimates
- **Trigger Conditions**: Context-aware triggers based on incident characteristics
- **Categorization**: Automatic playbook categorization (e.g., "Malware Response", "Network Security")
- **Metadata**: Generated metadata including incident context and customization level

### 10. Advanced Threat Hunting Results
- **IOC Analysis**: ThreatFox database matches with confidence scores and threat attribution
- **Malware Attribution**: Identified malware families and associated threat campaigns
- **Threat Scoring**: Quantitative assessment of threat severity and business impact
- **Campaign Intelligence**: Links to known attack campaigns and threat actor groups
- **Hunting Recommendations**: Specific hunting queries and detection logic for ongoing monitoring
- **Timeline Analysis**: Historical threat activity patterns and first/last seen dates
- **Risk Assessment**: Priority-based action recommendations with threat level classification
- **Raw API Responses**: Complete, unfiltered ThreatFox API responses for manual verification
- **Cross-Verification Guidelines**: Instructions for SOC analysts to validate AI analysis against raw data
- **Data Verification Summary**: Statistics on API queries and response status for transparency

## 📁 Project Structure

The Open-SOC agent is organized into specialized folders for better maintainability and development:

```
my-agents/open-soc/src/open_soc/
├── core/                              # Main orchestrator & essential services
│   ├── __init__.py
│   ├── soc_agent.py                  # Main SOC workflow orchestrator
│   ├── security_event_classifier.py  # Event classification service
│   └── prompts.py                    # Centralized prompt templates
├── agent_log_analysis/               # Security log processing
│   ├── __init__.py
│   └── soc_log_analyzer.py
├── agent_threat_intel_specialist/    # Threat intelligence & hunting
│   ├── __init__.py
│   ├── threat_intelligence_lookup.py
│   └── threat_hunting_specialist.py  # ThreatFox integration
├── agent_ioc_specialist/             # Indicator analysis
│   ├── __init__.py
│   ├── ioc_analyzer.py
│   └── virustotal_analyzer.py        # VirusTotal integration
├── agent_response_specialist/        # Incident response planning
│   ├── __init__.py
│   └── incident_response_planner.py
├── agent_playbook_specialist/        # Custom playbook generation
│   ├── __init__.py
│   └── playbook_specialist.py
├── configs/
│   └── config.yml                    # Main configuration file
├── __init__.py                       # Package exports
└── register.py                       # Agent registration system
```

### Benefits of this Structure:
- **Logical Organization**: Agents grouped by security function
- **Easy Navigation**: Self-documenting folder structure  
- **Scalability**: Easy to add new specialists to existing categories
- **Maintainability**: Isolated agent development and testing
- **Import Resolution**: Clear import paths for all components

## ⚙️ Configuration Details

### Main Configuration File
**Location**: `my-agents/open-soc/src/open_soc/configs/config.yml`

### Key Configuration Sections

#### Functions Configuration
```yaml
functions:
  soc_log_analyzer:
    _type: soc_log_analyzer
    llm_name: soc_tool_llm
    offline_mode: true  # Uses mock data for testing
    
  virustotal_analyzer:
    _type: virustotal_analyzer
    llm_name: soc_tool_llm
    offline_mode: true              # Set false for live VirusTotal API
    api_key: "${VIRUSTOTAL_API_KEY}" # Environment variable for API key
    base_url: "https://www.virustotal.com/api/v3"
    rate_limit: 4                   # Free tier: 4 requests per minute
    
  playbook_specialist:
    _type: playbook_specialist
    llm_name: soc_tool_llm
    offline_mode: true              # Uses mock data for testing
    
  threat_hunting_specialist:
    _type: threat_hunting_specialist
    llm_name: soc_tool_llm
    offline_mode: false             # Set to false for live ThreatFox queries
    api_key: ""                     # Leave empty for no auth, or add valid API key
    base_url: "https://threatfox-api.abuse.ch/api/v1"
    rate_limit_delay: 1.0           # Delay between requests in seconds
```

#### Workflow Configuration  
```yaml
workflow:
  _type: soc_agent
  tool_names:
    - soc_log_analyzer
    - threat_intelligence_lookup
    - ioc_analyzer 
    - virustotal_analyzer
    - incident_response_planner
    - playbook_specialist
    - threat_hunting_specialist
  llm_name: soc_main_llm
  offline_mode: true  # Enable for testing without real data
```

#### LLM Configuration (Ollama)
```yaml
llms:
  soc_main_llm:
    _type: openai                        # Uses OpenAI-compatible API
    base_url: http://192.168.8.21:11434/v1  # Ollama server endpoint
    api_key: "not-needed"                # Ollama doesn't require API keys
    model_name: gpt-oss:20b              # Your Ollama model
    temperature: 0.2
    max_tokens: 2048
```

### Test Data Files

#### Offline Security Data
**Location**: `my-agents/open-soc/data/offline_security_data.csv`
- Contains sample security alerts for testing
- Includes expected classifications and severities

#### Benign Fallback Data  
**Location**: `my-agents/open-soc/data/benign_security_fallback_data.json`
- Provides baseline responses for normal security states
- Used when specific test data is not available

## 🔧 Troubleshooting

### Common Issues

#### 1. Package Not Found
```bash
# Error: Package 'open_soc' not found
# Solution: Reinstall the workflow
docker compose exec aiqtoolkit bash -c 'aiq workflow reinstall open-soc'
```

#### 2. Ollama Connection Issues
```bash
# Error: Connection refused to Ollama server
# Solution: Verify Ollama is running and accessible
curl http://192.168.8.21:11434/api/tags
```

#### 3. Model Not Available
```bash
# Error: Model 'gpt-oss:20b' not found
# Solution: Pull the model in Ollama
ollama pull gpt-oss:20b
# Or update config.yml with available model name
```

#### 4. Configuration Errors
```bash
# Error: Invalid configuration file
# Solution: Validate YAML syntax
docker compose exec aiqtoolkit bash -c 'python -c "import yaml; yaml.safe_load(open(\"my-agents/open-soc/src/open_soc/configs/config.yml\"))"'
```

### Debug Commands

#### Check Component Registration
```bash
docker compose exec aiqtoolkit bash -c 'aiq info components -t function'
docker compose exec aiqtoolkit bash -c 'aiq info components -t package'
```

#### Test Individual Functions
```bash
# Test a specific SOC function
docker compose exec aiqtoolkit bash -c 'aiq info components -t function | grep soc_log_analyzer'
```

#### View Logs
```bash
# Check container logs for errors
docker-compose logs aiqtoolkit
```

## 🚀 Advanced Usage

### Custom Alert Scenarios

Create your own test scenarios by modifying the input JSON structure:
```bash
docker compose exec aiqtoolkit bash -c 'aiq run --config_file=my-agents/open-soc/src/open_soc/configs/config.yml --input "{
  \"alert_type\": \"YOUR_ALERT_TYPE\",
  \"description\": \"Detailed description of the security event\",
  \"affected_systems\": [\"system1\", \"system2\"],
  \"iocs\": [\"indicator1\", \"indicator2\"]
}"'
```

### Live Mode Configuration

To use real data instead of mock responses, set `offline_mode: false` in the configuration:
```yaml
workflow:
  offline_mode: false  # Disable mock data
```

**Note**: Live mode requires integration with actual security tools and threat intelligence feeds.

### Integration with SOC Platform

The Open-SOC agent can be integrated with existing SOC platforms through:
1. **REST API endpoints** - Call the agent via HTTP requests
2. **Message queues** - Process alerts from SIEM systems  
3. **Webhook integration** - Receive alerts from security tools
4. **Database integration** - Store analysis results in SOC database

## 📚 Additional Resources

- **NVIDIA AIQ Toolkit Documentation**: https://docs.nvidia.com/aiqtoolkit/
- **Ollama Documentation**: https://ollama.ai/docs
- **MITRE ATT&CK Framework**: https://attack.mitre.org/
- **Project Repository**: Check the `my-agents/open-soc/` directory for source code

## 🤝 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all prerequisites are met
3. Review the configuration files for syntax errors
4. Check Docker container logs for detailed error messages

---

**Happy SOC Analysis! 🔐**