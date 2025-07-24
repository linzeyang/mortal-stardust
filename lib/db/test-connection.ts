import { connectDB, disconnectDB } from './mongodb';

async function testConnection() {
  try {
    console.log('🔌 Testing MongoDB connection...');
    
    const mongoose = await connectDB();
    
    // Test the connection
    const dbState = mongoose.connection.readyState;
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    
    console.log(`📊 Connection state: ${states[dbState]}`);
    console.log(`🗄️  Database name: ${mongoose.connection.name}`);
    console.log(`🌐 Host: ${mongoose.connection.host}`);
    console.log(`🔌 Port: ${mongoose.connection.port}`);
    
    if (dbState === 1) {
      console.log('✅ MongoDB connection successful!');
      
      // List collections
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log('📚 Available collections:', collections.map(c => c.name));
      
    } else {
      console.log('❌ MongoDB connection failed!');
    }
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

// Run test if called directly
if (require.main === module) {
  testConnection();
}

export default testConnection;