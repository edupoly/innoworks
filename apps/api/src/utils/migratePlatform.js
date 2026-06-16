import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Project } from '../models/Project.js';
import { Issue } from '../models/Issue.js';
import { Submission } from '../models/Submission.js';
import { WikiPage } from '../models/WikiPage.js';
import { User } from '../models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/innoworks';

async function migrate() {
  try {
    console.log('🚀 Connecting to MongoDB for migration...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Initialize Verification fields
    console.log('📦 Migrating Projects...');
    await Project.updateMany(
      { isVerified: { $exists: false } },
      { $set: { isVerified: false } }
    );

    console.log('📦 Migrating Issues...');
    await Issue.updateMany(
      { isVerified: { $exists: false } },
      { $set: { isVerified: false } }
    );

    console.log('📦 Migrating Submissions...');
    await Submission.updateMany(
      { isVerified: { $exists: false } },
      { $set: { isVerified: false } }
    );

    console.log('📦 Migrating WikiPages...');
    await WikiPage.updateMany(
      { isVerified: { $exists: false } },
      { $set: { isVerified: false } }
    );

    // 2. Initialize User fields
    console.log('👤 Migrating Users...');
    await User.updateMany(
      { currentStreak: { $exists: false } },
      { 
        $set: { 
          currentStreak: 0,
          longestStreak: 0,
          monthlyConsistency: 0,
          graceDaysUsed: 0,
          overallRating: 0,
          categoryRatings: {
            codeQuality: 0,
            refactoring: 0,
            performance: 0,
            collaboration: 0
          }
        } 
      }
    );

    console.log('✅ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

migrate();
