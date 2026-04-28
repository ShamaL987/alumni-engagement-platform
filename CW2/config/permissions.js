const PERMISSIONS = Object.freeze({
  READ_ALUMNI: 'read:alumni',
  READ_ANALYTICS: 'read:analytics',
  READ_ALUMNI_OF_DAY: 'read:alumni_of_day',
  READ_DONATIONS: 'read:donations',
  MANAGE_API_KEYS: 'manage:api_keys'
});

const CLIENT_PERMISSION_PRESETS = Object.freeze({
  analytics_dashboard: [PERMISSIONS.READ_ALUMNI, PERMISSIONS.READ_ANALYTICS],
  mobile_ar_app: [PERMISSIONS.READ_ALUMNI_OF_DAY],
  custom: []
});

module.exports = { PERMISSIONS, CLIENT_PERMISSION_PRESETS };
