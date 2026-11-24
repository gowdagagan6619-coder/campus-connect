const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide an announcement title'],
      trim: true,
      maxlength: [150, 'Announcement title cannot exceed 150 characters'],
    },
    content: {
      type: String,
      required: [true, 'Please provide the announcement message content'],
    },
    priority: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high', 'urgent'],
        message: '{VALUE} is not a valid priority level',
      },
      default: 'medium',
      index: true,
    },
    category: {
      type: String,
      enum: {
        values: ['General', 'Academic', 'Exam', 'Event', 'Placement', 'Urgent'],
        message: '{VALUE} is not a valid category',
      },
      default: 'General',
      index: true,
    },
    targetAudience: {
      type: String,
      enum: ['all', 'students', 'admins'],
      default: 'all',
    },
    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },
    attachment: {
      type: String,
      default: '', // Optional file attachment
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Announcement author is required'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Query optimization: pinned items first, then most recent
announcementSchema.index({ isPinned: -1, createdAt: -1 });
announcementSchema.index({ priority: 1, createdAt: -1 });

const Announcement = mongoose.model('Announcement', announcementSchema);

module.exports = Announcement;
