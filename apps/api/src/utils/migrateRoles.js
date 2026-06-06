import { User } from '../models/User.js';
import connectDB from '../lib/mongodb.js';
import dotenv from 'dotenv';
dotenv.config();

const migrateRoles = async () => {
  try {
    await connectDB();
    console.log("🚀 Starting Role Migration...");

    const users = await User.find({ role: { $exists: false } });
    console.log(`🔍 Found ${users.length} users needing migration.`);

    let count = 0;
    for (const user of users) {
      let newRole = 'Developer';
      
      if (user.roles.includes('PROJECT_OWNER')) {
        newRole = 'Project Owner';
      } else if (user.roles.includes('ADMIN')) {
        newRole = 'Admin';
      } else if (user.roles.includes('TEAM')) {
        newRole = 'Team';
      }

      user.role = newRole;
      await user.save();
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
