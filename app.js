const path = require('path');
const express = require('express');
const session = require('express-session');
const app = express();

// Kết nối MongoDB (Mongoose)
require('./db');

// Import các models để đảm bảo chúng được đăng ký với Mongoose trước khi sử dụng
require('./models/user');
require('./models/cars');
require('./models/booking');

// ----- View EJS (Chương 1–9: UI) -----
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'data/assets'))); // Serve video assets
app.use(express.urlencoded({ extended: true }));

// Session cho đăng nhập web (User / Admin)
app.use(session({
  secret: process.env.SESSION_SECRET || 'autorent-pro-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true }, // 7 ngày
}));

// Gắn user vào mọi view (res.locals.user)
app.use((req, res, next) => {
  res.locals.user = req.session?.user || null;
  next();
});

// API Routes (JSON)
const carRoutes = require('./routes/cars');
const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/bookings');
const userRoutes = require('./routes/users');
app.use(express.json());
app.use('/api/v1/cars', carRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/users', userRoutes);

// View Routes (HTML – EJS)
const viewRoutes = require('./routes/views');
app.use('/', viewRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Express server is running on port ${PORT}`);
});