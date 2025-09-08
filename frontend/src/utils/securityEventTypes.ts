import { 
  Shield, 
  AlertTriangle, 
  Server, 
  Lock, 
  Database, 
  Globe, 
  FileText, 
  Users, 
  Settings, 
  Activity,
  Zap,
  Bug,
  Key,
  Code,
  Eye,
  User,
  Wrench
} from 'lucide-react';

export interface SecurityEventTypeInfo {
  label: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: any;
  category: string;
}

export const getSecurityEventTypeInfo = (eventType: string): SecurityEventTypeInfo => {
  const formattedLabel = eventType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  switch (eventType) {
    // Network & Traffic - Blue theme
    case 'network_intrusion':
      return {
        label: formattedLabel,
        description: 'Unauthorized network access or breach attempt',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
        icon: Shield,
        category: 'Network & Traffic'
      };
    case 'ddos_attack':
      return {
        label: formattedLabel,
        description: 'Distributed Denial of Service attack',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
        icon: Zap,
        category: 'Network & Traffic'
      };
    case 'port_scan':
      return {
        label: formattedLabel,
        description: 'Network port scanning activity',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
        icon: Eye,
        category: 'Network & Traffic'
      };
    case 'suspicious_traffic':
      return {
        label: formattedLabel,
        description: 'Unusual or malicious network traffic patterns',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
        icon: Server,
        category: 'Network & Traffic'
      };
    case 'dns_tunneling':
      return {
        label: formattedLabel,
        description: 'DNS-based data exfiltration or communication',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
        icon: Globe,
        category: 'Network & Traffic'
      };
    case 'lateral_movement':
      return {
        label: formattedLabel,
        description: 'Attacker movement across network systems',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
        icon: Activity,
        category: 'Network & Traffic'
      };

    // Malware & Threats - Red theme
    case 'malware_detection':
      return {
        label: formattedLabel,
        description: 'General malware identification',
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
        icon: Bug,
        category: 'Malware & Threats'
      };
    case 'ransomware':
      return {
        label: formattedLabel,
        description: 'Ransomware infection or encryption activity',
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
        icon: Lock,
        category: 'Malware & Threats'
      };
    case 'trojan':
      return {
        label: formattedLabel,
        description: 'Trojan horse malware detection',
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
        icon: Bug,
        category: 'Malware & Threats'
      };
    case 'virus':
      return {
        label: formattedLabel,
        description: 'Computer virus detection',
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
        icon: Bug,
        category: 'Malware & Threats'
      };
    case 'rootkit':
      return {
        label: formattedLabel,
        description: 'Rootkit installation or activity',
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
        icon: Settings,
        category: 'Malware & Threats'
      };
    case 'botnet_activity':
      return {
        label: formattedLabel,
        description: 'Botnet command and control activity',
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
        icon: Server,
        category: 'Malware & Threats'
      };
    case 'phishing':
      return {
        label: formattedLabel,
        description: 'Phishing attempts or campaigns',
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
        icon: AlertTriangle,
        category: 'Malware & Threats'
      };

    // Authentication & Access - Orange theme
    case 'authentication_failure':
      return {
        label: formattedLabel,
        description: 'Failed login or authentication attempts',
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/30',
        icon: Key,
        category: 'Authentication & Access'
      };
    case 'privilege_escalation':
      return {
        label: formattedLabel,
        description: 'Attempts to gain higher system privileges',
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/30',
        icon: Shield,
        category: 'Authentication & Access'
      };
    case 'unauthorized_access':
      return {
        label: formattedLabel,
        description: 'Unauthorized system or data access',
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/30',
        icon: Lock,
        category: 'Authentication & Access'
      };
    case 'account_compromise':
      return {
        label: formattedLabel,
        description: 'Compromised user account activity',
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/30',
        icon: User,
        category: 'Authentication & Access'
      };
    case 'brute_force_attack':
      return {
        label: formattedLabel,
        description: 'Password brute force attempts',
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/30',
        icon: Key,
        category: 'Authentication & Access'
      };
    case 'credential_theft':
      return {
        label: formattedLabel,
        description: 'Stolen or harvested credentials',
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/30',
        icon: Key,
        category: 'Authentication & Access'
      };

    // Data & Exfiltration - Purple theme
    case 'data_exfiltration':
      return {
        label: formattedLabel,
        description: 'Unauthorized data transfer or theft',
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/30',
        icon: Database,
        category: 'Data & Exfiltration'
      };
    case 'data_breach':
      return {
        label: formattedLabel,
        description: 'Confirmed data breach incident',
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/30',
        icon: Database,
        category: 'Data & Exfiltration'
      };
    case 'data_loss_prevention':
      return {
        label: formattedLabel,
        description: 'DLP policy violation or alert',
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/30',
        icon: Shield,
        category: 'Data & Exfiltration'
      };
    case 'unauthorized_data_access':
      return {
        label: formattedLabel,
        description: 'Unauthorized access to sensitive data',
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/30',
        icon: Database,
        category: 'Data & Exfiltration'
      };

    // System & Host - Yellow theme
    case 'suspicious_process':
      return {
        label: formattedLabel,
        description: 'Suspicious process execution detected',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/30',
        icon: Settings,
        category: 'System & Host'
      };
    case 'system_compromise':
      return {
        label: formattedLabel,
        description: 'Host system compromise detected',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/30',
        icon: AlertTriangle,
        category: 'System & Host'
      };
    case 'file_integrity_violation':
      return {
        label: formattedLabel,
        description: 'Unauthorized file modification detected',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/30',
        icon: FileText,
        category: 'System & Host'
      };
    case 'registry_modification':
      return {
        label: formattedLabel,
        description: 'Windows registry tampering detected',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/30',
        icon: Settings,
        category: 'System & Host'
      };
    case 'service_manipulation':
      return {
        label: formattedLabel,
        description: 'System service tampering or abuse',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/30',
        icon: Wrench,
        category: 'System & Host'
      };

    // Application & Web - Green theme
    case 'web_attack':
      return {
        label: formattedLabel,
        description: 'Web application attack detected',
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/30',
        icon: Globe,
        category: 'Application & Web'
      };
    case 'sql_injection':
      return {
        label: formattedLabel,
        description: 'SQL injection attack attempt',
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/30',
        icon: Database,
        category: 'Application & Web'
      };
    case 'xss_attack':
      return {
        label: formattedLabel,
        description: 'Cross-site scripting attack',
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/30',
        icon: Code,
        category: 'Application & Web'
      };
    case 'application_vulnerability':
      return {
        label: formattedLabel,
        description: 'Application security vulnerability',
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/30',
        icon: Bug,
        category: 'Application & Web'
      };
    case 'api_abuse':
      return {
        label: formattedLabel,
        description: 'API misuse or abuse detected',
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/30',
        icon: Server,
        category: 'Application & Web'
      };

    // Policy & Compliance - Gray theme
    case 'policy_violation':
      return {
        label: formattedLabel,
        description: 'Security policy violation',
        color: 'text-gray-400',
        bgColor: 'bg-gray-500/10',
        borderColor: 'border-gray-500/30',
        icon: FileText,
        category: 'Policy & Compliance'
      };
    case 'compliance_violation':
      return {
        label: formattedLabel,
        description: 'Regulatory compliance violation',
        color: 'text-gray-400',
        bgColor: 'bg-gray-500/10',
        borderColor: 'border-gray-500/30',
        icon: Shield,
        category: 'Policy & Compliance'
      };
    case 'configuration_violation':
      return {
        label: formattedLabel,
        description: 'Security configuration violation',
        color: 'text-gray-400',
        bgColor: 'bg-gray-500/10',
        borderColor: 'border-gray-500/30',
        icon: Settings,
        category: 'Policy & Compliance'
      };
    case 'security_control_bypass':
      return {
        label: formattedLabel,
        description: 'Security control circumvention',
        color: 'text-gray-400',
        bgColor: 'bg-gray-500/10',
        borderColor: 'border-gray-500/30',
        icon: Shield,
        category: 'Policy & Compliance'
      };

    // Insider & Internal - Pink theme
    case 'insider_threat':
      return {
        label: formattedLabel,
        description: 'Insider threat activity detected',
        color: 'text-pink-400',
        bgColor: 'bg-pink-500/10',
        borderColor: 'border-pink-500/30',
        icon: Users,
        category: 'Insider & Internal'
      };
    case 'user_behavior_anomaly':
      return {
        label: formattedLabel,
        description: 'Unusual user behavior pattern',
        color: 'text-pink-400',
        bgColor: 'bg-pink-500/10',
        borderColor: 'border-pink-500/30',
        icon: User,
        category: 'Insider & Internal'
      };
    case 'data_misuse':
      return {
        label: formattedLabel,
        description: 'Inappropriate data usage detected',
        color: 'text-pink-400',
        bgColor: 'bg-pink-500/10',
        borderColor: 'border-pink-500/30',
        icon: Database,
        category: 'Insider & Internal'
      };
    case 'unauthorized_software':
      return {
        label: formattedLabel,
        description: 'Unauthorized software installation',
        color: 'text-pink-400',
        bgColor: 'bg-pink-500/10',
        borderColor: 'border-pink-500/30',
        icon: Settings,
        category: 'Insider & Internal'
      };

    // Infrastructure - Cyan theme
    case 'vulnerability_exploitation':
      return {
        label: formattedLabel,
        description: 'System vulnerability exploitation',
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-500/10',
        borderColor: 'border-cyan-500/30',
        icon: Bug,
        category: 'Infrastructure'
      };
    case 'system_misconfiguration':
      return {
        label: formattedLabel,
        description: 'Security misconfiguration detected',
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-500/10',
        borderColor: 'border-cyan-500/30',
        icon: Settings,
        category: 'Infrastructure'
      };
    case 'patch_management_failure':
      return {
        label: formattedLabel,
        description: 'Missing security patches detected',
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-500/10',
        borderColor: 'border-cyan-500/30',
        icon: Wrench,
        category: 'Infrastructure'
      };

    // General & Status - Slate theme
    case 'security_incident':
      return {
        label: formattedLabel,
        description: 'General security incident',
        color: 'text-slate-400',
        bgColor: 'bg-slate-500/10',
        borderColor: 'border-slate-500/30',
        icon: AlertTriangle,
        category: 'General'
      };
    case 'suspicious_activity':
      return {
        label: formattedLabel,
        description: 'Suspicious but unclassified activity',
        color: 'text-slate-400',
        bgColor: 'bg-slate-500/10',
        borderColor: 'border-slate-500/30',
        icon: Eye,
        category: 'General'
      };
    case 'anomaly_detection':
      return {
        label: formattedLabel,
        description: 'Detected anomaly requiring investigation',
        color: 'text-slate-400',
        bgColor: 'bg-slate-500/10',
        borderColor: 'border-slate-500/30',
        icon: Activity,
        category: 'General'
      };
    case 'unknown':
      return {
        label: formattedLabel,
        description: 'Unable to classify security event type',
        color: 'text-slate-400',
        bgColor: 'bg-slate-500/10',
        borderColor: 'border-slate-500/30',
        icon: AlertTriangle,
        category: 'General'
      };
    case 'pending':
      return {
        label: 'Pending Classification',
        description: 'Security event type not yet classified by AI',
        color: 'text-slate-400',
        bgColor: 'bg-slate-500/10',
        borderColor: 'border-slate-500/30',
        icon: Activity,
        category: 'Status'
      };

    // Default fallback
    default:
      return {
        label: formattedLabel || 'Unknown Event Type',
        description: 'Unknown security event type',
        color: 'text-slate-400',
        bgColor: 'bg-slate-500/10',
        borderColor: 'border-slate-500/30',
        icon: AlertTriangle,
        category: 'Unknown'
      };
  }
};

export const formatSecurityEventType = (eventType: string | undefined): string => {
  if (!eventType) return 'Pending Classification';
  if (eventType === 'pending') return 'Pending Classification';
  
  return eventType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};