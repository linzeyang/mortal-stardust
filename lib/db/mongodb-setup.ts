import { connectDB, disconnectDB } from './mongodb';
import User from './models/User';
import Experience from './models/Experience';
import Solution from './models/Solution';

async function setupDatabase() {
  try {
    console.log('🚀 Setting up MongoDB database...');

    // Connect to MongoDB
    await connectDB();

    // Create indexes if they don't exist
    console.log('📊 Creating indexes...');

    await User.createIndexes();
    console.log('✅ User indexes created');

    await Experience.createIndexes();
    console.log('✅ Experience indexes created');

    await Solution.createIndexes();
    console.log('✅ Solution indexes created');

    console.log('🎉 Database setup completed successfully!');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

// Run setup if called directly
if (require.main === module) {
  setupDatabase();
}

export default setupDatabase;
