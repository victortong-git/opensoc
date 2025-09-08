const { models } = require('../models/index');
const { v4: uuidv4 } = require('uuid');

const seedIOCs = async (organizationId) => {
  const iocsData = [
    {
      id: '550e8400-e29b-41d4-a716-446655440070',
      type: 'ip',
      value: '185.220.100.240',
      confidence: 'high',
      severity: 4,
      description: 'Known C2 server used by APT29 group for command and control operations',
      source: 'MISP Threat Intelligence',
      tags: ['APT29', 'C2', 'Russia', 'Government'],
      firstSeen: new Date('2024-01-10T12:00:00Z'),
      lastSeen: new Date('2024-01-15T09:45:00Z'),
      isActive: true,
      mitreAttack: ['T1071.001', 'T1105'],
      organizationId,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440071',
      type: 'domain',
      value: 'malicious-site.com',
      confidence: 'very_high',
      severity: 5,
      description: 'Domain hosting PowerShell payloads and malware droppers',
      source: 'VirusTotal',
      tags: ['malware', 'dropper', 'PowerShell', 'payload'],
      firstSeen: new Date('2024-01-12T08:30:00Z'),
      lastSeen: new Date('2024-01-15T10:30:00Z'),
      isActive: true,
      mitreAttack: ['T1059.001', 'T1105'],
      organizationId,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440072',
      type: 'file_hash',
      value: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
      confidence: 'high',
      severity: 4,
      description: 'SHA256 hash of known PowerShell-based malware',
      source: 'Internal Analysis',
      tags: ['malware', 'PowerShell', 'backdoor', 'persistence'],
      firstSeen: new Date('2024-01-15T10:30:00Z'),
      lastSeen: new Date('2024-01-15T10:30:00Z'),
      isActive: true,
      mitreAttack: ['T1059.001', 'T1547.001'],
      organizationId,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440073',
      type: 'ip',
      value: '203.0.113.45',
      confidence: 'medium',
      severity: 3,
      description: 'IP address involved in brute force attacks against SSH and RDP services',
      source: 'Honeypot Network',
      tags: ['brute_force', 'SSH', 'RDP', 'credential_stuffing'],
      firstSeen: new Date('2024-01-14T20:00:00Z'),
      lastSeen: new Date('2024-01-15T11:15:00Z'),
      isActive: true,
      mitreAttack: ['T1110.001', 'T1110.003'],
      organizationId,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440074',
      type: 'email',
      value: 'phishing@scammer.net',
      confidence: 'high',
      severity: 4,
      description: 'Email address used in phishing campaigns targeting financial institutions',
      source: 'Anti-Phishing Working Group',
      tags: ['phishing', 'financial', 'social_engineering', 'credential_theft'],
      firstSeen: new Date('2024-01-13T14:20:00Z'),
      lastSeen: new Date('2024-01-14T16:45:00Z'),
      isActive: true,
      mitreAttack: ['T1566.002', 'T1566.001'],
      organizationId,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440075',
      type: 'url',
      value: 'https://evil-updates.com/windows-security-update.exe',
      confidence: 'very_high',
      severity: 5,
      description: 'Malicious URL distributing fake security updates containing ransomware',
      source: 'URLVoid',
      tags: ['ransomware', 'fake_update', 'social_engineering', 'trojan'],
      firstSeen: new Date('2024-01-11T09:15:00Z'),
      lastSeen: new Date('2024-01-13T18:30:00Z'),
      isActive: true,
      mitreAttack: ['T1566.001', 'T1486'],
      organizationId,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440076',
      type: 'domain',
      value: 'data-exfil.darkweb.onion',
      confidence: 'medium',
      severity: 4,
      description: 'Tor hidden service used for data exfiltration by cybercriminal groups',
      source: 'DarkWeb Monitoring',
      tags: ['data_exfiltration', 'tor', 'darkweb', 'cybercrime'],
      firstSeen: new Date('2024-01-08T22:10:00Z'),
      lastSeen: new Date('2024-01-12T03:45:00Z'),
      isActive: true,
      mitreAttack: ['T1041', 'T1048.002'],
      organizationId,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440077',
      type: 'file_hash',
      value: 'b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567a',
      confidence: 'high',
      severity: 3,
      description: 'MD5 hash of keylogger malware targeting financial applications',
      source: 'Malware Bazaar',
      tags: ['keylogger', 'financial', 'credential_theft', 'spyware'],
      firstSeen: new Date('2024-01-09T11:30:00Z'),
      lastSeen: new Date('2024-01-11T15:20:00Z'),
      isActive: true,
      mitreAttack: ['T1056.001', 'T1005'],
      organizationId,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440078',
      type: 'registry_key',
      value: 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run\\SecurityUpdate',
      confidence: 'medium',
      severity: 3,
      description: 'Registry key used for malware persistence by APT groups',
      source: 'YARA Rules',
      tags: ['persistence', 'registry', 'APT', 'autostart'],
      firstSeen: new Date('2024-01-07T16:45:00Z'),
      lastSeen: new Date('2024-01-15T10:30:00Z'),
      isActive: true,
      mitreAttack: ['T1547.001'],
      organizationId,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440079',
      type: 'ip',
      value: '192.0.2.100',
      confidence: 'low',
      severity: 2,
      description: 'Suspicious IP involved in port scanning activities',
      source: 'IDS Logs',
      tags: ['reconnaissance', 'port_scan', 'network_discovery'],
      firstSeen: new Date('2024-01-14T08:15:00Z'),
      lastSeen: new Date('2024-01-14T12:30:00Z'),
      isActive: false,
      mitreAttack: ['T1046'],
      organizationId,
    },
  ];

  // Generate additional IOCs with templates for comprehensive testing
  const iocTemplates = [
    {
      type: 'ip',
      confidence: 'medium',
      severity: 3,
      tags: ['scanning', 'reconnaissance', 'port-scan'],
      mitreAttack: ['T1046'],
      description: 'Suspicious IP conducting network reconnaissance'
    },
    {
      type: 'domain',
      confidence: 'high', 
      severity: 4,
      tags: ['dga', 'malware-c2', 'dynamic-dns'],
      mitreAttack: ['T1071.001', 'T1568.002'],
      description: 'Domain generated by malware DGA algorithm'
    },
    {
      type: 'file_hash',
      confidence: 'high',
      severity: 4,
      tags: ['trojan', 'persistence', 'backdoor'],
      mitreAttack: ['T1055', 'T1543.003'],
      description: 'Hash of trojaned system file'
    },
    {
      type: 'url',
      confidence: 'medium',
      severity: 3,
      tags: ['suspicious-download', 'potentially-unwanted'],
      mitreAttack: ['T1105'],
      description: 'URL hosting potentially malicious content'
    },
    {
      type: 'email',
      confidence: 'high',
      severity: 4,
      tags: ['phishing', 'social-engineering', 'credential-harvesting'],
      mitreAttack: ['T1566.002'],
      description: 'Email address used in phishing campaigns'
    }
  ];

  // Generate 10 additional IOCs with realistic variety
  for (let i = 0; i < 10; i++) {
    const template = iocTemplates[i % iocTemplates.length];
    
    // Generate appropriate values based on type
    let value;
    switch (template.type) {
      case 'ip':
        // Generate realistic suspicious IPs
        const suspiciousRanges = ['45.', '185.', '91.', '103.', '104.'];
        const range = suspiciousRanges[i % suspiciousRanges.length];
        value = `${range}${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
        break;
      case 'domain':
        const domains = ['malicious-update', 'fake-security', 'phish-bank', 'c2-server', 'data-steal'];
        const tlds = ['.com', '.net', '.org', '.info', '.tk'];
        value = `${domains[i % domains.length]}-${i}-${Math.random().toString(36).substring(7)}${tlds[i % tlds.length]}`;
        break;
      case 'file_hash':
        // Generate realistic SHA256 hash
        value = Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
        break;
      case 'url':
        value = `https://malicious-${i}-${Math.random().toString(36).substring(7)}.example.com/payload${i}.exe`;
        break;
      case 'email':
        const emailPrefixes = ['noreply', 'admin', 'security', 'update', 'support'];
        const emailDomains = ['suspicious-domain.com', 'fake-bank.net', 'phishing-site.org'];
        value = `${emailPrefixes[i % emailPrefixes.length]}${i}@${emailDomains[i % emailDomains.length]}`;
        break;
    }

    // Create realistic timestamp within last 15 days
    const daysAgo = Math.floor(Math.random() * 15);
    const iocTime = new Date();
    iocTime.setDate(iocTime.getDate() - daysAgo);
    
    const additionalIOC = {
      id: uuidv4(),
      type: template.type,
      value: value,
      confidence: template.confidence,
      severity: template.severity + (Math.random() > 0.8 ? 1 : 0),
      description: `${template.description} #${i + 1} - Auto-generated for testing`,
      source: ['Internal Analysis', 'Threat Intel Feed', 'Community Feed', 'Honeypot Network'][Math.floor(Math.random() * 4)],
      tags: template.tags,
      organizationId,
      firstSeen: iocTime,
      lastSeen: new Date(iocTime.getTime() + Math.random() * 86400000), // Random time after first seen
      isActive: Math.random() > 0.3, // 70% active
      mitreAttack: template.mitreAttack,
      createdAt: iocTime,
      updatedAt: new Date(iocTime.getTime() + Math.random() * 86400000)
    };
    
    iocsData.push(additionalIOC);
  }

  const iocs = await models.IOC.bulkCreate(iocsData, {
    returning: true,
    ignoreDuplicates: true,
  });

  return iocs;
};

module.exports = { seedIOCs };