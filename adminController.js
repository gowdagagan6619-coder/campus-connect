const User = require('../models/User');
const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const Announcement = require('../models/Announcement');
const StudyMaterial = require('../models/StudyMaterial');

/**
 * @desc    Get aggregated administration analytics and dashboard metrics
 * @route   GET /api/admin/stats
 * @access  Private/Admin
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalStudents,
      totalEvents,
      totalRegistrations,
      totalAnnouncements,
      totalMaterials,
      categoryStats,
      recentRegistrations,
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      Event.countDocuments(),
      EventRegistration.countDocuments({ status: 'confirmed' }),
      Announcement.countDocuments(),
      StudyMaterial.countDocuments(),
      Event.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      EventRegistration.find({ status: 'confirmed' })
        .populate('student', 'name email studentId department')
        .populate('event', 'title eventDate venue category')
        .sort({ createdAt: -1 })
        .limit(6),
    ]);

    // Format category distribution
    const categoryDistribution = categoryStats.map((item) => ({
      category: item._id,
      count: item.count,
    }));

    return res.status(200).json({
      success: true,
      stats: {
        totalStudents,
        totalEvents,
        totalRegistrations,
        totalAnnouncements,
        totalMaterials,
        categoryDistribution,
        recentRegistrations,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get recent campus activity feed
 * @route   GET /api/admin/recent-activity
 * @access  Private/Admin
 */
const getRecentActivity = async (req, res, next) => {
  try {
    const [latestStudents, latestEvents, latestAnnouncements] = await Promise.all([
      User.find({ role: 'student' })
        .select('name email studentId department createdAt')
        .sort({ createdAt: -1 })
        .limit(5),
      Event.find()
        .select('title category eventDate registeredCount capacity status createdAt')
        .sort({ createdAt: -1 })
        .limit(5),
      Announcement.find()
        .select('title priority category isPinned createdAt')
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    return res.status(200).json({
      success: true,
      activity: {
        latestStudents,
        latestEvents,
        latestAnnouncements,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all students directory with search and pagination
 * @route   GET /api/admin/students
 * @access  Private/Admin
 */
const getAllStudents = async (req, res, next) => {
  try {
    const { search, department, semester } = req.query;
    const query = { role: 'student' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
      ];
    }

    if (department && department !== 'All') {
      query.department = department;
    }

    if (semester && semester !== 'All') {
      query.semester = Number(semester);
    }

    const students = await User.find(query)
      .select('name email studentId department semester phone avatar createdAt')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: students.length,
      students,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete student account and clean up their event registrations
 * @route   DELETE /api/admin/students/:id
 * @access  Private/Admin
 */
const deleteStudent = async (req, res, next) => {
  try {
    const student = await User.findOne({ _id: req.params.id, role: 'student' });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student account not found.',
      });
    }

    // Find all confirmed registrations by this student to adjust event count
    const registrations = await EventRegistration.find({
      student: student._id,
      status: 'confirmed',
    });

    for (const reg of registrations) {
      await Event.findByIdAndUpdate(reg.event, { $inc: { registeredCount: -1 } });
    }

    // Delete registrations
    await EventRegistration.deleteMany({ student: student._id });

    // Delete user
    await User.findByIdAndDelete(student._id);

    return res.status(200).json({
      success: true,
      message: 'Student account and associated event registrations deleted.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getRecentActivity,
  getAllStudents,
  deleteStudent,
};
