const { User, Profile, ApiKey, ProfileDocument } = require('../models');
const { hashPassword } = require('../utils/hash');
const apiKeyService = require('./apiKey.service');

async function createUserIfMissing(email, password, role) {
  const [user, created] = await User.findOrCreate({
    where: { email },
    defaults: {
      email,
      passwordHash: await hashPassword(password),
      role,
      isEmailVerified: true
    }
  });

  if (role === 'alumni') {
    await Profile.findOrCreate({
      where: { userId: user.id },
      defaults: { userId: user.id, isPublic: true }
    });
  }

  return { user, created };
}

async function createDemoAlumni(email, password, profileData, developmentItems = []) {
  const { user } = await createUserIfMissing(email, password, 'alumni');
  const [profile] = await Profile.findOrCreate({ where: { userId: user.id }, defaults: { userId: user.id, isPublic: true } });

  const hasRealProfileData = Boolean(profile.fullName || profile.programme || profile.currentJobTitle);
  if (!hasRealProfileData) {
    await profile.update({
      fullName: profileData.fullName,
      programme: profileData.programme,
      graduationYear: profileData.graduationYear,
      industrySector: profileData.industrySector,
      currentJobTitle: profileData.currentJobTitle,
      employer: profileData.employer,
      country: profileData.country,
      city: profileData.city,
      skills: profileData.skills || [],
      biography: profileData.biography || null,
      isPublic: true
    });
  }

  const existingItems = await ProfileDocument.count({ where: { userId: user.id } });
  if (!existingItems) {
    for (const item of developmentItems) {
      await ProfileDocument.create({ profileId: profile.id, userId: user.id, ...item });
    }
  }
}

async function seedInitialData() {
  const { user: admin } = await createUserIfMissing(
    process.env.SEED_ADMIN_EMAIL || 'admin@westminster.ac.uk',
    process.env.SEED_ADMIN_PASSWORD || 'Admin@12345',
    'admin'
  );

  await createUserIfMissing(
    process.env.SEED_CLIENT_EMAIL || 'client@westminster.ac.uk',
    process.env.SEED_CLIENT_PASSWORD || 'Client@12345',
    'client'
  );

  await createUserIfMissing(
    process.env.SEED_ALUMNI_EMAIL || 'alumni@westminster.ac.uk',
    process.env.SEED_ALUMNI_PASSWORD || 'Alumni@12345',
    'alumni'
  );

  if (String(process.env.SEED_DEMO_DATA || 'false').toLowerCase() === 'true') {
    await createDemoAlumni('maya.data@westminster.ac.uk', 'Alumni@12345', {
      fullName: 'Maya Fernando',
      programme: 'Business Management',
      graduationYear: 2022,
      industrySector: 'Data Analytics',
      currentJobTitle: 'Junior Data Analyst',
      employer: 'Insight Labs',
      country: 'Sri Lanka',
      city: 'Colombo',
      skills: ['Python', 'SQL', 'Tableau', 'Excel']
    }, [
      { documentType: 'certification', title: 'Google Data Analytics', issuer: 'Google', issuedAt: '2024-03-01' },
      { documentType: 'short_course', title: 'Python for Data Analysis', issuer: 'Coursera', issuedAt: '2024-05-10' }
    ]);

    await createDemoAlumni('sam.cloud@westminster.ac.uk', 'Alumni@12345', {
      fullName: 'Sam Perera',
      programme: 'Computer Science',
      graduationYear: 2021,
      industrySector: 'Cloud Computing',
      currentJobTitle: 'Cloud Support Engineer',
      employer: 'CloudOps Ltd',
      country: 'United Kingdom',
      city: 'Manchester',
      skills: ['AWS', 'Kubernetes', 'Docker', 'Linux']
    }, [
      { documentType: 'certification', title: 'AWS Solutions Architect Associate', issuer: 'Amazon Web Services', issuedAt: '2024-01-15' },
      { documentType: 'certification', title: 'CKA Kubernetes', issuer: 'Cloud Native Computing Foundation', issuedAt: '2024-08-12' }
    ]);
  }

  const existingKeys = await ApiKey.count();
  if (!existingKeys) {
    await apiKeyService.createApiKey({
      name: 'University Analytics Dashboard',
      clientType: 'analytics_dashboard',
      createdByUserId: admin.id
    });
    await apiKeyService.createApiKey({
      name: 'test Alumni of Day',
      clientType: 'test_app',
      createdByUserId: admin.id
    });
  }
}

module.exports = { seedInitialData };
