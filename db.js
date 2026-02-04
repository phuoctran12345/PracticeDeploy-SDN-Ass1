const mongoose = require('mongoose');
require('dotenv').config();

// Trạng thái kết nối: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
function isConnected() {
  return mongoose.connection.readyState === 1;
}

const mongoUri = process.env.MONGODB_CONNECTION_STRING || process.env.MONGO_URI;
mongoose
  .connect(mongoUri)
  .then(() => {
    const { host, port, name } = mongoose.connection;
    console.log('DB Connected!');
    console.log('MongoDB:', host + ':' + port + (name ? ' / ' + name : ''), '| readyState:', mongoose.connection.readyState, '(1 = connected)');
  })
  .catch((err) => {
    console.log('DB connection FAILED:', err.message);
  });

module.exports = mongoose;
module.exports.isConnected = isConnected;