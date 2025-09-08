const { models } = require('../models/index');
const { v4: uuidv4 } = require('uuid');

const seedComplianceFrameworks = async (organizationId) => {
  // Comprehensive compliance framework data based on industry standards
  const complianceFrameworkData = [
    {
      id: '550e8400-e29b-41d4-a716-446655440090',
      name: 'NIST Cybersecurity Framework 2.0',
      shortName: 'NIST CSF 2.0',
      version: '2.0',
      description: 'The National Institute of Standards and Technology Cybersecurity Framework provides guidance for organizations to manage and reduce cybersecurity risk',
      type: 'cybersecurity',
      industry: 'cross-sector',
      mandatory: false,
      organizationId,
      metadata: {
        publisher: 'National Institute of Standards and Technology (NIST)',
        publishedDate: '2024-02-26',
        lastUpdated: '2024-02-26',
        applicableTo: ['All sectors', 'Critical infrastructure', 'Federal agencies'],
        maturityLevels: ['Tier 1: Partial', 'Tier 2: Risk Informed', 'Tier 3: Repeatable', 'Tier 4: Adaptive'],
        website: 'https://www.nist.gov/cyberframework'
      },
      controls: [
        {
          id: 'ID.AM-1',
          category: 'Identify',
          subcategory: 'Asset Management',
          name: 'Physical devices and systems within the organization are inventoried',
          description: 'Maintain an accurate, up-to-date, and complete inventory of all physical devices',
          implementationLevel: 'implemented',
          priority: 'high',
          evidence: 'Asset management system with automated discovery'
        },
        {
          id: 'ID.AM-2',
          category: 'Identify',
          subcategory: 'Asset Management',
          name: 'Software platforms and applications within the organization are inventoried',
          description: 'Maintain an accurate inventory of all software platforms and applications',
          implementationLevel: 'implemented',
          priority: 'high',
          evidence: 'Software inventory database updated monthly'
        },
        {
          id: 'PR.AC-1',
          category: 'Protect',
          subcategory: 'Identity Management and Access Control',
          name: 'Identities and credentials are issued, managed, verified, revoked, and audited',
          description: 'Identity and credential lifecycle management processes',
          implementationLevel: 'partially_implemented',
          priority: 'high',
          evidence: 'Active Directory with quarterly access reviews'
        },
        {
          id: 'DE.AE-1',
          category: 'Detect',
          subcategory: 'Anomalies and Events',
          name: 'A baseline of network operations and expected data flows is established',
          description: 'Network baseline for anomaly detection',
          implementationLevel: 'implemented',
          priority: 'medium',
          evidence: 'Network monitoring tools with 30-day baseline'
        },
        {
          id: 'RS.RP-1',
          category: 'Respond',
          subcategory: 'Response Planning',
          name: 'Response plan is executed during or after an incident',
          description: 'Incident response plan execution procedures',
          implementationLevel: 'implemented',
          priority: 'high',
          evidence: 'Documented incident response procedures with tabletop exercises'
        },
        {
          id: 'RC.RP-1',
          category: 'Recover',
          subcategory: 'Recovery Planning',
          name: 'Recovery plan is executed during or after a cybersecurity incident',
          description: 'Recovery procedures to restore systems and operations',
          implementationLevel: 'partially_implemented',
          priority: 'medium',
          evidence: 'Disaster recovery plan tested annually'
        }
      ],
      complianceScore: 78.5,
      assessmentDate: new Date('2024-01-01T00:00:00Z'),
      nextAssessment: new Date('2024-07-01T00:00:00Z'),
      responsible: ['CISO', 'IT Security Team'],
      isActive: true,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-15T00:00:00Z')
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440091',
      name: 'ISO/IEC 27001:2022',
      shortName: 'ISO 27001',
      version: '2022',
      description: 'International standard for information security management systems (ISMS)',
      type: 'information_security',
      industry: 'cross-sector',
      mandatory: false,
      organizationId,
      metadata: {
        publisher: 'International Organization for Standardization (ISO)',
        publishedDate: '2022-10-25',
        lastUpdated: '2022-10-25',
        applicableTo: ['All organizations', 'Service providers', 'Government agencies'],
        certificationBody: 'Third-party certification required',
        website: 'https://www.iso.org/isoiec-27001-information-security.html'
      },
      controls: [
        {
          id: 'A.5.1',
          category: 'Organizational controls',
          subcategory: 'Information security policies',
          name: 'Information security policy',
          description: 'A set of policies for information security shall be defined',
          implementationLevel: 'implemented',
          priority: 'high',
          evidence: 'Board-approved information security policy updated annually'
        },
        {
          id: 'A.8.1',
          category: 'People controls',
          subcategory: 'Prior to employment',
          name: 'Screening',
          description: 'Background verification checks on all candidates for employment',
          implementationLevel: 'implemented',
          priority: 'high',
          evidence: 'HR background check process for all employees'
        },
        {
          id: 'A.13.1',
          category: 'Physical and environmental controls',
          subcategory: 'Secure areas',
          name: 'Physical security perimeter',
          description: 'Security perimeters shall be defined and used to protect areas',
          implementationLevel: 'implemented',
          priority: 'medium',
          evidence: 'Data center with biometric access controls'
        },
        {
          id: 'A.18.1',
          category: 'Technological controls',
          subcategory: 'Cryptography',
          name: 'Policy on the use of cryptographic controls',
          description: 'A policy on the use of cryptographic controls shall be developed',
          implementationLevel: 'partially_implemented',
          priority: 'medium',
          evidence: 'Encryption policy defined, implementation in progress'
        }
      ],
      complianceScore: 82.3,
      assessmentDate: new Date('2023-12-15T00:00:00Z'),
      nextAssessment: new Date('2024-12-15T00:00:00Z'),
      responsible: ['CISO', 'Compliance Team'],
      isActive: true,
      createdAt: new Date('2023-12-15T00:00:00Z'),
      updatedAt: new Date('2024-01-15T00:00:00Z')
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440092',
      name: 'SOC 2 Type II',
      shortName: 'SOC 2',
      version: 'Type II',
      description: 'System and Organization Controls 2 framework for service organizations',
      type: 'service_organization',
      industry: 'technology',
      mandatory: false,
      organizationId,
      metadata: {
        publisher: 'American Institute of Certified Public Accountants (AICPA)',
        applicableTo: ['Service organizations', 'Cloud providers', 'SaaS companies'],
        trustServicesCriteria: ['Security', 'Availability', 'Processing Integrity', 'Confidentiality', 'Privacy'],
        auditPeriod: '12 months',
        website: 'https://www.aicpa.org/interestareas/frc/assuranceadvisoryservices/sorhome.html'
      },
      controls: [
        {
          id: 'CC6.1',
          category: 'Common Criteria',
          subcategory: 'Logical and Physical Access Controls',
          name: 'Logical and Physical Access Controls',
          description: 'The entity implements logical and physical access controls',
          implementationLevel: 'implemented',
          priority: 'high',
          evidence: 'Multi-factor authentication and badge access systems'
        },
        {
          id: 'CC7.1',
          category: 'Common Criteria',
          subcategory: 'System Operations',
          name: 'System Operations',
          description: 'The entity ensures authorized system operations',
          implementationLevel: 'implemented',
          priority: 'high',
          evidence: 'Change management and monitoring procedures'
        },
        {
          id: 'A1.1',
          category: 'Availability',
          subcategory: 'Performance',
          name: 'System Availability',
          description: 'The entity maintains system availability commitments',
          implementationLevel: 'implemented',
          priority: 'high',
          evidence: '99.9% uptime SLA with monitoring and alerting'
        }
      ],
      complianceScore: 89.7,
      assessmentDate: new Date('2023-11-01T00:00:00Z'),
      nextAssessment: new Date('2024-11-01T00:00:00Z'),
      responsible: ['CISO', 'Internal Audit'],
      isActive: true,
      createdAt: new Date('2023-11-01T00:00:00Z'),
      updatedAt: new Date('2024-01-10T00:00:00Z')
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440093',
      name: 'PCI DSS 4.0',
      shortName: 'PCI DSS',
      version: '4.0',
      description: 'Payment Card Industry Data Security Standard for organizations handling payment cards',
      type: 'payment_security',
      industry: 'financial',
      mandatory: true,
      organizationId,
      metadata: {
        publisher: 'PCI Security Standards Council',
        publishedDate: '2022-03-31',
        effectiveDate: '2024-03-31',
        applicableTo: ['Organizations storing, processing, or transmitting cardholder data'],
        merchantLevel: 'Level 2',
        website: 'https://www.pcisecuritystandards.org/'
      },
      controls: [
        {
          id: '1.1',
          category: 'Build and Maintain a Secure Network',
          subcategory: 'Firewall Configuration',
          name: 'Establish and implement firewall configuration standards',
          description: 'Firewalls and routers are configured to restrict connections',
          implementationLevel: 'implemented',
          priority: 'high',
          evidence: 'Firewall rules documented and reviewed quarterly'
        },
        {
          id: '3.1',
          category: 'Protect Stored Cardholder Data',
          subcategory: 'Data Protection',
          name: 'Keep cardholder data storage to a minimum',
          description: 'Limit cardholder data storage and implement data retention policies',
          implementationLevel: 'implemented',
          priority: 'high',
          evidence: 'Data inventory with 90-day retention policy'
        },
        {
          id: '11.1',
          category: 'Regularly Test Security Systems',
          subcategory: 'Security Testing',
          name: 'Test security systems and processes regularly',
          description: 'Implement a process to test security systems and processes',
          implementationLevel: 'partially_implemented',
          priority: 'high',
          evidence: 'Quarterly penetration testing and vulnerability scans'
        }
      ],
      complianceScore: 76.4,
      assessmentDate: new Date('2024-01-10T00:00:00Z'),
      nextAssessment: new Date('2025-01-10T00:00:00Z'),
      responsible: ['CISO', 'Payment Systems Team'],
      isActive: true,
      createdAt: new Date('2024-01-10T00:00:00Z'),
      updatedAt: new Date('2024-01-15T00:00:00Z')
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440094',
      name: 'GDPR',
      shortName: 'GDPR',
      version: '2018',
      description: 'General Data Protection Regulation for data protection and privacy',
      type: 'privacy',
      industry: 'cross-sector',
      mandatory: true,
      organizationId,
      metadata: {
        publisher: 'European Union',
        effectiveDate: '2018-05-25',
        applicableTo: ['EU organizations', 'Organizations processing EU personal data'],
        maxPenalty: '4% of annual global turnover or €20 million',
        website: 'https://gdpr.eu/'
      },
      controls: [
        {
          id: 'Art.25',
          category: 'Data Protection by Design',
          subcategory: 'Privacy by Design',
          name: 'Data protection by design and by default',
          description: 'Implement data protection measures by design and by default',
          implementationLevel: 'partially_implemented',
          priority: 'high',
          evidence: 'Privacy impact assessments for new systems'
        },
        {
          id: 'Art.32',
          category: 'Security of Processing',
          subcategory: 'Technical Measures',
          name: 'Security of processing',
          description: 'Implement appropriate technical and organizational measures',
          implementationLevel: 'implemented',
          priority: 'high',
          evidence: 'Encryption, access controls, and security monitoring'
        },
        {
          id: 'Art.33',
          category: 'Notification',
          subcategory: 'Breach Notification',
          name: 'Notification of personal data breach to supervisory authority',
          description: 'Notify supervisory authority within 72 hours of breach awareness',
          implementationLevel: 'implemented',
          priority: 'high',
          evidence: 'Incident response plan includes GDPR notification procedures'
        }
      ],
      complianceScore: 71.8,
      assessmentDate: new Date('2023-12-01T00:00:00Z'),
      nextAssessment: new Date('2024-06-01T00:00:00Z'),
      responsible: ['DPO', 'Legal Team', 'CISO'],
      isActive: true,
      createdAt: new Date('2023-12-01T00:00:00Z'),
      updatedAt: new Date('2024-01-05T00:00:00Z')
    }
  ];

  const frameworks = await models.ComplianceFramework.bulkCreate(complianceFrameworkData, {
    returning: true,
    ignoreDuplicates: true,
  });

  return frameworks;
};

module.exports = { seedComplianceFrameworks };