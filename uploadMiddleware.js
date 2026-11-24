const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload destination directories exist
const createDirIfMissing = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Storage factory function generating destination-aware Multer engine
const createStorage = (subfolder) => {
  const uploadPath = path.join(__dirname, '..', 'uploads', subfolder);
  createDirIfMissing(uploadPath);

  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.originalname).toLowerCase();
      const baseName = path
        .basename(file.originalname, ext)
        .replace(/[^a-zA-Z0-9]/g, '_')
        .slice(0, 30);
      cb(null, `${baseName}-${uniqueSuffix}${ext}`);
    },
  });
};

// Image MIME filter
const imageFilter = (req, file, cb) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (file.mimetype.startsWith('image/') && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only valid image files (JPG, PNG, WEBP, GIF) are allowed.'), false);
  }
};

// Academic document MIME filter
const documentFilter = (req, file, cb) => {
  const allowedExtensions = [
    '.pdf',
    '.doc',
    '.docx',
    '.ppt',
    '.pptx',
    '.xls',
    '.xlsx',
    '.txt',
    '.zip',
  ];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Invalid file type. Allowed formats: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, ZIP.'
      ),
      false
    );
  }
};

// Upload handler instances
const uploadBanner = multer({
  storage: createStorage('banners'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: imageFilter,
});

const uploadAvatar = multer({
  storage: createStorage('avatars'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: imageFilter,
});

const uploadMaterial = multer({
  storage: createStorage('materials'),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
  fileFilter: documentFilter,
});

module.exports = {
  uploadBanner,
  uploadAvatar,
  uploadMaterial,
};
