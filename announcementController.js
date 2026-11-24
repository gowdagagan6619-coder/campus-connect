const Announcement = require('../models/Announcement');

/**
 * @desc    Get all announcements with search, category & priority filtering
 * @route   GET /api/announcements
 * @access  Public
 */
const getAnnouncements = async (req, res, next) => {
  try {
    const { search, priority, category } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    if (priority && priority !== 'All') {
      query.priority = priority;
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    const announcements = await Announcement.find(query)
      .populate('author', 'name email role')
      .sort({ isPinned: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: announcements.length,
      announcements,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single announcement by ID
 * @route   GET /api/announcements/:id
 * @access  Public
 */
const getAnnouncementById = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id).populate(
      'author',
      'name email role'
    );

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found.',
      });
    }

    return res.status(200).json({
      success: true,
      announcement,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new announcement
 * @route   POST /api/announcements
 * @access  Private/Admin
 */
const createAnnouncement = async (req, res, next) => {
  try {
    const { title, content, priority, category, targetAudience, isPinned } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required fields.',
      });
    }

    const announcement = await Announcement.create({
      title,
      content,
      priority: priority || 'medium',
      category: category || 'General',
      targetAudience: targetAudience || 'all',
      isPinned: Boolean(isPinned),
      author: req.user._id,
    });

    const populated = await Announcement.findById(announcement._id).populate(
      'author',
      'name email role'
    );

    return res.status(201).json({
      success: true,
      message: 'Announcement published successfully.',
      announcement: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update existing announcement
 * @route   PUT /api/announcements/:id
 * @access  Private/Admin
 */
const updateAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found.',
      });
    }

    const { title, content, priority, category, targetAudience, isPinned } = req.body;

    if (title) announcement.title = title;
    if (content) announcement.content = content;
    if (priority) announcement.priority = priority;
    if (category) announcement.category = category;
    if (targetAudience) announcement.targetAudience = targetAudience;
    if (isPinned !== undefined) announcement.isPinned = Boolean(isPinned);

    await announcement.save();

    const updated = await Announcement.findById(announcement._id).populate(
      'author',
      'name email role'
    );

    return res.status(200).json({
      success: true,
      message: 'Announcement updated successfully.',
      announcement: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete announcement
 * @route   DELETE /api/announcements/:id
 * @access  Private/Admin
 */
const deleteAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found.',
      });
    }

    await Announcement.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Announcement deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
};
