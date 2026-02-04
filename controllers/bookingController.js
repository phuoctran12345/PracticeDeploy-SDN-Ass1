const Booking = require('../models/booking');
const User = require('../models/user');
const Car = require('../models/cars');
const { validateBooking } = require('../Helper files/Validate');

// Chỉ user đã login; Customer chỉ xem booking của mình, Admin xem tất cả
exports.getBookings = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'customer') {
      filter.userId = req.user.id;
    } else if (req.user.role === 'admin' && req.query.userId) {
      filter.userId = req.query.userId;
    }

    const bookings = await Booking.find(filter).populate('carId').populate('userId');
    return res.json({ message: 'Danh sách booking', data: bookings });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Chỉ user đã login mới tạo booking; userId = req.user.id
exports.createBooking = async (req, res) => {
  try {
    const { carId, startDate, endDate } = req.body;
    const validation = validateBooking({ carId, startDate, endDate });
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }
    const booking = new Booking({
      carId,
      startDate,
      endDate,
      userId: req.user.id,
    });
    await booking.save();
    const populated = await Booking.findById(booking._id).populate('carId').populate('userId');
    return res.status(201).json({ message: 'Booking thành công!', data: populated });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};


//==============================================================================
// Slot5-chapter9:
// Chỉ user đã login; Customer chỉ xem booking của mình, Owner xem booking của xe mình, Admin xem tất cả
exports.getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id)
      .populate('userId', 'name email phone role status')
      .populate('carId');
    if (!booking) {
      return res.status(404).json({ message: 'Không tìm thấy booking' });
    }
    const bookingUserId = booking.userId && (booking.userId._id || booking.userId).toString();
    const carOwnerId = booking.carId && booking.carId.userId && (booking.carId.userId._id || booking.carId.userId).toString();
    if (req.user.role === 'customer' && bookingUserId !== req.user.id) {
      return res.status(403).json({ message: 'Bạn chỉ được xem booking của mình' });
    }
    if (req.user.role === 'owner' && carOwnerId !== req.user.id) {
      return res.status(403).json({ message: 'Bạn chỉ được xem booking của xe mình' });
    }
    return res.json({ message: 'Chi tiết booking', data: booking });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Hủy booking: chỉ chủ booking hoặc admin
exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id).populate('carId');
    if (!booking) {
      return res.status(404).json({ message: 'Không tìm thấy booking' });
    }
    const bookingUserId = (booking.userId && (booking.userId._id || booking.userId).toString()) || booking.userId?.toString();
    if (req.user.role !== 'admin' && bookingUserId !== req.user.id) {
      return res.status(403).json({ message: 'Chỉ chủ booking hoặc admin mới được hủy' });
    }
    if (booking.bookingStatus === 'cancelled') {
      return res.status(400).json({ message: 'Booking đã bị hủy trước đó' });
    }
    booking.bookingStatus = 'cancelled';
    await booking.save();
    return res.json({ message: 'Đã hủy booking', data: booking });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Chỉ user đã login; Customer chỉ xem lịch sử của mình (id = req.user.id), Admin/Owner có thể xem user khác
exports.getUserBookings = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.role === 'customer' && id !== req.user.id) {
      return res.status(403).json({ message: 'Bạn chỉ được xem lịch sử của mình' });
    }
    const bookings = await Booking.find({ userId: id })
      .populate('carId', 'carId brand model pricePerDay status')
      .sort({ createdAt: -1 });
    return res.json({ message: 'Lịch sử thuê xe của user', data: bookings });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Owner: quản lý xe của mình – dùng req.user.id (đã authorize('owner'))
exports.getOwnerBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const cars = await Car.find({ userId });
    const carIds = cars.map(c => c._id);
    if (carIds.length === 0) {
      return res.json({ message: 'Danh sách booking của owner', data: [] });
    }
    const bookings = await Booking.find({ carId: { $in: carIds } })
      .populate('carId', 'carId brand model pricePerDay status userId')
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 });
    return res.json({ message: 'Danh sách booking của owner', data: bookings });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Bài 4: API cho admin - GET /admin/bookings/summary
exports.getAdminBookingsSummary = async (req, res) => {
  try {
    // Tổng số booking
    const totalBookings = await Booking.countDocuments();
    
    // Booking theo trạng thái (bookingStatus)
    const bookingsByStatus = await Booking.aggregate([
      {
        $group: {
          _id: '$bookingStatus',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Chuyển đổi kết quả thành object dễ đọc
    const statusSummary = {};
    bookingsByStatus.forEach(item => {
      statusSummary[item._id] = item.count;
    });
    
    // Đảm bảo tất cả trạng thái đều có (kể cả khi count = 0)
    const allStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    allStatuses.forEach(status => {
      if (!statusSummary[status]) {
        statusSummary[status] = 0;
      }
    });
    
    return res.json({
      message: 'Tổng hợp booking cho admin',
      data: {
        totalBookings,
        bookingsByStatus: statusSummary
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

