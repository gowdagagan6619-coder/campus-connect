const express = require('express');
const router = express.Router();
const {
  getMaterials,
  createMaterial,
  deleteMaterial,
  downloadMaterial,
} = require('../controllers/materialController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { uploadMaterial } = require('../middleware/uploadMiddleware');

// Authenticated read and download routes
router.get('/', protect, getMaterials);
router.get('/:id/download', protect, downloadMaterial);

// Admin-only management routes
router.post('/', protect, authorize('admin'), uploadMaterial.single('file'), createMaterial);
router.delete('/:id', protect, authorize('admin'), deleteMaterial);

module.exports = router;
