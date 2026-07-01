const app = require('./app');
const db = require('./config/db');

const PORT = process.env.PORT || 5000;

// Test database connection
async function testConnection() {
  try {
    const [rows] = await db.query('SELECT 1');
    console.log('✅ MySQL connected successfully!');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ MySQL connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
