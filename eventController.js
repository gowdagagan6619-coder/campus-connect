const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const fs = require('fs');
const path = require('path');

/**
 * @desc    Get all events with search, filtering, and registration flags
 * @route   GET /api/events
 * @access  Public (Optional auth for isRegistered flag)
 */
const getEvents = async (req, res, next) => {
  try {
    const { search, category, status } = req.query;
    const query = {};

    // Search by title, venue, or description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { venue: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by category
    if (category && category !== 'All') {
      query.category = category;
    }

    // Filter by status
    if (status && status !== 'All') {
      query.status = status;
    }

    const events = await Event.find(query)
      .populate('createdBy', 'name email')
      .sort({ eventDate: 1, createdAt: -1 });

    // If student is logged in, attach isRegistered flag to each event
    let eventsWithRegistration = events.map((e) => e.toObject());
    if (req.user && req.user.role === 'student') {
      const userRegistrations = await EventRegistration.find({
        student: req.user._id,
        status: 'confirmed',
      }).select('event');

      const registeredEventIds = new Set(
        userRegistrations.map((r) => r.event.toString())
      );

      eventsWithRegistration = eventsWithRegistration.map((ev) => ({
        ...ev,
        isRegistered: registeredEventIds.has(ev._id.toString()),
      }));
    }

    return res.status(200).json({
      success: true,
      count: eventsWithRegistration.length,
      events: eventsWithRegistration,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single event by ID
 * @route   GET /api/events/:id
 * @access  Public
 */
const getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate('createdBy', 'name email');
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.',
      });
    }

    let isRegistered = false;
    if (req.user && req.user.role === 'student') {
      const reg = await EventRegistration.findOne({
        event: event._id,
        student: req.user._id,
        status: 'confirmed',
      });
      if (reg) isRegistered = true;
    }

    return res.status(200).json({
      success: true,
      event: {
        ...event.toObject(),
        isRegistered,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new event with optional banner upload
 * @route   POST /api/events
 * @access  Private/Admin
 */
const createEvent = async (req, res, next) => {
  try {
    const { title, description, category, venue, eventDate, eventTime, capacity } = req.body;

    if (!title || !description || !venue || !eventDate || !eventTime || !capacity) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required event fields (title, description, venue, date, time, capacity).',
      });
    }

    let bannerImage = '';
    if (req.file) {
      bannerImage = `/uploads/banners/${req.file.filename}`;
    }

    const event = await Event.create({
      title,
      description,
      category: category || 'Technical',
      venue,
      eventDate: new Date(eventDate),
      eventTime,
      capacity: Number(capacity),
      bannerImage,
      createdBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: 'Event created successfully.',
      event,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an existing event
 * @route   PUT /api/events/:id
 * @access  Private/Admin
 */
const updateEvent = async (req, res, next) => {
  try {
    let event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.',
      });
    }

    const { title, description, category, venue, eventDate, eventTime, capacity, status } = req.body;

    if (title) event.title = title;
    if (description) event.description = description;
    if (category) event.category = category;
    if (venue) event.venue = venue;
    if (eventDate) event.eventDate = new Date(eventDate);
    if (eventTime) event.eventTime = eventTime;
    if (status) event.status = status;
    if (capacity) {
      const newCapacity = Number(capacity);
      if (newCapacity < event.registeredCount) {
        return res.status(400).json({
          success: false,
          message: `Cannot reduce capacity below currently registered student count (${event.registeredCount}).`,
        });
      }
      event.capacity = newCapacity;
    }

    if (req.file) {
      event.bannerImage = `/uploads/banners/${req.file.filename}`;
    }

    await event.save();

    return res.status(200).json({
      success: true,
      message: 'Event updated successfully.',
      event,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete event and its registration history
 * @route   DELETE /api/events/:id
 * @access  Private/Admin
 */
const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.',
      });
    }

    // Cascade delete all registrations for this event
    await EventRegistration.deleteMany({ event: event._id });

    // Clean up banner file if stored locally
    if (event.bannerImage && event.bannerImage.startsWith('/uploads/')) {
      const fullPath = path.join(__dirname, '..', event.bannerImage);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    await Event.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Event and associated registrations deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Register authenticated student for an event
 * @route   POST /api/events/:id/register
 * @access  Private/Student
 */
const registerForEvent = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const studentId = req.user._id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.',
      });
    }

    if (event.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot register for a cancelled event.',
      });
    }

    if (event.status === 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot register for a past event.',
      });
    }

    // Check if duplicate registration exists
    const existingRegistration = await EventRegistration.findOne({
      event: eventId,
      student: studentId,
    });

    if (existingRegistration) {
      if (existingRegistration.status === 'confirmed') {
        return res.status(400).json({
          success: false,
          message: 'You are already registered for this event.',
        });
      } else {
        // Reactivate previously cancelled registration if capacity allows
        if (event.registeredCount >= event.capacity) {
          return res.status(400).json({
            success: false,
            message: 'Event has reached full capacity. No seats available.',
          });
        }
        existingRegistration.status = 'confirmed';
        existingRegistration.registrationDate = new Date();
        await existingRegistration.save();

        await Event.findByIdAndUpdate(eventId, { $inc: { registeredCount: 1 } });

        return res.status(200).json({
          success: true,
          message: 'Registration confirmed successfully.',
          registration: existingRegistration,
        });
      }
    }

    // Check capacity constraint
    if (event.registeredCount >= event.capacity) {
      return res.status(400).json({
        success: false,
        message: 'Event has reached full capacity. Registration is closed.',
      });
    }

    // Atomic create registration and increment counter
    const registration = await EventRegistration.create({
      event: eventId,
      student: studentId,
      status: 'confirmed',
    });

    await Event.findByIdAndUpdate(eventId, { $inc: { registeredCount: 1 } });

    return res.status(201).json({
      success: true,
      message: 'Successfully registered for event.',
      registration,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel event registration
 * @route   POST /api/events/:id/cancel
 * @access  Private/Student
 */
const cancelRegistration = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const studentId = req.user._id;

    const registration = await EventRegistration.findOne({
      event: eventId,
      student: studentId,
      status: 'confirmed',
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'No active registration found for this event.',
      });
    }

    // Remove registration record
    await EventRegistration.findByIdAndDelete(registration._id);

    // Decrement registeredCount safely (cannot fall below 0)
    await Event.findByIdAndUpdate(eventId, {
      $inc: { registeredCount: -1 },
    });

    return res.status(200).json({
      success: true,
      message: 'Event registration successfully cancelled.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all events registered by the authenticated student
 * @route   GET /api/events/my-registrations
 * @access  Private/Student
 */
const getMyRegistrations = async (req, res, next) => {
  try {
    const registrations = await EventRegistration.find({
      student: req.user._id,
      status: 'confirmed',
    })
      .populate({
        path: 'event',
        populate: { path: 'createdBy', select: 'name email' },
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: registrations.length,
      registrations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get registered student attendees list for a specific event
 * @route   GET /api/events/:id/attendees
 * @access  Private/Admin
 */
const getEventAttendees = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.',
      });
    }

    const registrations = await EventRegistration.find({
      event: req.params.id,
      status: 'confirmed',
    })
      .populate('student', 'name email studentId department semester phone avatar')
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      eventTitle: event.title,
      capacity: event.capacity,
      registeredCount: registrations.length,
      attendees: registrations.map((r) => ({
        registrationId: r._id,
        registeredAt: r.registrationDate,
        student: r.student,
      })),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  cancelRegistration,
  getMyRegistrations,
  getEventAttendees,
};
