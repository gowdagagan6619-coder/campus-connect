const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide an event title'],
      trim: true,
      maxlength: [120, 'Event title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide an event description'],
    },
    category: {
      type: String,
      required: [true, 'Please select an event category'],
      enum: {
        values: [
          'Technical',
          'Cultural',
          'Sports',
          'Academic',
          'Workshop',
          'Seminar',
          'Other',
        ],
        message: '{VALUE} is not a valid category',
      },
      default: 'Technical',
      index: true,
    },
    venue: {
      type: String,
      required: [true, 'Please provide the event venue or location'],
      trim: true,
    },
    eventDate: {
      type: Date,
      required: [true, 'Please provide the event date'],
      index: true,
    },
    eventTime: {
      type: String,
      required: [true, 'Please provide the event time (e.g. 10:00 AM)'],
      trim: true,
    },
    bannerImage: {
      type: String,
      default: '', // Relative URL e.g. /uploads/banners/event-123.jpg
    },
    capacity: {
      type: Number,
      required: [true, 'Please specify maximum attendee capacity'],
      min: [1, 'Event capacity must be at least 1'],
    },
    registeredCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: {
        values: ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'],
        message: '{VALUE} is not a valid event status',
      },
      default: 'Upcoming',
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Event creator ID is required'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: Check if event is completely full
eventSchema.virtual('isFull').get(function () {
  return this.registeredCount >= this.capacity;
});

// Virtual: Calculate spots remaining
eventSchema.virtual('spotsLeft').get(function () {
  return Math.max(0, this.capacity - this.registeredCount);
});

// Compound index for querying active upcoming events by category & date
eventSchema.index({ status: 1, eventDate: 1 });
eventSchema.index({ category: 1, status: 1 });

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
