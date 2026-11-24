const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getRecentActivity,
  getAllStudents,
  deleteStudent,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All admin routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/recent-activity', getRecentActivity);
router.get('/students', getAllStudents);
router.delete('/students/:id', deleteStudent);

module.exports = router;
