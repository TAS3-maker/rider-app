const mongoose = require('mongoose');
const env = require('./env');

async function connectDB() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.MONGO_URL, {
    dbName: env.MONGO_DB_NAME,
    serverSelectionTimeoutMS: 8000,
  });
  console.log(`[db] connected to ${env.MONGO_DB_NAME}`);
  return mongoose.connection;
}

module.exports = { connectDB, mongoose };
