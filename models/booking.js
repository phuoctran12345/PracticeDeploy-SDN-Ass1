const mongoose = require('mongoose');
const { calculateRentalCost } = require('../Helper files/Validate');

const bookingSchema = new mongoose.Schema({
  carId: {
    ref: "Car",
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },

  userId: {
    ref: "User",
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },

  startDate: {
    type: Date, 
    required: true,
  },

  endDate: {
    type: Date, 
    required: true,
    validate: {
      validator: function (value) {
        return value > this.startDate; 
      },
      message: 'endDate phải sau startDate',
    },
  },

  totalPrice: {
    type: Number,
  },


  paymentStatus: { 
    type: String, 
    enum: ['unpaid' , 'paid' , 'refunded'],
    default: 'unpaid',
  },

  bookingStatus: {
    type: String, 
    enum: ['pending' , 'confirmed', 'cancelled', 'completed'],
    default: 'pending',
  },

}, { timestamps: true });

// Tự động tính tiền khi tạo booking hoặc thay đổi ngày 
bookingSchema.pre('save' , async function(next) {

  // Chỉ tính khi tạo mới hoặc khi startDate/endDate thay đổi
  if (this.isNew || this.isModified('startDate') ||  this.isModified('endDate')) {
    try {

      // Lấy thông tin xe từ Car model
      const Car = mongoose.model('Car');
      const car = await Car.findById(this.carId);


      if (car && car.pricePerDay) {
          // Gọi hàm tính tiền từ Chapter 2
          this.totalPrice = calculateRentalCost(
            this.startDate,
            this.endDate,
            car.pricePerDay
          )
      };
    } catch (error ) {
      return next(error);
    }
  }

  next();
});

module.exports = mongoose.model('Booking', bookingSchema);


