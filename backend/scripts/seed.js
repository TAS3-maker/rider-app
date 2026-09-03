// Idempotent seed: ensures an admin user + first allowed university exist.
const bcrypt = require('bcryptjs');
const env = require('../src/config/env');
const { connectDB, mongoose } = require('../src/config/db');
const { User, University, Airport, Destination } = require('../src/models');
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

  // Reference airports (baseFare = solo cab estimate used for savings math).
  const airports = [
    { code: 'DTW', name: 'Detroit Metropolitan', city: 'Detroit', baseFare: 57 },
    { code: 'ORD', name: "Chicago O'Hare", city: 'Chicago', baseFare: 65 },
    { code: 'LAX', name: 'Los Angeles Intl', city: 'Los Angeles', baseFare: 72 },
    { code: 'JFK', name: 'John F. Kennedy Intl', city: 'New York', baseFare: 68 },
    { code: 'ATL', name: 'Hartsfield-Jackson', city: 'Atlanta', baseFare: 55 },
  ];
  for (const a of airports) {
    await Airport.updateOne(
      { code: a.code },
      { $set: { name: a.name, city: a.city, baseFare: a.baseFare, isActive: true }, $setOnInsert: { code: a.code } },
      { upsert: true }
    );
  }
  console.log(`[seed] airports ensured: ${airports.map((a) => a.code).join(', ')}`);

  // Reference campus destinations.
  const destinations = [
    { name: 'Main Campus — Student Union', type: 'campus' },
    { name: 'North Campus Housing', type: 'campus' },
    { name: 'Downtown Transit Center', type: 'transit' },
  ];
  for (const d of destinations) {
    await Destination.updateOne(
      { name: d.name },
      { $set: { type: d.type, isActive: true }, $setOnInsert: { name: d.name } },
      { upsert: true }
    );
  }
  console.log(`[seed] destinations ensured: ${destinations.length}`);

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
