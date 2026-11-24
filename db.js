const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongodInstance = null;

/**
 * Connect to MongoDB with automatic fallback to embedded in-memory MongoDB
 * if no external MongoDB service is actively running.
 */
const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI || 'mongodb://localhost:27017/campus_connect';

  try {
    // Attempt connecting to configured URI with short timeout
    console.log(`[Database] Attempting connection to ${primaryUri}...`);
    const conn = await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 2000,
    });

    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    await autoSeedIfEmpty();
    return conn;
  } catch (error) {
    console.warn(`[Database Notice] External MongoDB not available (${error.message}).`);
    console.log('[Database] Starting high-performance embedded MongoDB engine...');

    try {
      mongodInstance = await MongoMemoryServer.create({
        instance: {
          dbName: 'campus_connect',
        },
      });

      const memoryUri = mongodInstance.getUri();
      console.log(`[Database] Embedded MongoDB initialized at ${memoryUri}`);

      const conn = await mongoose.connect(memoryUri);
      console.log(`[Database] Connected to embedded MongoDB successfully.`);

      await autoSeedIfEmpty();
      return conn;
    } catch (memError) {
      console.error(`[Database Critical] Failed to start embedded MongoDB: ${memError.message}`);
    }
  }
};

/**
 * Automatically populates the database with initial admin, students, events,
 * notices, and study materials if the database is currently empty.
 */
const autoSeedIfEmpty = async () => {
  try {
    const User = require('../models/User');
    const userCount = await User.countDocuments();

    if (userCount === 0) {
      console.log('[Database] Database is empty. Auto-seeding initial campus data...');
      const { seedDatabase } = require('../utils/seeder');
      if (typeof seedDatabase === 'function') {
        await seedDatabase();
      }
    } else {
      console.log(`[Database] Existing records detected (${userCount} users).`);
    }
  } catch (err) {
    console.warn(`[Database Warning] Auto-seed check skipped: ${err.message}`);
  }
};

module.exports = connectDB;
