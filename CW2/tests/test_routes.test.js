const express = require('express');
const request = require('supertest');
const { endpointCases } = require('./data');

jest.mock('../middleware/apiAuth.middleware', () => ({
  requireJwt: (req, res, next) => {
    req.user = { id: 1, role: 'admin', email: 'admin@westminster.ac.uk' };
    next();
  },
  requireApiRole: (...roles) => (req, res, next) => {
    req.user = {
      id: 1,
      role: roles.includes('admin') ? 'admin' : roles[0],
      email: `${roles.includes('admin') ? 'admin' : roles[0]}@westminster.ac.uk`
    };
    next();
  }
}));

jest.mock('../middleware/apiKey.middleware', () => ({
  requireApiPermission: (permission) => (req, res, next) => {
    req.apiKey = { id: 1, permissions: [permission] };
    next();
  }
}));

jest.mock('../middleware/upload.middleware', () => ({
  imageUpload: {
    single: () => (req, res, next) => next()
  },
  documentUpload: {
    single: () => (req, res, next) => next()
  }
}));

jest.mock('../controllers/api/auth.controller', () => ({
  register: (req, res) => res.status(201).json({ success: true, message: 'Registration successful.', data: { id: 1 } }),
  login: (req, res) => res.status(200).json({ success: true, message: 'Login successful.', data: { token: 'test-token' } }),
  verifyEmail: (req, res) => res.status(200).json({ success: true, message: 'Email verified.', data: { verified: true } }),
  verifyToken: (req, res) => res.status(200).json({ success: true, message: 'Token valid.', data: req.user }),
  logout: (req, res) => res.status(200).json({ success: true, message: 'Logout successful.' }),
  usage: (req, res) => res.status(200).json({ success: true, message: 'Usage returned.', data: [] }),
  forgotPassword: (req, res) => res.status(200).json({ success: true, message: 'Reset email sent.' }),
  resetPassword: (req, res) => res.status(200).json({ success: true, message: 'Password reset successful.' })
}));

jest.mock('../controllers/api/public.controller', () => ({
  alumniOfDay: (req, res) => res.status(200).json({ success: true, message: 'Featured alumnus returned.', data: { id: 1 } })
}));

jest.mock('../controllers/api/profile.controller', () => ({
  me: (req, res) => res.status(200).json({ success: true, message: 'Profile returned.', data: { id: 1 } }),
  updateMe: (req, res) => res.status(200).json({ success: true, message: 'Profile saved.', data: { id: 1 } }),
  deleteMe: (req, res) => res.status(200).json({ success: true, message: 'Profile deleted.' }),
  addDocument: (req, res) => res.status(201).json({ success: true, message: 'Professional item created.', data: { id: 1 } }),
  updateDocument: (req, res) => res.status(200).json({ success: true, message: 'Professional item updated.', data: { id: Number(req.params.id) } }),
  deleteDocument: (req, res) => res.status(200).json({ success: true, message: 'Professional item deleted.' }),
  listAlumni: (req, res) => res.status(200).json({ success: true, message: 'Alumni returned.', data: [] })
}));

jest.mock('../controllers/api/bid.controller', () => ({
  current: (req, res) => res.status(200).json({ success: true, message: 'Current cycle returned.', data: { cycleId: 1 } }),
  place: (req, res) => res.status(201).json({ success: true, message: 'Bid placed.', data: { id: 1 } }),
  status: (req, res) => res.status(200).json({ success: true, message: 'Bid status returned.', data: { feedback: 'winning' } }),
  mine: (req, res) => res.status(200).json({ success: true, message: 'Own bids returned.', data: [] }),
  update: (req, res) => res.status(200).json({ success: true, message: 'Bid updated.', data: { id: Number(req.params.id) } }),
  cancel: (req, res) => res.status(200).json({ success: true, message: 'Bid cancelled.' }),
  processCurrent: (req, res) => res.status(200).json({ success: true, message: 'Cycle processed.', data: { id: 1 } }),
  history: (req, res) => res.status(200).json({ success: true, message: 'Cycle history returned.', data: [] }),
  cycle: (req, res) => res.status(200).json({ success: true, message: 'Cycle returned.', data: { id: Number(req.params.id) } })
}));

jest.mock('../controllers/api/analytics.controller', () => ({
  overview: (req, res) => res.status(200).json({ success: true, message: 'Analytics returned.', data: { summary: {} } }),
  exportCsv: (req, res) => {
    res.header('Content-Type', 'text/csv');
    res.status(200).send('name,programme\nAlex,Computer Science\n');
  }
}));

jest.mock('../controllers/api/admin.controller', () => ({
  listApiKeys: (req, res) => res.status(200).json({ success: true, message: 'API keys returned.', data: [] }),
  createApiKey: (req, res) => res.status(201).json({ success: true, message: 'API key created.', data: { id: 1, secret: 'test-secret' } }),
  revokeApiKey: (req, res) => res.status(200).json({ success: true, message: 'API key revoked.', data: { id: Number(req.params.id) } }),
  usage: (req, res) => res.status(200).json({ success: true, message: 'Usage returned.', data: {} })
}));

const apiRoutes = require('../routes/api');

const createTestApp = () => {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use('/api', apiRoutes);

  app.use((error, req, res, next) => {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  });

  return app;
};

const applyRequestData = (testRequest, testCase) => {
  if (testCase.headers) {
    Object.entries(testCase.headers).forEach(([key, value]) => testRequest.set(key, value));
  }

  if (testCase.query) {
    testRequest.query(testCase.query);
  }

  if (testCase.multipart) {
    Object.entries(testCase.fields || {}).forEach(([key, value]) => testRequest.field(key, value));
    return testRequest;
  }

  if (testCase.body) {
    testRequest.send(testCase.body);
  }

  return testRequest;
};

describe('API routes happy path smoke tests', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  test.each(endpointCases)('$method $path - $name', async (testCase) => {
    const testRequest = request(app)[testCase.method](testCase.path);
    applyRequestData(testRequest, testCase);

    const response = await testRequest.expect(testCase.expectedStatus);

    if (testCase.expectedType) {
      expect(response.headers['content-type']).toMatch(testCase.expectedType);
      expect(response.text).toBeTruthy();
      return;
    }

    expect(response.body).toHaveProperty('success', true);
  });
});
