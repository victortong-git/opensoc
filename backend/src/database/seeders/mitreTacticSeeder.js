'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tactics = [
      {
        id: 'b5327a94-3e24-4d85-9f24-7f8fa6f3b5c1',
        mitre_id: 'TA0001',
        name: 'Initial Access',
        description: 'The adversary is trying to get into your network. Initial Access consists of techniques that use various entry vectors to gain their initial foothold within a network.',
        short_description: 'Techniques used to gain initial foothold in a network',
        url: 'https://attack.mitre.org/tactics/TA0001/',
        order: 1,
        is_active: true,
        version: '14.1',
        last_updated: new Date('2023-10-25'),
        aliases: ['Initial Compromise'],
        platforms: ['Windows', 'macOS', 'Linux', 'Network', 'PRE', 'Containers', 'IaaS', 'SaaS', 'Google Workspace', 'Azure AD', 'Office 365'],
        data_source: 'mitre',
        organization_id: null,
        is_test_data: false,
        metadata: JSON.stringify({
          external_references: [
            {
              source_name: 'mitre-attack',
              url: 'https://attack.mitre.org/tactics/TA0001',
              external_id: 'TA0001'
            }
          ]
        }),
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 'a1b2c3d4-5e6f-7890-abcd-ef1234567890',
        mitre_id: 'TA0002',
        name: 'Execution',
        description: 'The adversary is trying to run malicious code. Execution consists of techniques that result in adversary-controlled code running on a local or remote system.',
        short_description: 'Techniques for running malicious code',
        url: 'https://attack.mitre.org/tactics/TA0002/',
        order: 2,
        is_active: true,
        version: '14.1',
        last_updated: new Date('2023-10-25'),
        aliases: ['Code Execution'],
        platforms: ['Windows', 'macOS', 'Linux', 'Containers', 'IaaS', 'Network'],
        data_source: 'mitre',
        organization_id: null,
        is_test_data: false,
        metadata: JSON.stringify({
          external_references: [
            {
              source_name: 'mitre-attack',
              url: 'https://attack.mitre.org/tactics/TA0002',
              external_id: 'TA0002'
            }
          ]
        }),
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 'b2c3d4e5-6f78-9012-bcde-f23456789012',
        mitre_id: 'TA0003',
        name: 'Persistence',
        description: 'The adversary is trying to maintain their foothold. Persistence consists of techniques that adversaries use to keep access to systems across restarts, changed credentials, and other interruptions.',
        short_description: 'Techniques for maintaining access to systems',
        url: 'https://attack.mitre.org/tactics/TA0003/',
        order: 3,
        is_active: true,
        version: '14.1',
        last_updated: new Date('2023-10-25'),
        aliases: ['Maintain Access'],
        platforms: ['Windows', 'macOS', 'Linux', 'Containers', 'IaaS', 'SaaS', 'Google Workspace', 'Azure AD', 'Office 365'],
        data_source: 'mitre',
        organization_id: null,
        is_test_data: false,
        metadata: JSON.stringify({
          external_references: [
            {
              source_name: 'mitre-attack',
              url: 'https://attack.mitre.org/tactics/TA0003',
              external_id: 'TA0003'
            }
          ]
        }),
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 'c3d4e5f6-7890-1234-cdef-345678901234',
        mitre_id: 'TA0004',
        name: 'Privilege Escalation',
        description: 'The adversary is trying to gain higher-level permissions. Privilege Escalation consists of techniques that adversaries use to gain higher-level permissions on a system or network.',
        short_description: 'Techniques for gaining higher-level permissions',
        url: 'https://attack.mitre.org/tactics/TA0004/',
        order: 4,
        is_active: true,
        version: '14.1',
        last_updated: new Date('2023-10-25'),
        aliases: ['Elevate Privileges'],
        platforms: ['Windows', 'macOS', 'Linux', 'Containers', 'IaaS', 'Google Workspace', 'Azure AD', 'Office 365'],
        data_source: 'mitre',
        organization_id: null,
        is_test_data: false,
        metadata: JSON.stringify({
          external_references: [
            {
              source_name: 'mitre-attack',
              url: 'https://attack.mitre.org/tactics/TA0004',
              external_id: 'TA0004'
            }
          ]
        }),
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 'd4e5f617-8901-2345-def0-456789012346',
        mitre_id: 'TA0005',
        name: 'Defense Evasion',
        description: 'The adversary is trying to avoid being detected. Defense Evasion consists of techniques that adversaries use to avoid detection throughout their compromise.',
        short_description: 'Techniques for avoiding detection',
        url: 'https://attack.mitre.org/tactics/TA0005/',
        order: 5,
        is_active: true,
        version: '14.1',
        last_updated: new Date('2023-10-25'),
        aliases: ['Avoid Detection'],
        platforms: ['Windows', 'macOS', 'Linux', 'Containers', 'IaaS', 'SaaS', 'Google Workspace', 'Azure AD', 'Office 365'],
        data_source: 'mitre',
        organization_id: null,
        is_test_data: false,
        metadata: JSON.stringify({
          external_references: [
            {
              source_name: 'mitre-attack',
              url: 'https://attack.mitre.org/tactics/TA0005',
              external_id: 'TA0005'
            }
          ]
        }),
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 'e5f6a7b8-9012-3456-ef01-567890123456',
        mitre_id: 'TA0006',
        name: 'Credential Access',
        description: 'The adversary is trying to steal account names and passwords. Credential Access consists of techniques for stealing credentials like account names and passwords.',
        short_description: 'Techniques for stealing credentials',
        url: 'https://attack.mitre.org/tactics/TA0006/',
        order: 6,
        is_active: true,
        version: '14.1',
        last_updated: new Date('2023-10-25'),
        aliases: ['Steal Credentials'],
        platforms: ['Windows', 'macOS', 'Linux', 'Azure AD', 'Office 365', 'SaaS', 'IaaS', 'Google Workspace', 'Containers'],
        data_source: 'mitre',
        organization_id: null,
        is_test_data: false,
        metadata: JSON.stringify({
          external_references: [
            {
              source_name: 'mitre-attack',
              url: 'https://attack.mitre.org/tactics/TA0006',
              external_id: 'TA0006'
            }
          ]
        }),
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 'f6a7b8c9-0123-4567-f012-678901234567',
        mitre_id: 'TA0007',
        name: 'Discovery',
        description: 'The adversary is trying to figure out your environment. Discovery consists of techniques an adversary may use to gain knowledge about the system and internal network.',
        short_description: 'Techniques for gaining knowledge about systems and networks',
        url: 'https://attack.mitre.org/tactics/TA0007/',
        order: 7,
        is_active: true,
        version: '14.1',
        last_updated: new Date('2023-10-25'),
        aliases: ['Information Gathering'],
        platforms: ['Windows', 'macOS', 'Linux', 'Network', 'Azure AD', 'Office 365', 'SaaS', 'IaaS', 'Google Workspace', 'Containers'],
        data_source: 'mitre',
        organization_id: null,
        is_test_data: false,
        metadata: JSON.stringify({
          external_references: [
            {
              source_name: 'mitre-attack',
              url: 'https://attack.mitre.org/tactics/TA0007',
              external_id: 'TA0007'
            }
          ]
        }),
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 'a7b8c9d0-1234-5678-a123-789012345678',
        mitre_id: 'TA0008',
        name: 'Lateral Movement',
        description: 'The adversary is trying to move through your environment. Lateral Movement consists of techniques that adversaries use to enter and control remote systems on a network.',
        short_description: 'Techniques for moving through networks',
        url: 'https://attack.mitre.org/tactics/TA0008/',
        order: 8,
        is_active: true,
        version: '14.1',
        last_updated: new Date('2023-10-25'),
        aliases: ['Move Laterally'],
        platforms: ['Windows', 'macOS', 'Linux'],
        data_source: 'mitre',
        organization_id: null,
        is_test_data: false,
        metadata: JSON.stringify({
          external_references: [
            {
              source_name: 'mitre-attack',
              url: 'https://attack.mitre.org/tactics/TA0008',
              external_id: 'TA0008'
            }
          ]
        }),
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 'a8b9c0d1-2345-6789-a234-890123456789',
        mitre_id: 'TA0009',
        name: 'Collection',
        description: 'The adversary is trying to gather data of interest to their goal. Collection consists of techniques adversaries may use to gather information and the sources information is collected from.',
        short_description: 'Techniques for gathering data of interest',
        url: 'https://attack.mitre.org/tactics/TA0009/',
        order: 9,
        is_active: true,
        version: '14.1',
        last_updated: new Date('2023-10-25'),
        aliases: ['Data Gathering'],
        platforms: ['Windows', 'macOS', 'Linux', 'Network', 'Google Workspace', 'Azure AD', 'Office 365'],
        data_source: 'mitre',
        organization_id: null,
        is_test_data: false,
        metadata: JSON.stringify({
          external_references: [
            {
              source_name: 'mitre-attack',
              url: 'https://attack.mitre.org/tactics/TA0009',
              external_id: 'TA0009'
            }
          ]
        }),
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 'a9b0c1d2-3456-789a-a345-90123456789a',
        mitre_id: 'TA0011',
        name: 'Command and Control',
        description: 'The adversary is trying to communicate with compromised systems to control them. Command and Control consists of techniques that adversaries may use to communicate with systems under their control within a victim network.',
        short_description: 'Techniques for communicating with compromised systems',
        url: 'https://attack.mitre.org/tactics/TA0011/',
        order: 10,
        is_active: true,
        version: '14.1',
        last_updated: new Date('2023-10-25'),
        aliases: ['C2', 'C&C'],
        platforms: ['Windows', 'macOS', 'Linux', 'Network'],
        data_source: 'mitre',
        organization_id: null,
        is_test_data: false,
        metadata: JSON.stringify({
          external_references: [
            {
              source_name: 'mitre-attack',
              url: 'https://attack.mitre.org/tactics/TA0011',
              external_id: 'TA0011'
            }
          ]
        }),
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 'a0b1c2d3-4567-89ab-a456-0123456789ab',
        mitre_id: 'TA0010',
        name: 'Exfiltration',
        description: 'The adversary is trying to steal data. Exfiltration consists of techniques that adversaries may use to steal data from your network.',
        short_description: 'Techniques for stealing data from networks',
        url: 'https://attack.mitre.org/tactics/TA0010/',
        order: 11,
        is_active: true,
        version: '14.1',
        last_updated: new Date('2023-10-25'),
        aliases: ['Data Theft'],
        platforms: ['Windows', 'macOS', 'Linux', 'Network', 'Google Workspace', 'Azure AD', 'Office 365'],
        data_source: 'mitre',
        organization_id: null,
        is_test_data: false,
        metadata: JSON.stringify({
          external_references: [
            {
              source_name: 'mitre-attack',
              url: 'https://attack.mitre.org/tactics/TA0010',
              external_id: 'TA0010'
            }
          ]
        }),
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 'a1b2c3d4-5678-9abc-a567-123456789abc',
        mitre_id: 'TA0040',
        name: 'Impact',
        description: 'The adversary is trying to manipulate, interrupt, or destroy your systems and data. Impact consists of techniques that adversaries use to disrupt availability or compromise integrity by manipulating business and operational processes.',
        short_description: 'Techniques for manipulating, interrupting, or destroying systems and data',
        url: 'https://attack.mitre.org/tactics/TA0040/',
        order: 12,
        is_active: true,
        version: '14.1',
        last_updated: new Date('2023-10-25'),
        aliases: ['Destruction', 'Manipulation'],
        platforms: ['Windows', 'macOS', 'Linux', 'Network'],
        data_source: 'mitre',
        organization_id: null,
        is_test_data: false,
        metadata: JSON.stringify({
          external_references: [
            {
              source_name: 'mitre-attack',
              url: 'https://attack.mitre.org/tactics/TA0040',
              external_id: 'TA0040'
            }
          ]
        }),
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    await queryInterface.bulkInsert('mitre_tactics', tactics);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('mitre_tactics', null, {});
  }
};