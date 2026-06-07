import { User } from '../models/User.js';
import connectDB from '../lib/mongodb.js';
import dotenv from 'dotenv';
dotenv.config();

const migrateRoles = async () => {
  try {
    await connectDB();
    console.log("🚀 Starting Role Migration...");

    const users = await User.find({ role: { $exists: false } }).lean();
    console.log(`🔍 Found ${users.length} users needing migration.`);

    let count = 0;
    for (const user of users) {
      let newRole = 'Developer';
      const legacyRoles = user.roles || [];
      
      if (legacyRoles.includes('PROJECT_OWNER') || legacyRoles.includes('Project Owner')) {
        newRole = 'Project Owner';
      } else if (legacyRoles.includes('ADMIN') || legacyRoles.includes('Admin')) {
        newRole = 'Admin';
      } else if (legacyRoles.includes('TEAM') || legacyRoles.includes('Team')) {
        newRole = 'Team';
      }

      await User.findByIdAndUpdate(user._id, { $set: { role: newRole } });
      count++;
    }

    console.log(`✅ Successfully migrated ${count} users.`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration Failed:", error.message);
    process.exit(1);
  }
};

migrateRoles();
