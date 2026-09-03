// Idempotent seed: ensures an admin user + first allowed university exist.
const bcrypt = require('bcryptjs');
const env = require('../src/config/env');
const { connectDB, mongoose } = require('../src/config/db');
const { User, University } = require('../src/models');
const { ROLES } = require('../src/config/constants');

(async () => {
  await connectDB();

  // First allowed university (email-domain verification source).
  const uni = await University.findOneAndUpdate(
    { emailDomain: env.SEED_UNIVERSITY_DOMAIN },
    {
      $set: { name: env.SEED_UNIVERSITY_NAME, isActive: true },
      $setOnInsert: { emailDomain: env.SEED_UNIVERSITY_DOMAIN },
    },
    { upsert: true, new: true }
  );
  console.log(`[seed] university ensured: ${uni.name} (@${uni.emailDomain})`);

  // Admin account. $setOnInsert avoids overwriting an existing admin's password.
  const email = env.ADMIN_EMAIL;
  const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 10);
  const result = await User.updateOne(
    { email },
    {
      $set: { role: ROLES.ADMIN, emailVerified: true, isActive: true },
      $setOnInsert: { email, passwordHash, name: 'Platform Administrator' },
    },
    { upsert: true }
  );
  console.log(
    `[seed] admin ensured: ${email} ${result.upsertedCount ? '(created)' : '(already existed — password unchanged)'}`
  );

  await mongoose.disconnect();
  process.exit(0);
})().catch((err) => {
  console.error('[seed] failed', err);
  process.exit(1);
});
