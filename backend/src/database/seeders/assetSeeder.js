const { models } = require('../models/index');
const { v4: uuidv4 } = require('uuid');

const seedAssets = async (organizationId) => {
  // Core infrastructure assets using Sequelize model field names (JavaScript properties)
  const assetsData = [
    // Critical Servers
    {
      id: '550e8400-e29b-41d4-a716-446655440010',
      name: 'DC-SERVER-01',
      assetType: 'server',
      ipAddress: '10.0.1.10',
      hostname: 'dc-server-01.demo.corp',
      osType: 'Windows Server 2022',
      osVersion: '21H2',
      criticality: 'critical',
      organizationId: organizationId,
      metadata: { 
        department: 'IT', 
        owner: 'John Smith',
        services: ['Active Directory', 'DNS', 'DHCP'],
        domainController: true,
        lastPatched: '2024-01-01',
        backupStatus: 'current'
      },
      status: 'active',
      location: 'Data Center A - Rack 1',
      owner: 'IT Department',
      lastSeen: new Date('2024-01-15T10:30:00Z'),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440011',
      name: 'WEB-SERVER-01',
      assetType: 'server',
      ipAddress: '10.0.1.20',
      hostname: 'web-server-01.demo.corp',
      osType: 'Ubuntu Server 22.04',
      osVersion: '22.04.3',
      criticality: 'high',
      organizationId: organizationId,
      metadata: { 
        department: 'IT', 
        owner: 'Maria Wilson',
        services: ['Apache2', 'MySQL', 'PHP'],
        ssl_certificate: 'valid',
        loadBalanced: false,
        webApps: ['Corporate Website', 'Employee Portal']
      },
      status: 'active',
      location: 'DMZ - Rack 3',
      owner: 'Web Development Team',
      lastSeen: new Date('2024-01-15T10:25:00Z'),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440014',
      name: 'DB-SERVER-01',
      assetType: 'server',
      ipAddress: '10.0.1.30',
      hostname: 'db-server-01.demo.corp',
      osType: 'CentOS 8',
      osVersion: '8.5',
      criticality: 'critical',
      organizationId: organizationId,
      metadata: { 
        database: 'PostgreSQL 14', 
        department: 'IT',
        dataClassification: 'Confidential',
        encryption: 'TDE enabled',
        replication: 'Master',
        databases: ['employees', 'customers', 'financials']
      },
      status: 'maintenance',
      location: 'Data Center B - Rack 2',
      owner: 'Database Team',
      lastSeen: new Date('2024-01-15T08:00:00Z'),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440015',
      name: 'MAIL-SERVER-01',
      assetType: 'server',
      ipAddress: '10.0.1.40',
      hostname: 'mail-server-01.demo.corp',
      osType: 'Windows Server 2019',
      osVersion: '1809',
      criticality: 'high',
      organizationId: organizationId,
      metadata: {
        services: ['Exchange Server 2019', 'SMTP', 'IMAP'],
        department: 'IT',
        owner: 'Email Admin Team',
        mailboxCount: 250,
        antiSpam: 'enabled',
        encryption: 'TLS 1.3'
      },
      status: 'active',
      location: 'Data Center A - Rack 2',
      owner: 'Email Administration',
      lastSeen: new Date('2024-01-15T10:20:00Z'),
    },

    // Network Infrastructure
    {
      id: '550e8400-e29b-41d4-a716-446655440012',
      name: 'FIREWALL-01',
      assetType: 'network_device',
      ipAddress: '10.0.0.1',
      hostname: 'firewall-01.demo.corp',
      osType: 'FortiOS',
      osVersion: '7.4.1',
      criticality: 'critical',
      organizationId: organizationId,
      metadata: { 
        vendor: 'Fortinet', 
        model: 'FortiGate 100F',
        interfaces: 8,
        throughput: '10 Gbps',
        features: ['IPS', 'Web Filtering', 'VPN'],
        licenses: ['UTM Bundle', 'FortiGuard IPS']
      },
      status: 'active',
      location: 'Network Closet A',
      owner: 'Network Security Team',
      lastSeen: new Date('2024-01-15T10:35:00Z'),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440016',
      name: 'CORE-SWITCH-01',
      assetType: 'network_device',
      ipAddress: '10.0.0.10',
      hostname: 'core-switch-01.demo.corp',
      osType: 'Cisco IOS',
      osVersion: '15.2(7)E3',
      criticality: 'critical',
      organizationId: organizationId,
      metadata: {
        vendor: 'Cisco',
        model: 'Catalyst 3750-X',
        ports: 48,
        speed: '1 Gbps',
        management: 'SNMP v3',
        vlanCount: 25,
        stackable: true
      },
      status: 'active',
      location: 'Network Closet A',
      owner: 'Network Team',
      lastSeen: new Date('2024-01-15T10:30:00Z'),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440017',
      name: 'VPN-GW-01',
      assetType: 'network_device',
      ipAddress: '203.0.113.1',
      hostname: 'vpn-gw-01.demo.corp',
      osType: 'pfSense',
      osVersion: '2.7.0',
      criticality: 'high',
      organizationId: organizationId,
      metadata: {
        vendor: 'Netgate',
        model: 'SG-3100',
        vpnProtocols: ['OpenVPN', 'IPSec'],
        maxConnections: 100,
        department: 'IT',
        publicFacing: true
      },
      status: 'active',
      location: 'DMZ - Rack 1',
      owner: 'Network Security Team',
      lastSeen: new Date('2024-01-15T10:28:00Z'),
    },

    // End User Devices
    {
      id: '550e8400-e29b-41d4-a716-446655440013',
      name: 'LAPTOP-JSMITH',
      assetType: 'workstation',
      ipAddress: '10.0.2.15',
      hostname: 'laptop-jsmith.demo.corp',
      osType: 'Windows 11 Pro',
      osVersion: '23H2',
      criticality: 'medium',
      organizationId: organizationId,
      metadata: { 
        user: 'jsmith', 
        department: 'Finance',
        model: 'Dell Latitude 7420',
        serial: 'DL7420-2024-001',
        antivirus: 'Windows Defender',
        encryption: 'BitLocker',
        managedBy: 'Intune'
      },
      status: 'active',
      location: 'Remote - Home Office',
      owner: 'John Smith',
      lastSeen: new Date('2024-01-15T09:15:00Z'),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440018',
      name: 'LAPTOP-MWILSON',
      assetType: 'workstation',
      ipAddress: '10.0.2.25',
      hostname: 'laptop-mwilson.demo.corp',
      osType: 'macOS Sonoma',
      osVersion: '14.2',
      criticality: 'medium',
      organizationId: organizationId,
      metadata: {
        user: 'mwilson',
        department: 'IT',
        model: 'MacBook Pro 14-inch M3',
        serial: 'MBP14-2024-001',
        mdm: 'Jamf Pro',
        encryption: 'FileVault',
        securitySoftware: 'CrowdStrike Falcon'
      },
      status: 'active',
      location: 'Office Building A - Floor 2',
      owner: 'Maria Wilson',
      lastSeen: new Date('2024-01-15T10:10:00Z'),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440019',
      name: 'WS-FINANCE-12',
      assetType: 'workstation',
      ipAddress: '10.0.2.35',
      hostname: 'ws-finance-12.demo.corp',
      osType: 'Windows 10 Enterprise',
      osVersion: '22H2',
      criticality: 'medium',
      organizationId: organizationId,
      metadata: {
        department: 'Finance',
        user: 'bsmith',
        model: 'HP EliteDesk 800 G9',
        serial: 'HP800G9-2023-012',
        domain: 'DEMO.CORP',
        sensitivity: 'High - Financial Data',
        compliance: ['SOX', 'PCI-DSS']
      },
      status: 'active',
      location: 'Office Building A - Floor 3',
      owner: 'Finance Department',
      lastSeen: new Date('2024-01-15T08:45:00Z'),
    },

    // Mobile and IoT Devices  
    {
      id: '550e8400-e29b-41d4-a716-446655440020',
      name: 'IPAD-CEO-01',
      assetType: 'mobile_device',
      ipAddress: '10.0.2.100',
      hostname: 'ipad-ceo-01.demo.corp',
      osType: 'iPadOS',
      osVersion: '17.2',
      criticality: 'high',
      organizationId: organizationId,
      metadata: {
        deviceType: 'iPad Pro 12.9-inch',
        user: 'CEO',
        department: 'Executive',
        mdm: 'Microsoft Intune',
        apps: ['Office 365', 'Teams', 'Outlook'],
        dataAccess: 'Executive Level'
      },
      status: 'active',
      location: 'Executive Suite',
      owner: 'Chief Executive Officer',
      lastSeen: new Date('2024-01-15T09:30:00Z'),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440021',
      name: 'PRINTER-FLOOR2-01',
      assetType: 'iot_device',
      ipAddress: '10.0.3.10',
      hostname: 'printer-floor2-01.demo.corp',
      osType: 'Embedded Linux',
      osVersion: '3.2.1',
      criticality: 'low',
      organizationId: organizationId,
      metadata: {
        vendor: 'HP',
        model: 'LaserJet Enterprise MFP M528',
        capabilities: ['Print', 'Scan', 'Copy', 'Fax'],
        networkProtocols: ['TCP/IP', 'SNMP'],
        location_detail: 'Floor 2 Copy Room'
      },
      status: 'active',
      location: 'Office Building A - Floor 2',
      owner: 'Office Administration',
      lastSeen: new Date('2024-01-15T10:05:00Z'),
    },

    // Cloud and Virtual Assets
    {
      id: '550e8400-e29b-41d4-a716-446655440022',
      name: 'CLOUD-WEB-01',
      assetType: 'cloud_service',
      ipAddress: '52.84.123.45',
      hostname: 'cloud-web-01.amazonaws.com',
      osType: 'Amazon Linux 2',
      osVersion: '2023.3.20231218',
      criticality: 'high',
      organizationId: organizationId,
      metadata: {
        provider: 'AWS',
        instanceType: 't3.medium',
        region: 'us-east-1',
        vpc: 'vpc-0123456789abcdef0',
        securityGroups: ['sg-web-server', 'sg-ssh-access'],
        services: ['Nginx', 'Node.js', 'PM2'],
        autoScaling: true
      },
      status: 'active',
      location: 'AWS US-East-1',
      owner: 'Cloud Infrastructure Team',
      lastSeen: new Date('2024-01-15T10:15:00Z'),
    }
  ];

  // Generate additional diverse assets for comprehensive demo
  const additionalAssetTemplates = [
    {
      namePrefix: 'WS-',
      assetType: 'workstation',
      departments: ['HR', 'Marketing', 'Sales', 'Engineering', 'Legal'],
      osOptions: ['Windows 11 Pro', 'Windows 10 Enterprise', 'Ubuntu 22.04'],
      criticalityRange: ['low', 'medium'],
      locations: ['Office Building A - Floor 1', 'Office Building A - Floor 2', 'Office Building B - Floor 1', 'Remote'],
      ipRange: '10.0.2'
    },
    {
      namePrefix: 'SRV-',
      assetType: 'server', 
      departments: ['IT'],
      osOptions: ['Windows Server 2022', 'Ubuntu Server 22.04', 'CentOS 8', 'Red Hat Enterprise Linux 9'],
      criticalityRange: ['medium', 'high'],
      locations: ['Data Center A - Rack 1', 'Data Center A - Rack 2', 'Data Center B - Rack 1'],
      ipRange: '10.0.1'
    },
    {
      namePrefix: 'MOBILE-',
      assetType: 'mobile_device',
      departments: ['Sales', 'Executive', 'Field Operations'],
      osOptions: ['iOS 17', 'Android 14', 'iPadOS 17'],
      criticalityRange: ['low', 'high'],
      locations: ['Mobile', 'Remote', 'Field Office'],
      ipRange: '10.0.2'
    },
    {
      namePrefix: 'IOT-',
      assetType: 'iot_device',
      departments: ['Facilities', 'Security', 'Office Administration'],
      osOptions: ['Embedded Linux', 'VxWorks', 'Real-Time OS'],
      criticalityRange: ['low', 'low'], // IoT devices are typically low criticality
      locations: ['Office Building A', 'Office Building B', 'Parking Garage'],
      ipRange: '10.0.3'
    }
  ];

  // Generate 15 additional assets from templates
  for (let i = 0; i < 15; i++) {
    const template = additionalAssetTemplates[i % additionalAssetTemplates.length];
    const department = template.departments[i % template.departments.length];
    const os = template.osOptions[i % template.osOptions.length];
    const location = template.locations[i % template.locations.length];
    
    const criticality = template.criticalityRange[Math.floor(Math.random() * template.criticalityRange.length)];
    const ipSuffix = 50 + i;
    const assetNumber = String(i + 1).padStart(2, '0');
    
    // Create realistic timestamp within last 7 days
    const daysAgo = Math.floor(Math.random() * 7);
    const assetTime = new Date();
    assetTime.setDate(assetTime.getDate() - daysAgo);
    
    const additionalAsset = {
      id: uuidv4(),
      name: `${template.namePrefix}${department.toUpperCase()}-${assetNumber}`,
      assetType: template.assetType,
      ipAddress: `${template.ipRange}.${ipSuffix}`,
      hostname: `${template.namePrefix}${department.toLowerCase()}-${assetNumber}.demo.corp`,
      osType: os,
      osVersion: os.includes('Windows') ? '23H2' : os.includes('Ubuntu') ? '22.04.3' : '8.5',
      criticality: criticality,
      organizationId: organizationId,
      metadata: {
        department: department,
        generated: true,
        assetIndex: i,
        template: template.namePrefix
      },
      status: Math.random() > 0.8 ? 'maintenance' : 'active', // 20% in maintenance
      location: location,
      owner: `${department} Department`,
      lastSeen: assetTime,
    };
    
    assetsData.push(additionalAsset);
  }

  const assets = await models.Asset.bulkCreate(assetsData, {
    returning: true,
    ignoreDuplicates: true,
  });

  return assets;
};

module.exports = { seedAssets };