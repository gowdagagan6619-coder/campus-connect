const express = require('express');
const router = express.Router();
const {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  cancelRegistration,
  getMyRegistrations,
  getEventAttendees,
} = require('../controllers/eventController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { uploadBanner } = require('../middleware/uploadMiddleware');

// Student specific routes (placed before :id to prevent param collision)
router.get('/my-registrations', protect, authorize('student'), getMyRegistrations);

// Public / Authenticated read routes
router.get('/', optionalAuth, getEvents);
router.get('/:id', optionalAuth, getEventById);

// Admin-only event management routes
router.post('/', protect, authorize('admin'), uploadBanner.single('banner'), createEvent);
router.put('/:id', protect, authorize('admin'), uploadBanner.single('banner'), updateEvent);
router.delete('/:id', protect, authorize('admin'), deleteEvent);
router.get('/:id/attendees', protect, authorize('admin'), getEventAttendees);

// Student registration action routes
router.post('/:id/register', protect, authorize('student'), registerForEvent);
router.post('/:id/cancel', protect, authorize('student'), cancelRegistration);

module.exports = router;
