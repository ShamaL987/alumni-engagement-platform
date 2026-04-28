const multer = require('multer');
const path = require('path');
const fs = require('fs');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function buildStorage(folder) {
  const destination = path.join(__dirname, '..', 'uploads', folder);
  ensureDir(destination);

  return multer.diskStorage({
    destination,
    filename: (req, file, cb) => {
      const safeBase = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeBase}`);
    }
  });
}

const maxUploadMb = Number(process.env.MAX_UPLOAD_MB || 8);

const imageUpload = multer({
  storage: buildStorage('profile-images'),
  limits: { fileSize: maxUploadMb * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only image uploads are allowed'));
    return cb(null, true);
  }
});

const documentUpload = multer({
  storage: buildStorage('documents'),
  limits: { fileSize: maxUploadMb * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];
    if (!allowed.includes(file.mimetype)) return cb(new Error('Only PDF and image documents are allowed'));
    return cb(null, true);
  }
});

module.exports = { imageUpload, documentUpload };
