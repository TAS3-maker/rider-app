const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const env = {
  NODE_PORT: parseInt(process.env.NODE_PORT || '8500', 10),
  MONGO_URL: process.env.MONGO_URL || 'mongodb://localhost:27017',
  MONGO_DB_NAME: process.env.MONGO_DB_NAME || 'ridepact',

  JWT_SECRET: process.env.JWT_SECRET || '',
  JWT_ISSUER: process.env.JWT_ISSUER || 'ridepact-api',
  JWT_AUDIENCE: process.env.JWT_AUDIENCE || 'ridepact-clients',
  ACCESS_TOKEN_TTL: process.env.ACCESS_TOKEN_TTL || '7d',

  DEV_MODE: String(process.env.DEV_MODE || 'true') === 'true',

  ADMIN_EMAIL: (process.env.ADMIN_EMAIL || 'admin@ridepact.com').toLowerCase(),
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'Admin@12345',
  SEED_UNIVERSITY_NAME: process.env.SEED_UNIVERSITY_NAME || 'State University',
  SEED_UNIVERSITY_DOMAIN: (process.env.SEED_UNIVERSITY_DOMAIN || 'university.edu').toLowerCase(),
};

module.exports = env;
