const bcrypt = require('bcryptjs');
const { models } = require('../models/index');

const seedUsers = async (organizationId) => {
  // Hash passwords
  const hashedPassword = await bcrypt.hash('password', 12);

  const usersData = [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      username: 'admin',
      email: 'admin@demo.corp',
      passwordHash: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'admin',
      organizationId,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      username: 'jsmith',
      email: 'j.smith@demo.corp',
      passwordHash: hashedPassword,
      firstName: 'John',
      lastName: 'Smith',
      role: 'analyst',
      organizationId,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      username: 'mwilson',
      email: 'm.wilson@demo.corp',
      passwordHash: hashedPassword,
      firstName: 'Maria',
      lastName: 'Wilson',
      role: 'analyst',
      organizationId,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440004',
      username: 'rjohnson',
      email: 'r.johnson@demo.corp',
      passwordHash: hashedPassword,
      firstName: 'Robert',
      lastName: 'Johnson',
      role: 'viewer',
      organizationId,
    },
  ];

  const users = await models.User.bulkCreate(usersData, {
    returning: true,
    ignoreDuplicates: true,
  });

  return users;
};

module.exports = { seedUsers };