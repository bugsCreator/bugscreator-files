import multer from 'multer';
import type { ErrorRequestHandler } from 'express';
import path from 'path';
import fs from 'fs';

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const safeBase = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, unique + '-' + safeBase);
  }
});
// 100 MB limit
const limits = { fileSize: 100 * 1024 * 1024 };

export const uploadSingle = multer({ storage, limits }).single('file');

export const handleUploadError: ErrorRequestHandler = (err, req, res, next) => {
  if (err && err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'File too large. Max 100 MB.'
      : err.message || 'Upload error';
    if (req.accepts('html')) {
      return res.status(400).render('files/upload', { title: 'Upload File', errors: [{ msg: message }] });
    }
    return res.status(400).json({ error: message });
  }
  if (err) return next(err);
  next();
};
