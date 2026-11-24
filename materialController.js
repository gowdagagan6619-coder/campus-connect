const StudyMaterial = require('../models/StudyMaterial');
const path = require('path');
const fs = require('fs');

/**
 * @desc    Get all study materials with multi-criteria filtering
 * @route   GET /api/materials
 * @access  Private
 */
const getMaterials = async (req, res, next) => {
  try {
    const { department, semester, subject, search } = req.query;
    const query = {};

    if (department && department !== 'All') {
      query.department = department;
    }

    if (semester && semester !== 'All') {
      query.semester = Number(semester);
    }

    if (subject && subject !== 'All') {
      query.subject = { $regex: subject, $options: 'i' };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
      ];
    }

    const materials = await StudyMaterial.find(query)
      .populate('uploadedBy', 'name email role')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: materials.length,
      materials,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload new study material
 * @route   POST /api/materials
 * @access  Private/Admin
 */
const createMaterial = async (req, res, next) => {
  try {
    const { title, description, subject, department, semester } = req.body;

    if (!title || !subject || !department || !semester) {
      return res.status(400).json({
        success: false,
        message: 'Title, subject, department, and semester are required fields.',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please attach a document file (PDF, DOCX, PPTX, etc.).',
      });
    }

    const fileUrl = `/uploads/materials/${req.file.filename}`;

    const material = await StudyMaterial.create({
      title,
      description: description || '',
      subject,
      department,
      semester: Number(semester),
      fileUrl,
      originalFileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      uploadedBy: req.user._id,
    });

    const populated = await StudyMaterial.findById(material._id).populate(
      'uploadedBy',
      'name email role'
    );

    return res.status(201).json({
      success: true,
      message: 'Study material uploaded successfully.',
      material: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete study material record and clean up stored file
 * @route   DELETE /api/materials/:id
 * @access  Private/Admin
 */
const deleteMaterial = async (req, res, next) => {
  try {
    const material = await StudyMaterial.findById(req.params.id);
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Study material not found.',
      });
    }

    // Physical disk file cleanup
    if (material.fileUrl && material.fileUrl.startsWith('/uploads/')) {
      const fullPath = path.join(__dirname, '..', material.fileUrl);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    await StudyMaterial.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Study material and file removed successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Download study material file
 * @route   GET /api/materials/:id/download
 * @access  Private
 */
const downloadMaterial = async (req, res, next) => {
  try {
    const material = await StudyMaterial.findById(req.params.id);
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Study material not found.',
      });
    }

    const fullPath = path.join(__dirname, '..', material.fileUrl);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({
        success: false,
        message: 'The requested file was not found on the server storage.',
      });
    }

    return res.download(fullPath, material.originalFileName);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMaterials,
  createMaterial,
  deleteMaterial,
  downloadMaterial,
};
