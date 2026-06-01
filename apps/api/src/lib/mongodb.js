import mongoose from 'mongoose';
import 'dotenv/config';

const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (!MONGODB_URI) {
    console.warn('⚠️ MONGODB_URI is not defined in your environment. Database features will be unavailable.');
    return null;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: true,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then(async (mongoose) => {
      console.log("🟢 MongoDB Atlas Connected Successfully");
      
      // Fix for duplicate index issues if they exist
      try {
        await mongoose.connection.db.admin();
        const collections = await mongoose.connection.db.listCollections({ name: 'users' }).toArray();
        if (collections.length > 0) {
          await mongoose.connection.db.collection('users').dropIndex('email_1').catch(() => {});
        }
      } catch (e) {
        // Ignore if index doesn't exist
      }
      
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error("🔴 MongoDB connection failed:", e.message);
    // We don't throw here so the server can still start
    return null;
  }

  return cached.conn;
}

export default connectDB;
