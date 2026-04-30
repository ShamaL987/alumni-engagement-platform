const authHeader = { Authorization: 'Bearer test-jwt-token' };
const apiKeyHeader = { Authorization: 'Bearer test-api-key' };

const jsonHeaders = { 'Content-Type': 'application/json' };

const endpointCases = [
  {
    name: 'register a new alumni account',
    method: 'post',
    path: '/api/auth/register',
    expectedStatus: 201,
    headers: jsonHeaders,
    body: {
      email: 'alumni@westminster.ac.uk',
      password: 'Alumni@12345',
      role: 'alumni'
    }
  },
  {
    name: 'login and return a token',
    method: 'post',
    path: '/api/auth/login',
    expectedStatus: 200,
    headers: jsonHeaders,
    body: {
      email: 'admin@westminster.ac.uk',
      password: 'Admin@12345'
    }
  },
  {
    name: 'verify email using query token',
    method: 'get',
    path: '/api/auth/verify-email',
    expectedStatus: 200,
    query: { token: 'email-verification-token' }
  },
  {
    name: 'verify email using body token',
    method: 'post',
    path: '/api/auth/verify-email',
    expectedStatus: 200,
    headers: jsonHeaders,
    body: { token: 'email-verification-token' }
  },
  {
    name: 'verify current JWT token',
    method: 'get',
    path: '/api/auth/verify-token',
    expectedStatus: 200,
    headers: authHeader
  },
  {
    name: 'logout authenticated user',
    method: 'post',
    path: '/api/auth/logout',
    expectedStatus: 200,
    headers: authHeader
  },
  {
    name: 'get authenticated user usage logs',
    method: 'get',
    path: '/api/auth/usage',
    expectedStatus: 200,
    headers: authHeader
  },
  {
    name: 'request forgot password flow',
    method: 'post',
    path: '/api/auth/forgot-password',
    expectedStatus: 200,
    headers: jsonHeaders,
    body: { email: 'alumni@westminster.ac.uk' }
  },
  {
    name: 'reset password using token',
    method: 'post',
    path: '/api/auth/reset-password',
    expectedStatus: 200,
    headers: jsonHeaders,
    body: { token: 'reset-token', password: 'NewPass@12345' }
  },
  {
    name: 'get alumni of the day for public client',
    method: 'get',
    path: '/api/public/alumni-of-day',
    expectedStatus: 200,
    headers: apiKeyHeader
  },
  {
    name: 'get featured alumnus today alias',
    method: 'get',
    path: '/api/public/featured/today',
    expectedStatus: 200,
    headers: apiKeyHeader
  },
  {
    name: 'get authenticated alumni profile',
    method: 'get',
    path: '/api/profiles/me',
    expectedStatus: 200,
    headers: authHeader
  },
  {
    name: 'update authenticated alumni profile',
    method: 'put',
    path: '/api/profiles/me',
    expectedStatus: 200,
    headers: authHeader,
    multipart: true,
    fields: {
      fullName: 'Alex Graduate',
      programme: 'Computer Science',
      graduationYear: '2026',
      industrySector: 'Software Engineering',
      currentJobTitle: 'Software Engineer',
      skills: 'Node.js, SQL, Express'
    }
  },
  {
    name: 'add professional development document',
    method: 'post',
    path: '/api/profiles/me/documents',
    expectedStatus: 201,
    headers: authHeader,
    multipart: true,
    fields: {
      documentType: 'certification',
      title: 'AWS Cloud Practitioner',
      issuer: 'Amazon Web Services',
      issuedAt: '2026-01-15'
    }
  },
  {
    name: 'update professional development document',
    method: 'put',
    path: '/api/profiles/me/documents/1',
    expectedStatus: 200,
    headers: authHeader,
    multipart: true,
    fields: {
      documentType: 'certification',
      title: 'AWS Cloud Practitioner Updated',
      issuer: 'Amazon Web Services'
    }
  },
  {
    name: 'delete professional development document',
    method: 'delete',
    path: '/api/profiles/me/documents/1',
    expectedStatus: 200,
    headers: authHeader
  },
  {
    name: 'get authenticated alumni profile alias',
    method: 'get',
    path: '/api/profile/me',
    expectedStatus: 200,
    headers: authHeader
  },
  {
    name: 'create or update profile alias',
    method: 'post',
    path: '/api/profile',
    expectedStatus: 200,
    headers: authHeader,
    multipart: true,
    fields: {
      fullName: 'Alex Graduate',
      programme: 'Computer Science',
      skills: 'JavaScript, SQL'
    }
  },
  {
    name: 'update profile alias',
    method: 'put',
    path: '/api/profile',
    expectedStatus: 200,
    headers: authHeader,
    multipart: true,
    fields: {
      fullName: 'Alex Graduate Updated',
      programme: 'Computer Science',
      skills: 'Express, Sequelize'
    }
  },
  {
    name: 'delete profile alias',
    method: 'delete',
    path: '/api/profile',
    expectedStatus: 200,
    headers: authHeader
  },
  {
    name: 'add professional development alias',
    method: 'post',
    path: '/api/profile/development',
    expectedStatus: 201,
    headers: authHeader,
    multipart: true,
    fields: {
      documentType: 'short_course',
      title: 'Agile Scrum Foundations',
      issuer: 'Scrum Provider'
    }
  },
  {
    name: 'update professional development alias',
    method: 'put',
    path: '/api/profile/development/1',
    expectedStatus: 200,
    headers: authHeader,
    multipart: true,
    fields: {
      documentType: 'short_course',
      title: 'Agile Scrum Foundations Updated',
      issuer: 'Scrum Provider'
    }
  },
  {
    name: 'delete professional development alias',
    method: 'delete',
    path: '/api/profile/development/1',
    expectedStatus: 200,
    headers: authHeader
  },
  {
    name: 'get current bidding cycle',
    method: 'get',
    path: '/api/bids/current',
    expectedStatus: 200,
    headers: authHeader
  },
  {
    name: 'place bid using current endpoint',
    method: 'post',
    path: '/api/bids/current',
    expectedStatus: 201,
    headers: { ...authHeader, ...jsonHeaders },
    body: { bidAmount: 25 }
  },
  {
    name: 'get current bidding cycle alias',
    method: 'get',
    path: '/api/bids/current-cycle',
    expectedStatus: 200,
    headers: authHeader
  },
  {
    name: 'place blind bid',
    method: 'post',
    path: '/api/bids',
    expectedStatus: 201,
    headers: { ...authHeader, ...jsonHeaders },
    body: { bidAmount: 30 }
  },
  {
    name: 'get current bid status',
    method: 'get',
    path: '/api/bids/status',
    expectedStatus: 200,
    headers: authHeader
  },
  {
    name: 'list own bids',
    method: 'get',
    path: '/api/bids/me',
    expectedStatus: 200,
    headers: authHeader
  },
  {
    name: 'increase bid',
    method: 'patch',
    path: '/api/bids/1',
    expectedStatus: 200,
    headers: { ...authHeader, ...jsonHeaders },
    body: { bidAmount: 35 }
  },
  {
    name: 'cancel bid',
    method: 'delete',
    path: '/api/bids/1',
    expectedStatus: 200,
    headers: authHeader
  },
  {
    name: 'process current bidding cycle',
    method: 'post',
    path: '/api/bids/process-current-cycle',
    expectedStatus: 200,
    headers: authHeader
  },
  {
    name: 'list cycle history',
    method: 'get',
    path: '/api/bids/cycles/history',
    expectedStatus: 200,
    headers: authHeader
  },
  {
    name: 'get cycle by id',
    method: 'get',
    path: '/api/bids/cycles/1',
    expectedStatus: 200,
    headers: authHeader
  },
  {
    name: 'list alumni for analytics client',
    method: 'get',
    path: '/api/alumni',
    expectedStatus: 200,
    headers: apiKeyHeader,
    query: {
      programme: 'Computer Science',
      graduationYear: '2026',
      industrySector: 'Software Engineering'
    }
  },
  {
    name: 'get analytics overview',
    method: 'get',
    path: '/api/analytics/overview',
    expectedStatus: 200,
    headers: apiKeyHeader,
    query: { programme: 'Computer Science' }
  },
  {
    name: 'export analytics as csv',
    method: 'get',
    path: '/api/analytics/export.csv',
    expectedStatus: 200,
    headers: apiKeyHeader,
    expectedType: /text\/csv/
  },
  {
    name: 'list admin api keys',
    method: 'get',
    path: '/api/admin/api-keys',
    expectedStatus: 200,
    headers: authHeader
  },
  {
    name: 'create scoped api key',
    method: 'post',
    path: '/api/admin/api-keys',
    expectedStatus: 201,
    headers: { ...authHeader, ...jsonHeaders },
    body: {
      name: 'University Analytics Dashboard',
      clientType: 'analytics_dashboard',
      permissions: ['read:alumni', 'read:analytics']
    }
  },
  {
    name: 'revoke api key',
    method: 'post',
    path: '/api/admin/api-keys/1/revoke',
    expectedStatus: 200,
    headers: authHeader
  },
  {
    name: 'get admin usage statistics',
    method: 'get',
    path: '/api/admin/usage',
    expectedStatus: 200,
    headers: authHeader
  }
];

module.exports = { endpointCases };
