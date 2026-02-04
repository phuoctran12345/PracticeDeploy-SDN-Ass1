const mongoose = require('mongoose');
require('dotenv').config();

// Kết nối database
const mongoUri = process.env.MONGODB_CONNECTION_STRING || process.env.MONGO_URI;
mongoose.connect(mongoUri)
  .then(() => console.log('✅ DB Connected!'))
  .catch(err => console.log('❌ DB Error: ', err));

// Import models
const User = require('./models/user');
const Car = require('./models/cars');
const Booking = require('./models/booking');

async function testQuery() {
  try {
    const userId = '696df719cef16cc4d1493bf3';
    
    console.log('🔍 Testing query với userId:', userId);
    console.log('');

    // 1. Kiểm tra User
    console.log('1️⃣  Kiểm tra User...');
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const user = await User.findById(userObjectId);
    console.log('   User found:', user ? '✅' : '❌');
    if (user) {
      console.log('   Name:', user.name);
      console.log('   Role:', user.role);
      console.log('   _id:', user._id.toString());
    }
    console.log('');

    // 2. Tìm Car với ObjectId
    console.log('2️⃣  Tìm Car với ObjectId...');
    const carsByObjectId = await Car.find({ userId: userObjectId });
    console.log('   Cars found:', carsByObjectId.length);
    carsByObjectId.forEach((car, i) => {
      console.log(`   ${i + 1}. ${car.carId} - userId type: ${typeof car.userId}, value: ${car.userId?.toString()}`);
    });
    console.log('');

    // 3. Tìm Car với string
    console.log('3️⃣  Tìm Car với string...');
    const carsByString = await Car.find({ userId: userId });
    console.log('   Cars found:', carsByString.length);
    carsByString.forEach((car, i) => {
      console.log(`   ${i + 1}. ${car.carId} - userId type: ${typeof car.userId}, value: ${car.userId?.toString()}`);
    });
    console.log('');

    // 4. Tìm tất cả cars và kiểm tra
    console.log('4️⃣  Tất cả cars trong DB:');
    const allCars = await Car.find({});
    allCars.forEach((car, i) => {
      const userIdStr = car.userId?.toString() || 'NULL';
      const match = userIdStr === userId || userIdStr === userObjectId.toString();
      console.log(`   ${i + 1}. ${car.carId}`);
      console.log(`      _id: ${car._id.toString()}`);
      console.log(`      userId: ${userIdStr} (type: ${typeof car.userId})`);
      console.log(`      Match? ${match ? '✅' : '❌'}`);
      console.log('');
    });

    // 5. Test query với $or
    console.log('5️⃣  Test query với $or (như trong code)...');
    const carsWithOr = await Car.find({ 
      $or: [
        { userId: userObjectId },
        { userId: userId }
      ]
    });
    console.log('   Cars found:', carsWithOr.length);
    console.log('');

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Lỗi:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

testQuery();
