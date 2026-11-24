const mongoose = require('mongoose');

const eventRegistrationSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event reference is required for registration'],
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required for registration'],
      index: true,
    },
    registrationDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: {
        values: ['confirmed', 'cancelled', 'attended'],
        message: '{VALUE} is not a valid registration status',
      },
      default: 'confirmed',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// CRITICAL INTEGRITY CONSTRAINT:
// Compound unique index prevents race condition duplicate registrations
eventRegistrationSchema.index({ event: 1, student: 1 }, { unique: true });

// Compound index for user history queries
eventRegistrationSchema.index({ student: 1, status: 1, createdAt: -1 });

const EventRegistration = mongoose.model('EventRegistration', eventRegistrationSchema);

module.exports = EventRegistration;
