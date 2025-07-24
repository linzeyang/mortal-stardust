import { connectDB, disconnectDB } from './mongodb';
import User from './models/User';
import bcryptjs from 'bcryptjs';

async function seedDatabase() {
  try {
    console.log('🌱 Seeding MongoDB database...');

    await connectDB();

    // Check if users already exist
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      console.log('📊 Database already contains users, skipping seed...');
      return;
    }

    // Create sample users
    const sampleUsers = [
      {
        email: 'student@example.com',
        passwordHash: 'password123',
        profile: {
          firstName: 'Zhang',
          lastName: 'Wei',
          role: 'student' as const
        },
        preferences: {
          language: 'zh-CN',
          notifications: true,
          dataSharing: false
        }
      },
      {
        email: 'newcomer@example.com',
        passwordHash: 'password123',
        profile: {
          firstName: 'Li',
          lastName: 'Ming',
          role: 'workplace_newcomer' as const
        },
        preferences: {
          language: 'zh-CN',
          notifications: true,
          dataSharing: true
        }
      },
      {
        email: 'entrepreneur@example.com',
        passwordHash: 'password123',
        profile: {
          firstName: 'Wang',
          lastName: 'Lei',
          role: 'entrepreneur' as const
        },
        preferences: {
          language: 'zh-CN',
          notifications: true,
          dataSharing: true
        }
      }
    ];

    // Insert sample users
    for (const userData of sampleUsers) {
      const user = new User(userData);
      await user.save();
      console.log(`✅ Created user: ${user.email}`);
    }

    console.log('🎉 Database seeding completed successfully!');

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

// Run seed if called directly
if (require.main === module) {
  seedDatabase();
}

export default seedDatabase;
