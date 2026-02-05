/**
 * Script gán tất cả xe cho một owner.
 * Chạy: node scripts/assignCarsToOwner.js
 * Cần có .env với MONGODB_CONNECTION_STRING hoặc MONGO_URI.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/cars');
const User = require('../models/user');

const mongoUri = process.env.MONGODB_CONNECTION_STRING || process.env.MONGO_URI;
if (!mongoUri) {
  console.error('Thiếu MONGODB_CONNECTION_STRING hoặc MONGO_URI trong .env');
  process.exit(1);
}

// Đổi email này thành email của owner bạn muốn gán xe
const OWNER_EMAIL = 'm3p@gmail.com'; // hoặc 'owner@gmail.com'

async function main() {
  await mongoose.connect(mongoUri);
  console.log('DB Connected!');

  const owner = await User.findOne({ email: OWNER_EMAIL });
  if (!owner) {
    console.error('Không tìm thấy owner với email:', OWNER_EMAIL);
    process.exit(1);
  }
  console.log('Owner:', owner.name, '| _id:', owner._id.toString());

  // Cập nhật tất cả xe chưa có userId hoặc gán lại cho owner này
  const result = await Car.updateMany({}, { userId: owner._id });
  console.log('Đã cập nhật', result.modifiedCount, 'xe thuộc về owner:', owner.email);

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
