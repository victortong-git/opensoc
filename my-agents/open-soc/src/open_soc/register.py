# pylint: disable=unused-import
# flake8: noqa

# Import SOC-specific tools for automatic registration with new folder structure
from .core import soc_agent
from .core import hello_test_agent
from .agent_log_analysis import soc_log_analyzer
from .agent_threat_intel_specialist import threat_intelligence_lookup
from .core import security_event_classifier
from .agent_ioc_specialist import ioc_analyzer
from .agent_response_specialist import incident_response_planner
from .agent_ioc_specialist import virustotal_analyzer
from .agent_playbook_specialist import playbook_specialist
from .agent_threat_intel_specialist import threat_hunting_specialist
from .agent_automation_specialist import orchestration_coordinator
from .agent_automation_specialist import script_generator
from .agent_automation_specialist import takedown_specialist
