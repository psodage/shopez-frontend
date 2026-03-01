const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '-');
    const unique = Date.now().toString(36);
    cb(null, `${base}-${unique}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowed.includes(file.mimetype)) {
    cb(new Error('Only image files are allowed.'));
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 8,
  },
});

// For now we just expose a multi-image field called "images".
exports.uploadProductImages = upload.array('images', 8);

// Single image for category (field: image)
exports.uploadCategoryImage = upload.single('image');

// Single image for category banner (field: banner)
exports.uploadCategoryBanner = upload.single('banner');

// Banner form: optional single image (field: image) + other form fields
exports.parseBannerForm = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('image');

