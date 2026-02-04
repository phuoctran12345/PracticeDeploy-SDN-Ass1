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
  res.render('index', { title: 'AutoRent Pro – Thuê xe' });
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
  const { carId, userId, startDate, endDate } = req.body;
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
      .populate('carId', 'carId brand model pricePerDay status');
    if (!booking) return res.status(404).render('error', { message: 'Không tìm thấy đặt xe' });
    res.render('bookings/detail', { title: 'Chi tiết đặt xe', booking });
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
    const userId = req.query.userId;
    if (!userId) {
      return res.render('owner/bookings', { title: 'Booking của Owner', bookings: [], error: 'Thiếu userId (query: ?userId=...)' });
    }
    const user = await User.findById(userId);
    if (!user || user.role !== 'owner') {
      return res.render('owner/bookings', { title: 'Booking của Owner', bookings: [], error: 'User không tồn tại hoặc không phải owner.' });
    }
    const cars = await Car.find({ userId });
    const carIds = cars.map((c) => c._id);
    const bookings = await Booking.find({ carId: { $in: carIds } })
      .populate('carId', 'carId brand model pricePerDay')
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 });
    res.render('owner/bookings', { title: 'Booking của Owner', bookings, owner: user, error: null });
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
