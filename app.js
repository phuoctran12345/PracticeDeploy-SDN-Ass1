const path = require('path');
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo').default;
const app = express();

// Kết nối MongoDB (Mongoose)
require('./db');

// Phía sau proxy (Railway, Render,…) để session/cookie hoạt động đúng
app.set('trust proxy', 1);

// Import các models để đảm bảo chúng được đăng ký với Mongoose trước khi sử dụng
require('./models/user');
require('./models/cars');
require('./models/booking');

const User = require('./models/user');

// ----- View EJS (Chương 1–9: UI) -----
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'data/assets'))); // Serve video assets
app.use(express.urlencoded({ extended: true }));

// Session cho đăng nhập web – lưu vào MongoDB để tránh nhảy role khi reload (nhiều instance Railway)
const sessionStore = process.env.MONGODB_CONNECTION_STRING
  ? MongoStore.create({ mongoUrl: process.env.MONGODB_CONNECTION_STRING })
  : undefined;
if (sessionStore) {
  console.log('Session store: MongoDB (ổn định role khi reload)');
} else {
  console.warn('WARNING: Session đang dùng MemoryStore (không phù hợp production). Trên Railway hãy set MONGODB_CONNECTION_STRING để lưu session vào MongoDB.');
}
app.use(session({
  secret: process.env.SESSION_SECRET || 'autorent-pro-session-secret',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax',
    // Chỉ bật Secure khi dùng HTTPS. Nếu deploy HTTP (hoặc local production) đăng nhập không được → set COOKIE_SECURE=false
    secure: process.env.COOKIE_SECURE !== 'false' && process.env.NODE_ENV === 'production',
  },
}));

// Đồng bộ role từ DB mỗi request – chỉ cập nhật từ user cùng id, không ghi đè sang user khác
app.use(async (req, res, next) => {
  if (req.session && req.session.user && req.session.user.id) {
    const sessionId = req.session.user.id;
    try {
      const fresh = await User.findById(sessionId).select('name email role').lean();
      if (fresh && String(fresh._id) === String(sessionId)) {
        req.session.user = {
          id: fresh._id.toString(),
          name: fresh.name,
          email: fresh.email,
          role: fresh.role,
        };
      } else if (!fresh) {
        req.session.user = null;
      }
    } catch (e) {
      req.session.user = null;
    }
  }
  next();
});

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