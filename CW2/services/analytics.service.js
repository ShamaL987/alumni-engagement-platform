const { Op } = require('sequelize');
const { Profile, User, ProfileDocument, Bid, BiddingCycle } = require('../models');
const profileService = require('./profile.service');
const { rowsToCsv } = require('../utils/csv');

function countBy(items, getter) {
  const map = new Map();
  for (const item of items) {
    const key = getter(item) || 'Not specified';
    const label = String(key).trim() || 'Not specified';
    map.set(label, (map.get(label) || 0) + 1);
  }

  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

function topTerms(profiles, getter, limit = 10) {
  const map = new Map();

  for (const profile of profiles) {
    const values = getter(profile) || [];
    for (const raw of values) {
      let label = '';
      if (typeof raw === 'string') label = raw;
      else if (raw && typeof raw === 'object') label = raw.title || raw.name || raw.skill || raw.certificationName || raw.courseName || raw.licenceName || '';

      const clean = String(label).trim();
      if (!clean) continue;
      map.set(clean, (map.get(clean) || 0) + 1);
    }
  }

  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
    .slice(0, limit);
}

function documentsOfType(profile, type) {
  return profileService.safeArray(profile.documents).filter((document) => document.documentType === type);
}

function allDevelopmentItems(profiles) {
  return profiles.flatMap((profile) => profileService.safeArray(profile.documents));
}

function buildSkillGapInsights(profiles) {
  const profileCount = Math.max(profiles.length, 1);
  const topSkills = topTerms(profiles, (profile) => profile.skills, 20);
  const certificateTitles = topTerms(profiles, (profile) => documentsOfType(profile, 'certification'), 20);
  const shortCourseTitles = topTerms(profiles, (profile) => documentsOfType(profile, 'short_course'), 20);

  return [...topSkills, ...certificateTitles, ...shortCourseTitles]
    .reduce((unique, item) => {
      if (!unique.some((existing) => existing.label.toLowerCase() === item.label.toLowerCase())) unique.push(item);
      return unique;
    }, [])
    .slice(0, 10)
    .map((item) => {
      const percentage = Math.round((item.value / profileCount) * 100);
      let severity = 'emerging';
      if (percentage >= 50) severity = 'critical';
      else if (percentage >= 25) severity = 'significant';
      return { ...item, percentage, severity };
    });
}

function completionRate(profiles) {
  if (!profiles.length) return 0;
  const completed = profiles.filter((profile) => profile.fullName && profile.programme && profile.graduationYear && profile.industrySector).length;
  return Math.round((completed / profiles.length) * 100);
}

async function getAnalytics(filters = {}) {
  const alumni = await profileService.listAlumni(filters);
  const developmentItems = allDevelopmentItems(alumni);

  const totalBids = await Bid.count();
  const processedCycles = await BiddingCycle.count({ where: { status: 'processed' } });

  return {
    filters,
    sourceNote: 'All dashboard metrics are calculated from alumni profiles and professional-development records stored in the database. No chart uses hard-coded mock values.',
    summary: {
      totalAlumni: alumni.length,
      profileCompletionRate: completionRate(alumni),
      professionalItems: developmentItems.length,
      totalBids,
      processedCycles
    },
    charts: {
      programmes: countBy(alumni, (profile) => profile.programme).slice(0, 10),
      graduationYears: countBy(alumni, (profile) => profile.graduationYear).sort((a, b) => Number(a.label) - Number(b.label)),
      industrySectors: countBy(alumni, (profile) => profile.industrySector).slice(0, 10),
      jobTitles: countBy(alumni, (profile) => profile.currentJobTitle).slice(0, 10),
      topSkills: topTerms(alumni, (profile) => profile.skills, 10),
      developmentTypes: countBy(developmentItems, (item) => item.documentType).slice(0, 8),
      developmentTitles: topTerms([{ documents: developmentItems }], (profile) => profile.documents, 12),
      issuers: countBy(developmentItems, (item) => item.issuer).slice(0, 10),
      geography: countBy(alumni, (profile) => profile.country || profile.city).slice(0, 10),
      skillGaps: buildSkillGapInsights(alumni)
    },
    alumni
  };
}

function analyticsToCsv(analytics) {
  const rows = analytics.alumni.map((profile) => ({
    fullName: profile.fullName || '',
    email: profile.user?.email || '',
    programme: profile.programme || '',
    graduationYear: profile.graduationYear || '',
    industrySector: profile.industrySector || '',
    currentJobTitle: profile.currentJobTitle || '',
    employer: profile.employer || '',
    country: profile.country || '',
    skills: profileService.safeArray(profile.skills).join('; '),
    professionalDevelopment: profileService.safeArray(profile.documents).map((item) => `${item.documentType}: ${item.title}`).join('; ')
  }));

  return rowsToCsv(rows, [
    { key: 'fullName', label: 'Full name' },
    { key: 'email', label: 'Email' },
    { key: 'programme', label: 'Programme' },
    { key: 'graduationYear', label: 'Graduation year' },
    { key: 'industrySector', label: 'Industry sector' },
    { key: 'currentJobTitle', label: 'Current job title' },
    { key: 'employer', label: 'Employer' },
    { key: 'country', label: 'Country' },
    { key: 'skills', label: 'Skills' },
    { key: 'professionalDevelopment', label: 'Professional development' }
  ]);
}

async function filterOptions() {
  const profiles = await Profile.findAll({
    attributes: ['programme', 'graduationYear', 'industrySector'],
    include: [{ model: User, as: 'user', attributes: [], where: { role: 'alumni' } }],
    order: [['programme', 'ASC']]
  });

  const plain = profiles.map((profile) => profile.get({ plain: true }));
  const uniq = (key) => [...new Set(plain.map((item) => item[key]).filter(Boolean))].sort();

  return {
    programmes: uniq('programme'),
    graduationYears: uniq('graduationYear').sort((a, b) => b - a),
    industrySectors: uniq('industrySector')
  };
}

module.exports = { getAnalytics, analyticsToCsv, filterOptions };
