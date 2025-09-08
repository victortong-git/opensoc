const { models } = require('../models/index');
const { v4: uuidv4 } = require('uuid');

const seedThreatActors = async (organizationId) => {
  // Comprehensive threat actor data based on real-world APT groups and mockData.ts patterns
  const threatActorData = [
    {
      id: '550e8400-e29b-41d4-a716-446655440080',
      name: 'APT28',
      aliases: ['Fancy Bear', 'Sofacy', 'Strontium', 'IRON TWILIGHT', 'Sednit'],
      description: 'Russian military intelligence (GRU) cyber espionage group active since at least 2007, targeting government, military, and security organizations worldwide',
      motivation: ['espionage', 'information-gathering', 'political-influence'],
      sophistication: 'advanced',
      origin: 'Russia',
      targetSectors: ['government', 'military', 'aerospace', 'defense', 'media', 'think-tanks'],
      techniques: ['T1566.001', 'T1071.001', 'T1059.001', 'T1053.005', 'T1055', 'T1027'],
      organizationId,
      metadata: {
        attribution: 'GRU Unit 26165',
        knownSince: '2007',
        primaryObjective: 'Intelligence collection and political influence operations',
        notableCampaigns: ['DNC Hack 2016', 'Olympic Destroyer', 'VPNFilter'],
        infrastructure: 'Global botnet and proxy networks',
        funding: 'State-sponsored'
      },
      campaigns: ['Operation CloudHopper 2024'],
      isActive: true,
      firstSeen: new Date('2020-01-01T00:00:00Z'),
      lastSeen: new Date('2024-01-15T00:00:00Z'),
      createdAt: new Date('2020-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-15T00:00:00Z')
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440081',
      name: 'APT29',
      aliases: ['Cozy Bear', 'The Dukes', 'NOBELIUM', 'Dark Halo', 'UNC2452'],
      description: 'Russian foreign intelligence service (SVR) cyber espionage group conducting sophisticated intelligence operations against high-value targets',
      motivation: ['espionage', 'information-gathering', 'strategic-intelligence'],
      sophistication: 'expert',
      origin: 'Russia',
      targetSectors: ['government', 'healthcare', 'technology', 'telecommunications', 'energy'],
      techniques: ['T1566.002', 'T1078', 'T1055', 'T1027', 'T1070.004', 'T1588.002'],
      organizationId,
      metadata: {
        attribution: 'SVR (Foreign Intelligence Service)',
        knownSince: '2008',
        primaryObjective: 'Long-term intelligence collection and stealth operations',
        notableCampaigns: ['SolarWinds Supply Chain Attack', 'COVID-19 Research Targeting'],
        infrastructure: 'Advanced persistent infrastructure with legitimate services',
        specialties: ['Supply chain attacks', 'Cloud environments', 'Zero-day exploits']
      },
      campaigns: [],
      isActive: true,
      firstSeen: new Date('2019-01-01T00:00:00Z'),
      lastSeen: new Date('2024-01-14T00:00:00Z'),
      createdAt: new Date('2019-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-14T00:00:00Z')
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440082',
      name: 'Lazarus Group',
      aliases: ['APT38', 'ZINC', 'Hidden Cobra', 'Guardians of Peace', 'Whois Team'],
      description: 'North Korean state-sponsored cybercriminal organization conducting financial crimes and espionage operations',
      motivation: ['financial-gain', 'espionage', 'sabotage', 'sanctions-evasion'],
      sophistication: 'expert',
      origin: 'North Korea',
      targetSectors: ['financial', 'cryptocurrency', 'entertainment', 'government', 'critical-infrastructure'],
      techniques: ['T1566.001', 'T1204.002', 'T1105', 'T1027', 'T1486', 'T1041'],
      organizationId,
      metadata: {
        attribution: 'RGB (North Korean Intelligence)',
        knownSince: '2009',
        primaryObjective: 'Revenue generation and strategic intelligence',
        notableCampaigns: ['WannaCry Ransomware', 'Sony Pictures Hack', 'SWIFT Banking Attacks'],
        financialGains: 'Estimated $2+ billion stolen',
        specialties: ['Cryptocurrency theft', 'Banking fraud', 'Destructive attacks']
      },
      campaigns: ['CryptoHeist 2024'],
      isActive: true,
      firstSeen: new Date('2019-01-01T00:00:00Z'),
      lastSeen: new Date('2024-01-10T00:00:00Z'),
      createdAt: new Date('2019-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-10T00:00:00Z')
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440083',
      name: 'Conti Ransomware Group',
      aliases: ['Conti', 'Wizard Spider', 'TrickBot Syndicate'],
      description: 'Russian-speaking ransomware-as-a-service operation responsible for numerous high-profile attacks before dissolving in 2022',
      motivation: ['financial-gain'],
      sophistication: 'advanced',
      origin: 'Russia',
      targetSectors: ['healthcare', 'manufacturing', 'government', 'education', 'critical-infrastructure'],
      techniques: ['T1566.001', 'T1486', 'T1083', 'T1005', 'T1041', 'T1570'],
      organizationId,
      metadata: {
        attribution: 'Cybercriminal syndicate',
        knownSince: '2020',
        primaryObjective: 'Financial extortion through ransomware',
        notableCampaigns: ['HSE Ireland Attack', 'Costa Rica Government Attack'],
        ransomRevenue: 'Estimated $180+ million',
        status: 'Disbanded (2022), members scattered to other groups'
      },
      campaigns: ['PowerShell Empire Revival'],
      isActive: false,
      firstSeen: new Date('2020-08-01T00:00:00Z'),
      lastSeen: new Date('2023-06-01T00:00:00Z'),
      createdAt: new Date('2020-08-01T00:00:00Z'),
      updatedAt: new Date('2023-06-01T00:00:00Z')
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440084',
      name: 'APT40',
      aliases: ['Leviathan', 'BRONZE MOHAWK', 'Kryptonite Panda', 'Gadolinium'],
      description: 'Chinese state-sponsored cyber espionage group targeting maritime industries, healthcare, and government organizations',
      motivation: ['espionage', 'intellectual-property-theft', 'strategic-advantage'],
      sophistication: 'advanced',
      origin: 'China',
      targetSectors: ['maritime', 'healthcare', 'biomedical', 'government', 'academic-research'],
      techniques: ['T1566.001', 'T1078', 'T1053.005', 'T1055', 'T1048.003', 'T1074.002'],
      organizationId,
      metadata: {
        attribution: 'PLA Unit 61419 / MSS Hainan',
        knownSince: '2013',
        primaryObjective: 'Intelligence collection supporting China\'s maritime interests',
        specialties: ['Maritime intelligence', 'Healthcare data theft', 'COVID-19 research'],
        infrastructure: 'Global C2 network with legitimate services'
      },
      campaigns: [],
      isActive: true,
      firstSeen: new Date('2021-01-01T00:00:00Z'),
      lastSeen: new Date('2024-01-12T00:00:00Z'),
      createdAt: new Date('2021-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-12T00:00:00Z')
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440085',
      name: 'FIN7',
      aliases: ['Carbanak Group', 'Navigator Group', 'GOLD NIAGARA'],
      description: 'Financially motivated threat group targeting retail, restaurant, and hospitality industries for payment card data theft',
      motivation: ['financial-gain'],
      sophistication: 'advanced',
      origin: 'Unknown (likely Eastern European)',
      targetSectors: ['retail', 'hospitality', 'restaurant', 'financial'],
      techniques: ['T1566.001', 'T1059.001', 'T1055', 'T1003.001', 'T1041', 'T1078'],
      organizationId,
      metadata: {
        knownSince: '2015',
        primaryObjective: 'Payment card data theft and fraud',
        notableCampaigns: ['Carbanak Banking Attacks', 'Restaurant POS Breaches'],
        estimatedTheft: 'Over 15 million payment cards compromised',
        specialties: ['Point-of-sale malware', 'Spear phishing', 'Living-off-the-land techniques']
      },
      campaigns: [],
      isActive: true,
      firstSeen: new Date('2020-01-01T00:00:00Z'),
      lastSeen: new Date('2024-01-08T00:00:00Z'),
      createdAt: new Date('2020-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-08T00:00:00Z')
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440086',
      name: 'BlackCat',
      aliases: ['ALPHV', 'Noberus'],
      description: 'Ransomware-as-a-Service group written in Rust, known for sophisticated techniques and high-profile targets',
      motivation: ['financial-gain'],
      sophistication: 'advanced',
      origin: 'Unknown (likely Russian-speaking)',
      targetSectors: ['healthcare', 'critical-infrastructure', 'manufacturing', 'energy', 'government'],
      techniques: ['T1486', 'T1055', 'T1027', 'T1041', 'T1083', 'T1018'],
      organizationId,
      metadata: {
        knownSince: '2021',
        primaryObjective: 'Double extortion ransomware operations',
        notableCampaigns: ['Oil Company Attacks', 'Healthcare System Breaches'],
        uniqueFeatures: 'First major ransomware written in Rust programming language',
        ransomDemands: 'Typically $400k - $3M+ USD'
      },
      campaigns: [],
      isActive: true,
      firstSeen: new Date('2021-11-01T00:00:00Z'),
      lastSeen: new Date('2024-01-13T00:00:00Z'),
      createdAt: new Date('2021-11-01T00:00:00Z'),
      updatedAt: new Date('2024-01-13T00:00:00Z')
    }
  ];

  // Generate additional threat actor templates for variety
  const additionalThreatActorTemplates = [
    {
      namePrefix: 'APT',
      aliases: ['Cyber Espionage Group', 'Advanced Threat'],
      motivation: ['espionage', 'information-gathering'],
      sophistication: 'advanced',
      origin: 'China',
      targetSectors: ['technology', 'government', 'defense'],
      techniques: ['T1566.001', 'T1078', 'T1055']
    },
    {
      namePrefix: 'Ransomware Group',
      aliases: ['Crypto Gang', 'Ransomware Syndicate'],
      motivation: ['financial-gain'],
      sophistication: 'advanced',
      origin: 'Russia',
      targetSectors: ['healthcare', 'manufacturing', 'education'],
      techniques: ['T1486', 'T1041', 'T1083']
    },
    {
      namePrefix: 'FIN',
      aliases: ['Financial Crime Group', 'Banking Threat'],
      motivation: ['financial-gain'],
      sophistication: 'advanced',
      origin: 'Eastern Europe',
      targetSectors: ['financial', 'retail', 'hospitality'],
      techniques: ['T1059.001', 'T1003.001', 'T1041']
    }
  ];

  // Generate 3 additional threat actors for testing
  for (let i = 0; i < 3; i++) {
    const template = additionalThreatActorTemplates[i % additionalThreatActorTemplates.length];
    const actorNumber = String(100 + i).padStart(3, '0');
    
    // Create realistic dates
    const yearsAgo = Math.floor(Math.random() * 3) + 1; // 1-3 years ago
    const firstSeenDate = new Date();
    firstSeenDate.setFullYear(firstSeenDate.getFullYear() - yearsAgo);
    
    const additionalThreatActor = {
      id: uuidv4(),
      name: template.namePrefix.includes('APT') ? `${template.namePrefix}${100 + i}` : `${template.namePrefix} ${i + 1}`,
      aliases: template.aliases.map(alias => `${alias} ${i + 1}`),
      description: `Generated threat actor for testing - ${template.namePrefix} focused on ${template.targetSectors.join(', ')} sectors`,
      motivation: template.motivation,
      sophistication: template.sophistication,
      origin: template.origin,
      targetSectors: template.targetSectors,
      techniques: template.techniques,
      organizationId,
      metadata: {
        generated: true,
        template: template.namePrefix,
        actorIndex: i,
        estimatedSize: Math.floor(Math.random() * 50) + 10 + ' operators'
      },
      campaigns: [],
      isActive: Math.random() > 0.3, // 70% active
      firstSeen: firstSeenDate,
      lastSeen: new Date(firstSeenDate.getTime() + Math.random() * 365 * 24 * 60 * 60 * 1000), // Random time after first seen
      createdAt: firstSeenDate,
      updatedAt: new Date()
    };
    
    threatActorData.push(additionalThreatActor);
  }

  const threatActors = await models.ThreatActor.bulkCreate(threatActorData, {
    returning: true,
    ignoreDuplicates: true,
  });

  return threatActors;
};

module.exports = { seedThreatActors };