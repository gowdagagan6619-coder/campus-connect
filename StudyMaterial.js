const mongoose = require('mongoose');

const studyMaterialSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a title for the study material'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    subject: {
      type: String,
      required: [true, 'Please provide the academic subject name'],
      trim: true,
      index: true,
    },
    department: {
      type: String,
      required: [true, 'Please select the department'],
      trim: true,
      index: true,
    },
    semester: {
      type: Number,
      required: [true, 'Please select the semester'],
      min: [1, 'Semester must be between 1 and 8'],
      max: [8, 'Semester must be between 1 and 8'],
      index: true,
    },
    fileUrl: {
      type: String,
      required: [true, 'Material file upload is required'],
    },
    originalFileName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number, // In bytes
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploader user ID is required'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index for academic semester/department filtering
studyMaterialSchema.index({ department: 1, semester: 1, subject: 1 });
studyMaterialSchema.index({ createdAt: -1 });

const StudyMaterial = mongoose.model('StudyMaterial', studyMaterialSchema);

module.exports = StudyMaterial;
