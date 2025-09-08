const { models } = require('../models/index');
const { v4: uuidv4 } = require('uuid');

const seedIncidents = async (organizationId, users, alerts, assets = []) => {
  // Find specific assets by name for realistic incident mapping
  const dcServer = assets.find(asset => asset.name === 'DC-SERVER-01') || assets[0];
  const webServer = assets.find(asset => asset.name === 'WEB-SERVER-01') || assets[1];
  const dbServer = assets.find(asset => asset.name === 'DB-SERVER-01') || assets[2];
  const laptopJsmith = assets.find(asset => asset.name === 'LAPTOP-JSMITH') || assets[3];
  const firewall = assets.find(asset => asset.name === 'FIREWALL-01') || assets[4];
  const mailServer = assets.find(asset => asset.name === 'MAIL-SERVER-01') || assets[5];
  const financeWs = assets.find(asset => asset.name === 'WS-FINANCE-12') || assets[6];

  // Core realistic incidents based on mockData.ts patterns
  const incidentsData = [
    {
      id: '550e8400-e29b-41d4-a716-446655440030',
      title: 'Advanced Persistent Threat - Domain Controller Compromise',
      description: 'Suspected APT activity targeting domain controller with multiple attack vectors including PowerShell execution and credential stuffing',
      severity: 5,
      status: 'investigating',
      category: 'intrusion',
      assignedTo: users[1]?.id || users[0].id,
      assignedToName: users[1] ? `${users[1].firstName} ${users[1].lastName}` : 'System Administrator',
      organizationId,
      alertIds: alerts.length >= 2 ? [alerts[0].id, alerts[1].id] : [alerts[0]?.id].filter(Boolean),
      alertCount: alerts.length >= 2 ? 2 : 1,
      // Add formal asset relationships
      affectedAssetIds: dcServer ? [dcServer.id] : [],
      primaryAssetId: dcServer?.id,
      metadata: {
        attackVectors: ['PowerShell', 'Credential Stuffing', 'Privilege Escalation'],
        affectedAssets: [dcServer?.name || 'DC-SERVER-01'],
        affectedAssetDetails: dcServer ? [{
          id: dcServer.id,
          name: dcServer.name,
          type: dcServer.assetType,
          ipAddress: dcServer.ipAddress,
          criticality: dcServer.criticality,
          compromiseType: 'Full compromise',
          impactLevel: 'Critical'
        }] : [],
        estimatedImpact: 'High',
        containmentActions: ['Network isolation', 'Password reset', 'System monitoring'],
        threatActor: 'APT29 (Cozy Bear)',
        mitreTechniques: ['T1059.001', 'T1110', 'T1068'],
        businessImpact: 'Domain authentication services compromised'
      },
      createdAt: new Date('2024-01-15T10:00:00Z'),
      updatedAt: new Date('2024-01-15T10:30:00Z')
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440031',
      title: 'Web Server Compromise - Multiple Attack Indicators',
      description: 'Web server showing signs of compromise with suspicious network traffic, C2 communication, and potential data exfiltration attempts',
      severity: 4,
      status: 'contained',
      category: 'data_breach',
      assignedTo: users[2]?.id || users[0].id,
      assignedToName: users[2] ? `${users[2].firstName} ${users[2].lastName}` : 'System Administrator',
      organizationId,
      alertIds: alerts.length >= 3 ? [alerts[2].id, alerts[4]?.id].filter(Boolean) : [alerts[1]?.id].filter(Boolean),
      alertCount: alerts.length >= 3 ? 2 : 1,
      // Add formal asset relationships - web server and database potentially affected
      affectedAssetIds: [webServer, dbServer].filter(Boolean).map(asset => asset.id),
      primaryAssetId: webServer?.id,
      metadata: {
        attackVectors: ['Web Application Exploit', 'C2 Communication', 'SQL Injection'],
        affectedAssets: [webServer?.name || 'WEB-SERVER-01', dbServer?.name || 'DB-SERVER-01'],
        affectedAssetDetails: [webServer, dbServer].filter(Boolean).map(asset => ({
          id: asset.id,
          name: asset.name,
          type: asset.assetType,
          ipAddress: asset.ipAddress,
          criticality: asset.criticality,
          compromiseType: asset.name.includes('WEB') ? 'Full compromise' : 'Data access attempt',
          impactLevel: asset.name.includes('WEB') ? 'High' : 'Medium'
        })),
        estimatedImpact: 'Medium',
        containmentActions: ['Traffic blocking', 'System isolation', 'Patch deployment'],
        dataAtRisk: '10,000 customer records',
        complianceImpact: 'GDPR notification required',
        businessImpact: 'Customer portal and database potentially compromised'
      },
      resolvedAt: new Date('2024-01-15T10:15:00Z'),
      createdAt: new Date('2024-01-15T09:30:00Z'),
      updatedAt: new Date('2024-01-15T10:15:00Z')
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440032',
      title: 'Ransomware Attack - File Encryption Detected',
      description: 'Ransomware activity detected across multiple workstations with file encryption in progress',
      severity: 5,
      status: 'open',
      category: 'malware',
      assignedTo: users[1]?.id || users[0].id,
      assignedToName: users[1] ? `${users[1].firstName} ${users[1].lastName}` : 'System Administrator',
      organizationId,
      alertIds: [alerts[3]?.id].filter(Boolean),
      alertCount: 1,
      // Multiple workstations affected by ransomware
      affectedAssetIds: [laptopJsmith, financeWs].filter(Boolean).map(asset => asset.id),
      primaryAssetId: laptopJsmith?.id,
      metadata: {
        attackVector: 'Ransomware',
        ransomwareFamily: 'LockBit 3.0',
        affectedSystems: 5,
        affectedAssets: [laptopJsmith?.name || 'LAPTOP-JSMITH', financeWs?.name || 'WS-FINANCE-12'],
        affectedAssetDetails: [laptopJsmith, financeWs].filter(Boolean).map(asset => ({
          id: asset.id,
          name: asset.name,
          type: asset.assetType,
          ipAddress: asset.ipAddress,
          criticality: asset.criticality,
          compromiseType: 'File encryption',
          impactLevel: 'Critical',
          encryptedData: asset.name.includes('FINANCE') ? 'Financial documents' : 'User files'
        })),
        estimatedImpact: 'Critical',
        dataVolume: '250GB encrypted',
        recoveryOptions: ['Backup restoration', 'Decryption tools'],
        mitreTechniques: ['T1486', 'T1490'],
        businessImpact: 'Critical business operations disrupted - Finance and user productivity affected'
      },
      createdAt: new Date('2024-01-15T08:00:00Z'),
      updatedAt: new Date('2024-01-15T08:45:00Z')
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440033',
      title: 'Phishing Campaign - Credential Harvesting',
      description: 'Large-scale phishing campaign targeting employees with credential harvesting attempts',
      severity: 3,
      status: 'investigating',
      category: 'phishing',
      assignedTo: users[2]?.id || users[0].id,
      assignedToName: users[2] ? `${users[2].firstName} ${users[2].lastName}` : 'System Administrator',
      organizationId,
      alertIds: [],
      alertCount: 0,
      // Mail server is the vector for phishing campaign
      affectedAssetIds: [mailServer].filter(Boolean).map(asset => asset.id),
      primaryAssetId: mailServer?.id,
      metadata: {
        attackVector: 'Email Phishing',
        campaignName: 'FakeLogin-2024-01',
        targetsCount: 150,
        clickRate: '12%',
        credentialsCompromised: 8,
        affectedAssets: [mailServer?.name || 'MAIL-SERVER-01'],
        affectedAssetDetails: mailServer ? [{
          id: mailServer.id,
          name: mailServer.name,
          type: mailServer.assetType,
          ipAddress: mailServer.ipAddress,
          criticality: mailServer.criticality,
          compromiseType: 'Vector for attack',
          impactLevel: 'Medium'
        }] : [],
        remediationActions: ['Password resets', 'MFA enforcement', 'User training'],
        businessImpact: 'Employee credentials compromised via email system'
      },
      createdAt: new Date('2024-01-14T14:00:00Z'),
      updatedAt: new Date('2024-01-15T09:00:00Z')
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440034',
      title: 'Policy Violation - Unauthorized Software Installation',
      description: 'Multiple unauthorized software installations detected violating corporate security policy',
      severity: 2,
      status: 'resolved',
      category: 'policy_violation',
      assignedTo: users[1]?.id || users[0].id,
      assignedToName: users[1] ? `${users[1].firstName} ${users[1].lastName}` : 'System Administrator',
      organizationId,
      alertIds: [],
      alertCount: 0,
      // Policy violation affects finance workstation and laptop
      affectedAssetIds: [financeWs, laptopJsmith].filter(Boolean).map(asset => asset.id),
      primaryAssetId: financeWs?.id,
      metadata: {
        violationType: 'Unauthorized Software',
        affectedAssets: [financeWs?.name || 'WS-FINANCE-12', laptopJsmith?.name || 'LAPTOP-JSMITH'],
        affectedAssetDetails: [financeWs, laptopJsmith].filter(Boolean).map(asset => ({
          id: asset.id,
          name: asset.name,
          type: asset.assetType,
          ipAddress: asset.ipAddress,
          criticality: asset.criticality,
          compromiseType: 'Policy violation',
          impactLevel: 'Low'
        })),
        policyReference: 'SEC-POL-001',
        softwareList: ['BitTorrent Client', 'Unauthorized VPN', 'Gaming Software'],
        remedialAction: 'Software removal and user training',
        trainingCompleted: true,
        businessImpact: 'Policy compliance - resolved with user training'
      },
      resolvedAt: new Date('2024-01-15T09:15:00Z'),
      createdAt: new Date('2024-01-15T08:00:00Z'),
      updatedAt: new Date('2024-01-15T09:15:00Z')
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440035',
      title: 'Insider Threat - Suspicious Data Access',
      description: 'Unusual data access patterns detected from privileged user account after hours',
      severity: 4,
      status: 'investigating',
      category: 'insider_threat',
      assignedTo: users[0].id,
      assignedToName: `${users[0].firstName} ${users[0].lastName}`,
      organizationId,
      alertIds: [],
      alertCount: 0,
      // Insider threat involves database server access
      affectedAssetIds: [dbServer].filter(Boolean).map(asset => asset.id),
      primaryAssetId: dbServer?.id,
      metadata: {
        suspiciousUser: 'dbadmin',
        dataAccessed: ['Customer Database', 'Financial Reports', 'Employee Records'],
        accessTime: 'After hours (2:00 AM - 4:00 AM)',
        volumeAccessed: '1.2TB',
        riskIndicators: ['Unusual time', 'High volume', 'Sensitive data'],
        investigationStatus: 'HR notified',
        affectedAssets: [dbServer?.name || 'DB-SERVER-01'],
        affectedAssetDetails: dbServer ? [{
          id: dbServer.id,
          name: dbServer.name,
          type: dbServer.assetType,
          ipAddress: dbServer.ipAddress,
          criticality: dbServer.criticality,
          compromiseType: 'Unauthorized data access',
          impactLevel: 'High'
        }] : [],
        businessImpact: 'Confidential data potentially compromised by insider'
      },
      createdAt: new Date('2024-01-13T02:30:00Z'),
      updatedAt: new Date('2024-01-15T11:00:00Z')
    }
  ];

  // Generate additional incidents with varied patterns for comprehensive testing
  const incidentTemplates = [
    {
      titlePrefix: 'DDoS Attack',
      category: 'dos_attack',
      severity: 4,
      description: 'Distributed denial of service attack targeting infrastructure'
    },
    {
      titlePrefix: 'Privilege Escalation',
      category: 'privilege_escalation', 
      severity: 4,
      description: 'Unauthorized privilege escalation attempt detected'
    },
    {
      titlePrefix: 'Data Loss Prevention',
      category: 'data_loss',
      severity: 3,
      description: 'Potential data exfiltration attempt blocked'
    },
    {
      titlePrefix: 'Vulnerability Exploitation',
      category: 'exploit',
      severity: 4,
      description: 'Known vulnerability being actively exploited'
    }
  ];

  // Generate 8 additional incidents with realistic variety
  for (let i = 0; i < 8; i++) {
    const template = incidentTemplates[i % incidentTemplates.length];
    const assignedUser = users[i % users.length];
    const statuses = ['open', 'investigating', 'contained', 'resolved'];
    const status = statuses[i % statuses.length];
    
    // Create incident date within last 14 days
    const daysAgo = Math.floor(Math.random() * 14);
    const incidentTime = new Date();
    incidentTime.setDate(incidentTime.getDate() - daysAgo);
    
    const additionalIncident = {
      id: uuidv4(),
      title: `${template.titlePrefix} - Incident #${String(i + 7).padStart(3, '0')}`,
      description: `${template.description}. Generated incident for comprehensive testing.`,
      severity: template.severity + (Math.random() > 0.7 ? 1 : 0),
      status: status,
      category: template.category,
      assignedTo: assignedUser.id,
      assignedToName: `${assignedUser.firstName} ${assignedUser.lastName}`,
      organizationId,
      alertIds: [],
      alertCount: 0,
      metadata: {
        generated: true,
        template: template.titlePrefix,
        incidentIndex: i,
        automatedResponse: Math.random() > 0.5,
        estimatedImpact: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)]
      },
      ...(status === 'resolved' && { resolvedAt: new Date(incidentTime.getTime() + 3600000) }), // +1 hour if resolved
      createdAt: incidentTime,
      updatedAt: new Date(incidentTime.getTime() + Math.random() * 3600000) // random time after creation
    };
    
    incidentsData.push(additionalIncident);
  }

  const incidents = await models.Incident.bulkCreate(incidentsData, {
    returning: true,
    ignoreDuplicates: true,
  });

  // Create comprehensive timeline events for core incidents
  const timelineEventsData = [
    // APT Domain Controller Compromise Timeline
    {
      timestamp: new Date('2024-01-15T10:00:00Z'),
      type: 'alert',
      title: 'Initial Detection',
      description: 'Suspicious PowerShell activity detected on DC-SERVER-01',
      userId: users[0].id,
      userName: `${users[0].firstName} ${users[0].lastName}`,
      incidentId: incidents[0].id,
    },
    {
      timestamp: new Date('2024-01-15T10:05:00Z'),
      type: 'alert', 
      title: 'Credential Stuffing Detected',
      description: 'Multiple failed login attempts from external IP',
      userId: users[0].id,
      userName: `${users[0].firstName} ${users[0].lastName}`,
      incidentId: incidents[0].id,
    },
    {
      timestamp: new Date('2024-01-15T10:10:00Z'),
      type: 'action',
      title: 'Incident Created',
      description: 'High severity incident created due to APT indicators',
      userId: users[1].id,
      userName: `${users[1].firstName} ${users[1].lastName}`,
      incidentId: incidents[0].id,
    },
    {
      timestamp: new Date('2024-01-15T10:15:00Z'),
      type: 'action',
      title: 'Network Isolation',
      description: 'DC-SERVER-01 isolated from network as containment measure',
      userId: users[1].id,
      userName: `${users[1].firstName} ${users[1].lastName}`,
      incidentId: incidents[0].id,
    },
    {
      timestamp: new Date('2024-01-15T10:20:00Z'),
      type: 'action',
      title: 'Password Reset Initiated',
      description: 'Domain admin passwords reset as precautionary measure',
      userId: users[1].id,
      userName: `${users[1].firstName} ${users[1].lastName}`,
      incidentId: incidents[0].id,
    },
    {
      timestamp: new Date('2024-01-15T10:30:00Z'),
      type: 'note',
      title: 'Threat Intelligence Analysis',
      description: 'Indicators match known APT29 (Cozy Bear) techniques',
      userId: users[0].id,
      userName: `${users[0].firstName} ${users[0].lastName}`,
      incidentId: incidents[0].id,
    },

    // Web Server Compromise Timeline
    {
      timestamp: new Date('2024-01-15T09:30:00Z'),
      type: 'alert',
      title: 'Suspicious Network Traffic',
      description: 'C2 communication detected from WEB-SERVER-01',
      userId: users[0].id,
      userName: `${users[0].firstName} ${users[0].lastName}`,
      incidentId: incidents[1].id,
    },
    {
      timestamp: new Date('2024-01-15T09:35:00Z'),
      type: 'alert',
      title: 'DDoS Attack Detected',
      description: 'High volume of requests targeting web server',
      userId: users[0].id,
      userName: `${users[0].firstName} ${users[0].lastName}`,
      incidentId: incidents[1].id,
    },
    {
      timestamp: new Date('2024-01-15T09:45:00Z'),
      type: 'action',
      title: 'Investigation Started',
      description: 'Assigned to security analyst for detailed investigation',
      userId: users[2].id,
      userName: `${users[2].firstName} ${users[2].lastName}`,
      incidentId: incidents[1].id,
    },
    {
      timestamp: new Date('2024-01-15T09:50:00Z'),
      type: 'action',
      title: 'Firewall Rules Updated',
      description: 'Blocked malicious traffic at network perimeter',
      userId: users[2].id,
      userName: `${users[2].firstName} ${users[2].lastName}`,
      incidentId: incidents[1].id,
    },
    {
      timestamp: new Date('2024-01-15T10:00:00Z'),
      type: 'action',
      title: 'System Isolation',
      description: 'Web server isolated for forensic analysis',
      userId: users[2].id,
      userName: `${users[2].firstName} ${users[2].lastName}`,
      incidentId: incidents[1].id,
    },
    {
      timestamp: new Date('2024-01-15T10:15:00Z'),
      type: 'status_change',
      title: 'Incident Contained',
      description: 'Threat successfully contained, no data exfiltration detected',
      userId: users[2].id,
      userName: `${users[2].firstName} ${users[2].lastName}`,
      incidentId: incidents[1].id,
    },

    // Ransomware Timeline
    {
      timestamp: new Date('2024-01-15T08:00:00Z'),
      type: 'alert',
      title: 'File Encryption Detected',
      description: 'Ransomware activity detected on multiple workstations',
      userId: users[0].id,
      userName: `${users[0].firstName} ${users[0].lastName}`,
      incidentId: incidents[2].id,
    },
    {
      timestamp: new Date('2024-01-15T08:05:00Z'),
      type: 'action',
      title: 'Emergency Response',
      description: 'Critical incident response team activated',
      userId: users[1].id,
      userName: `${users[1].firstName} ${users[1].lastName}`,
      incidentId: incidents[2].id,
    },
    {
      timestamp: new Date('2024-01-15T08:10:00Z'),
      type: 'action',
      title: 'Network Segmentation',
      description: 'Affected systems isolated to prevent lateral movement',
      userId: users[1].id,
      userName: `${users[1].firstName} ${users[1].lastName}`,
      incidentId: incidents[2].id,
    },
    {
      timestamp: new Date('2024-01-15T08:30:00Z'),
      type: 'note',
      title: 'Ransomware Identification',
      description: 'Identified as LockBit 3.0 ransomware variant',
      userId: users[0].id,
      userName: `${users[0].firstName} ${users[0].lastName}`,
      incidentId: incidents[2].id,
    },
    {
      timestamp: new Date('2024-01-15T08:45:00Z'),
      type: 'action',
      title: 'Backup Assessment',
      description: 'Evaluating backup integrity for restoration options',
      userId: users[1].id,
      userName: `${users[1].firstName} ${users[1].lastName}`,
      incidentId: incidents[2].id,
    }
  ];

  await models.TimelineEvent.bulkCreate(timelineEventsData);

  return incidents;
};

module.exports = { seedIncidents };