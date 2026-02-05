/**
 * View Controller – render trang EJS cho Car, Booking, User (Chương 1–9)
 * Dùng chung model/ logic với API, chỉ khác trả về HTML thay vì JSON.
 */
const Car = require('../models/cars');
const Booking = require('../models/booking');
const User = require('../models/user');
const { validateBooking } = require('../Helper files/Validate');

// ----- Trang chủ -----
exports.home = (req, res) => {
  const err = req.query.err === 'forbidden' ? 'Bạn không có quyền truy cập trang đó.' : null;
  res.render('index', { title: 'AutoRent Pro – Thuê xe', err });
};

// ----- Auth (Đăng nhập / Đăng ký web – session) -----
exports.showLogin = (req, res) => {
  if (req.session?.user) return res.redirect('/');
  res.render('auth/login', { title: 'Đăng nhập', error: null });
};

exports.showRegister = (req, res) => {
  if (req.session?.user) return res.redirect('/');
  res.render('auth/register', { title: 'Đăng ký', error: null });
};

exports.postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.render('auth/login', { title: 'Đăng nhập', error: 'Vui lòng nhập email và mật khẩu.' });
    }
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.render('auth/login', { title: 'Đăng nhập', error: 'Email hoặc mật khẩu không đúng.' });
    }
    const match = await user.comparePassword(password);
    if (!match) {
      return res.render('auth/login', { title: 'Đăng nhập', error: 'Email hoặc mật khẩu không đúng.' });
    }
    req.session.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };
    const redirectTo = req.query.redirect || '/';
    res.redirect(redirectTo);
  } catch (err) {
    res.render('auth/login', { title: 'Đăng nhập', error: err.message || 'Lỗi đăng nhập.' });
  }
};

exports.postRegister = async (req, res) => {
  try {
    const { name, email, phone, password, confirmPassword } = req.body;
    if (!name || !email || !phone || !password) {
      return res.render('auth/register', { title: 'Đăng ký', error: 'Vui lòng điền đủ: tên, email, SĐT, mật khẩu.' });
    }
    if (password.length < 6) {
      return res.render('auth/register', { title: 'Đăng ký', error: 'Mật khẩu tối thiểu 6 ký tự.' });
    }
    if (password !== confirmPassword) {
      return res.render('auth/register', { title: 'Đăng ký', error: 'Mật khẩu và xác nhận mật khẩu không khớp.' });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.render('auth/register', { title: 'Đăng ký', error: 'Email này đã được sử dụng.' });
    }
    const user = new User({ name, email, phone, password, role: 'customer' });
    await user.save();
    req.session.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };
    res.redirect('/');
  } catch (err) {
    res.render('auth/register', { title: 'Đăng ký', error: err.message || 'Lỗi đăng ký.' });
  }
};

exports.logout = (req, res) => {
  req.session.destroy(() => {});
  res.redirect('/');
};

// ----- Module Car -----
exports.carList = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status: status.toUpperCase() } : {};
    const cars = await Car.find(filter).populate('userId', 'name email');
    res.render('cars/list', { title: 'Danh sách xe', cars, currentStatus: status || '' });
  } catch (err) {
    res.status(500).render('error', { message: err.message });
  }
};

exports.carDetail = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id).populate('userId', 'name email phone');
    if (!car) return res.status(404).render('error', { message: 'Không tìm thấy xe' });
    res.render('cars/detail', { title: car.brand + ' ' + car.model, car });
  } catch (err) {
    res.status(500).render('error', { message: err.message });
  }
};

// ----- Module Booking / Rentals -----
exports.bookingList = async (req, res) => {
  try {
    const { userId } = req.query;
    const filter = userId ? { userId } : {};
    const bookings = await Booking.find(filter)
      .populate('carId')
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 });
    res.render('bookings/list', { title: 'Danh sách đặt xe', bookings: bookings, filterUserId: userId || '' });
  } catch (err) {
    res.status(500).render('error', { message: err.message });
  }
};

exports.bookingCreateForm = async (req, res) => {
  try {
    const cars = await Car.find({ status: 'AVAILABLE' });
    const users = await User.find({ role: 'customer' });
    res.render('bookings/create', { title: 'Đặt xe', cars, users });
  } catch (err) {
    res.status(500).render('error', { message: err.message });
  }
};

exports.bookingCreate = async (req, res) => {
  let { carId, userId, startDate, endDate } = req.body;
  // Nếu đã đăng nhập, bắt buộc đặt xe cho chính mình
  if (req.session?.user) userId = req.session.user.id;
  const cars = await Car.find({ status: 'AVAILABLE' });
  const users = await User.find({ role: 'customer' });
  const payload = { title: 'Đặt xe', cars, users };

  if (!carId || !userId || !startDate || !endDate) {
    return res.render('bookings/create', { ...payload, error: 'Vui lòng điền đủ: xe, khách hàng, ngày bắt đầu, ngày kết thúc.' });
  }

  const validation = validateBooking({ carId, startDate, endDate });
  if (!validation.valid) {
    return res.render('bookings/create', { ...payload, error: validation.message });
  }

  try {
    const booking = new Booking({ carId, userId, startDate, endDate });
    await booking.save();
    res.redirect('/bookings/' + booking._id);
  } catch (err) {
    res.status(400).render('bookings/create', { ...payload, error: err.message });
  }
};

exports.bookingDetail = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('userId', 'name email phone role')
      .populate('carId', 'carId brand model pricePerDay status userId');
    if (!booking) return res.status(404).render('error', { message: 'Không tìm thấy đặt xe' });
    const currentUserId = req.session && req.session.user ? req.session.user.id : null;
    const isAdmin = req.session && req.session.user && req.session.user.role === 'admin';
    const carOwnerId = booking.carId && booking.carId.userId ? booking.carId.userId.toString() : null;
    const canOwnerConfirm = req.session && req.session.user && req.session.user.role === 'owner' && currentUserId === carOwnerId;
    res.render('bookings/detail', {
      title: 'Chi tiết đặt xe',
      booking,
      canOwnerConfirm: !!canOwnerConfirm,
      isAdmin: !!isAdmin,
    });
  } catch (err) {
    res.status(500).render('error', { message: err.message });
  }
};

// ----- Module User (Customer) -----
exports.userProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).render('error', { message: 'Không tìm thấy user' });
    res.render('users/profile', { title: 'Thông tin khách hàng', user });
  } catch (err) {
    res.status(500).render('error', { message: err.message });
  }
};

exports.userBookings = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).render('error', { message: 'Không tìm thấy user' });
    const bookings = await Booking.find({ userId: req.params.id })
      .populate('carId', 'carId brand model pricePerDay status')
      .sort({ createdAt: -1 });
    res.render('users/bookings', { title: 'Lịch sử thuê xe', user, bookings });
  } catch (err) {
    res.status(500).render('error', { message: err.message });
  }
};

// ----- Owner: booking của xe thuộc owner -----
exports.ownerBookings = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.render('owner/bookings', { title: 'Booking xe của tôi', bookings: [], error: 'Không tìm thấy user.' });
    }
    const cars = await Car.find({ userId });
    const carIds = cars.map((c) => c._id);
    const bookings = await Booking.find({ carId: { $in: carIds } })
      .populate('carId', 'carId brand model pricePerDay')
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 });
    res.render('owner/bookings', {
      title: 'Booking xe của tôi',
      bookings,
      owner: user,
      error: null,
      ok: req.query.ok,
      err: req.query.err,
    });
  } catch (err) {
    res.status(500).render('error', { message: err.message });
  }
};

// Owner xác nhận đơn (chỉ đơn thuộc xe của owner)
exports.ownerConfirmBooking = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const booking = await Booking.findById(req.params.id).populate('carId');
    if (!booking) return res.redirect('/owner/bookings?err=notfound');
    const cars = await Car.find({ userId });
    const carIds = cars.map((c) => c._id.toString());
    const bookingCarId = booking.carId && booking.carId._id ? booking.carId._id.toString() : null;
    if (!bookingCarId || !carIds.includes(bookingCarId)) {
      return res.redirect('/owner/bookings?err=forbidden');
    }
    if (booking.bookingStatus !== 'pending') return res.redirect('/owner/bookings?err=already');
    booking.bookingStatus = 'confirmed';
    await booking.save();
    res.redirect('/owner/bookings?ok=confirmed');
  } catch (err) {
    res.status(500).render('error', { message: err.message });
  }
};

// Owner hủy đơn (chỉ đơn thuộc xe của owner)
exports.ownerCancelBooking = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const booking = await Booking.findById(req.params.id).populate('carId');
    if (!booking) return res.redirect('/owner/bookings?err=notfound');
    const cars = await Car.find({ userId });
    const carIds = cars.map((c) => c._id.toString());
    const bookingCarId = booking.carId && booking.carId._id ? booking.carId._id.toString() : null;
    if (!bookingCarId || !carIds.includes(bookingCarId)) {
      return res.redirect('/owner/bookings?err=forbidden');
    }
    if (booking.bookingStatus === 'cancelled') return res.redirect('/owner/bookings?err=already');
    booking.bookingStatus = 'cancelled';
    await booking.save();
    res.redirect('/owner/bookings?ok=cancelled');
  } catch (err) {
    res.status(500).render('error', { message: err.message });
  }
};

// ----- Admin: tổng hợp booking -----
exports.adminSummary = async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const bookingsByStatus = await Booking.aggregate([
      { $group: { _id: '$bookingStatus', count: { $sum: 1 } } },
    ]);
    const statusSummary = {};
    bookingsByStatus.forEach((item) => (statusSummary[item._id] = item.count));
    ['pending', 'confirmed', 'cancelled', 'completed'].forEach((s) => {
      if (!statusSummary[s]) statusSummary[s] = 0;
    });
    res.render('admin/summary', {
      title: 'Tổng hợp Booking (Admin)',
      totalBookings,
      bookingsByStatus: statusSummary,
    });
  } catch (err) {
    res.status(500).render('error', { message: err.message });
  }
};

// ----- Admin: danh sách đơn + xác nhận / hủy -----
exports.adminBookingList = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('carId', 'carId brand model pricePerDay status')
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 });
    res.render('admin/bookings', {
      title: 'Quản lý đơn đặt xe (Admin)',
      bookings,
      ok: req.query.ok,
      err: req.query.err,
    });
  } catch (err) {
    res.status(500).render('error', { message: err.message });
  }
};

exports.adminConfirmBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.redirect('/admin/bookings?err=notfound');
    if (booking.bookingStatus !== 'pending') {
      return res.redirect('/admin/bookings?err=already');
    }
    booking.bookingStatus = 'confirmed';
    await booking.save();
    res.redirect('/admin/bookings?ok=confirmed');
  } catch (err) {
    res.status(500).render('error', { message: err.message });
  }
};

exports.adminCancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.redirect('/admin/bookings?err=notfound');
    if (booking.bookingStatus === 'cancelled') {
      return res.redirect('/admin/bookings?err=already');
    }
    booking.bookingStatus = 'cancelled';
    await booking.save();
    res.redirect('/admin/bookings?ok=cancelled');
  } catch (err) {
    res.status(500).render('error', { message: err.message });
  }
};
