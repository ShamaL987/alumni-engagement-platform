const fs = require('fs');
const { Op } = require('sequelize');
const { Profile, User, ProfileDocument } = require('../models');
const { isValidUrl, cleanString } = require('../utils/validators');

const JSON_ARRAY_FIELDS = ['skills', 'degrees', 'certifications', 'licences', 'shortCourses', 'employmentHistory'];
const DOCUMENT_TYPES = new Set(['degree', 'certification', 'licence', 'short_course', 'employment_evidence', 'other']);

function asPlain(record) {
  if (!record) return null;
  if (typeof record.get === 'function') return record.get({ plain: true });
  return record;
}

function safeArray(value) {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined || value === '') return [];

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      return safeArray(parsed);
    } catch {
      return trimmed.split(',').map((item) => item.trim()).filter(Boolean);
    }
  }

  if (typeof value === 'object') {
    return Object.values(value).filter((item) => item !== null && item !== undefined && item !== '');
  }

  return [value];
}

function toNamedObjects(value, preferredKeys = ['name', 'title']) {
  return safeArray(value)
    .map((item) => {
      if (typeof item === 'string') return { name: cleanString(item, 200) };
      if (!item || typeof item !== 'object') return null;

      const copy = { ...item };
      const existingName = preferredKeys.map((key) => copy[key]).find(Boolean);
      if (!copy.name && existingName) copy.name = cleanString(existingName, 200);
      return copy;
    })
    .filter(Boolean)
    .filter((item) => Object.values(item).some((value) => value !== null && value !== undefined && String(value).trim() !== ''));
}

function normalizeProfilePayload(payload = {}) {
  return {
    ...payload,
    skills: safeArray(payload.skills)
      .map((skill) => cleanString(typeof skill === 'string' ? skill : skill?.name || skill?.title || skill?.skill, 80))
      .filter(Boolean),
    degrees: toNamedObjects(payload.degrees, ['degreeName', 'name', 'title']),
    certifications: toNamedObjects(payload.certifications, ['certificationName', 'name', 'title']),
    licences: toNamedObjects(payload.licences, ['licenceName', 'name', 'title']),
    shortCourses: toNamedObjects(payload.shortCourses, ['courseName', 'name', 'title']),
    employmentHistory: safeArray(payload.employmentHistory)
      .map((item) => {
        if (typeof item === 'string') return { name: cleanString(item, 250) };
        if (!item || typeof item !== 'object') return null;
        return item;
      })
      .filter(Boolean)
  };
}

function serializeProfile(record) {
  const plain = asPlain(record);
  if (!plain) return null;

  const normalized = { ...plain };
  for (const field of JSON_ARRAY_FIELDS) {
    normalized[field] = safeArray(normalized[field]);
  }

  normalized.documents = safeArray(normalized.documents).map((document) => asPlain(document) || document);
  return normalized;
}

function serializeProfiles(records) {
  return records.map((record) => serializeProfile(record)).filter(Boolean);
}

function booleanField(value, defaultValue = true) {
  if (value === undefined || value === null || value === '') return defaultValue;
  const values = Array.isArray(value) ? value : [value];
  return values.some((item) => ['on', 'true', '1', 'yes'].includes(String(item).toLowerCase()));
}

function mapProfilePayload(payload = {}) {
  if (!isValidUrl(payload.linkedInUrl)) {
    const error = new Error('LinkedIn URL must be a valid http/https URL. Leave it blank if you do not want to add one yet.');
    error.statusCode = 400;
    throw error;
  }

  const normalized = normalizeProfilePayload(payload);
  const monthlyBonus = Number(normalized.monthlyEventBonusCount || 0);

  return {
    fullName: cleanString(normalized.fullName, 150) || null,
    biography: cleanString(normalized.biography, 3000) || null,
    linkedInUrl: cleanString(normalized.linkedInUrl, 500) || null,
    programme: cleanString(normalized.programme, 150) || null,
    graduationYear: normalized.graduationYear ? Number(normalized.graduationYear) : null,
    graduationDate: normalized.graduationDate || null,
    industrySector: cleanString(normalized.industrySector, 150) || null,
    currentJobTitle: cleanString(normalized.currentJobTitle, 150) || null,
    employer: cleanString(normalized.employer, 150) || null,
    country: cleanString(normalized.country, 100) || null,
    city: cleanString(normalized.city, 100) || null,
    skills: normalized.skills,
    degrees: normalized.degrees,
    certifications: normalized.certifications,
    licences: normalized.licences,
    shortCourses: normalized.shortCourses,
    employmentHistory: normalized.employmentHistory,
    monthlyEventBonusCount: Number.isFinite(monthlyBonus) && monthlyBonus > 0 ? Math.min(monthlyBonus, 12) : 0,
    isPublic: booleanField(normalized.isPublic, true),
    attendedUniversitySession: booleanField(normalized.attendedUniversitySession, false),
  };
}

async function getOrCreateProfile(userId) {
  const [profile] = await Profile.findOrCreate({
    where: { userId },
    defaults: { userId, isPublic: true }
  });
  return profile;
}

async function updateMyProfile(userId, payload, imageFile) {
  const profile = await getOrCreateProfile(userId);
  const values = mapProfilePayload(payload);

  if (imageFile) {
    if (profile.profileImagePath) {
      const absoluteImagePath = `${process.cwd()}${profile.profileImagePath}`;
      fs.promises.unlink(absoluteImagePath).catch(() => {});
    }
    values.profileImagePath = `/uploads/profile-images/${imageFile.filename}`;
  }

  await profile.update(values);
  return getProfileByUserId(userId);
}

async function clearMyProfile(userId) {
  const profile = await getOrCreateProfile(userId);

  if (profile.profileImagePath) {
    const absoluteImagePath = `${process.cwd()}${profile.profileImagePath}`;
    fs.promises.unlink(absoluteImagePath).catch(() => {});
  }

  const documents = await ProfileDocument.findAll({ where: { userId } });
  for (const document of documents) {
    if (document.filePath) {
      const absoluteDocumentPath = `${process.cwd()}${document.filePath}`;
      fs.promises.unlink(absoluteDocumentPath).catch(() => {});
    }
  }

  await ProfileDocument.destroy({ where: { userId } });
  await profile.update({
    fullName: null,
    biography: null,
    linkedInUrl: null,
    profileImagePath: null,
    programme: null,
    graduationYear: null,
    graduationDate: null,
    industrySector: null,
    currentJobTitle: null,
    employer: null,
    country: null,
    city: null,
    skills: [],
    degrees: [],
    certifications: [],
    licences: [],
    shortCourses: [],
    employmentHistory: [],
    monthlyEventBonusCount: 0,
    isPublic: true,
    attendedUniversitySession: false,
  });

  return getProfileByUserId(userId);
}

async function deleteMyProfile(userId) {
  await clearMyProfile(userId);
  await Profile.destroy({ where: { userId } });
}

async function getProfileByUserId(userId) {
  const profile = await Profile.findOne({
    where: { userId },
    include: [
      { model: User, as: 'user', attributes: ['id', 'email', 'role', 'isEmailVerified'] },
      { model: ProfileDocument, as: 'documents' }
    ],
    order: [[{ model: ProfileDocument, as: 'documents' }, 'createdAt', 'DESC']]
  });

  return serializeProfile(profile);
}

function buildAlumniWhere(filters = {}) {
  const where = { isPublic: true };
  if (filters.programme) where.programme = { [Op.like]: `%${filters.programme}%` };
  if (filters.industrySector) where.industrySector = { [Op.like]: `%${filters.industrySector}%` };
  if (filters.graduationYear) where.graduationYear = Number(filters.graduationYear);
  if (filters.fromYear || filters.toYear) {
    where.graduationYear = {};
    if (filters.fromYear) where.graduationYear[Op.gte] = Number(filters.fromYear);
    if (filters.toYear) where.graduationYear[Op.lte] = Number(filters.toYear);
  }
  if (filters.search) {
    where[Op.or] = [
      { fullName: { [Op.like]: `%${filters.search}%` } },
      { currentJobTitle: { [Op.like]: `%${filters.search}%` } },
      { employer: { [Op.like]: `%${filters.search}%` } },
      { programme: { [Op.like]: `%${filters.search}%` } }
    ];
  }
  return where;
}

async function listAlumni(filters = {}) {
  const profiles = await Profile.findAll({
    where: buildAlumniWhere(filters),
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'role', 'isEmailVerified'],
        where: { role: 'alumni' }
      },
      { model: ProfileDocument, as: 'documents' }
    ],
    order: [['updatedAt', 'DESC']]
  });

  return serializeProfiles(profiles);
}

function mapDocumentPayload(payload = {}) {
  if (!cleanString(payload.title, 200)) {
    const error = new Error('Please enter a title for the professional development item.');
    error.statusCode = 400;
    throw error;
  }

  if (payload.externalUrl && !isValidUrl(payload.externalUrl)) {
    const error = new Error('External URL must be valid.');
    error.statusCode = 400;
    throw error;
  }

  return {
    documentType: DOCUMENT_TYPES.has(payload.documentType) ? payload.documentType : 'other',
    title: cleanString(payload.title, 200),
    issuer: cleanString(payload.issuer, 200) || null,
    externalUrl: cleanString(payload.externalUrl, 500) || null,
    issuedAt: payload.issuedAt || null,
    expiresAt: payload.expiresAt || null,
    notes: cleanString(payload.notes, 1000) || null
  };
}

async function addDocument(userId, payload, file) {
  const profile = await getOrCreateProfile(userId);
  const values = mapDocumentPayload(payload);

  return ProfileDocument.create({
    profileId: profile.id,
    userId,
    ...values,
    filePath: file ? `/uploads/documents/${file.filename}` : null
  });
}

async function updateDocument(userId, documentId, payload, file) {
  const document = await ProfileDocument.findOne({ where: { id: documentId, userId } });
  if (!document) {
    const error = new Error('Professional development item not found.');
    error.statusCode = 404;
    throw error;
  }

  const values = mapDocumentPayload(payload);
  if (file) {
    if (document.filePath) {
      const absoluteDocumentPath = `${process.cwd()}${document.filePath}`;
      fs.promises.unlink(absoluteDocumentPath).catch(() => {});
    }
    values.filePath = `/uploads/documents/${file.filename}`;
  }

  await document.update(values);
  return document;
}

async function deleteDocument(userId, documentId) {
  const document = await ProfileDocument.findOne({ where: { id: documentId, userId } });
  if (!document) {
    const error = new Error('Professional development item not found.');
    error.statusCode = 404;
    throw error;
  }

  if (document.filePath) {
    const absolutePath = `${process.cwd()}${document.filePath}`;
    fs.promises.unlink(absolutePath).catch(() => {});
  }

  await document.destroy();
}

module.exports = {
  getOrCreateProfile,
  getProfileByUserId,
  updateMyProfile,
  clearMyProfile,
  deleteMyProfile,
  listAlumni,
  addDocument,
  updateDocument,
  deleteDocument,
  buildAlumniWhere,
  serializeProfile,
  serializeProfiles,
  safeArray
};
