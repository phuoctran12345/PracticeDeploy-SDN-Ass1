const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema(
  {
    bookingId: {
      ref: 'Booking',
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    contractNumber: {
      type: String,
      required: true,
      unique: true,
    },

    status: {
      type: String,
      enum: ['draft', 'signed', 'expired'],
      default: 'draft',
    },

    signedDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Contract', contractSchema);