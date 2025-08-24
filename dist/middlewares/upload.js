"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleUploadError = exports.uploadSingle = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uploadDir = path_1.default.join(process.cwd(), 'uploads');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const safeBase = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        cb(null, unique + '-' + safeBase);
    }
});
// 100 MB limit
const limits = { fileSize: 100 * 1024 * 1024 };
exports.uploadSingle = (0, multer_1.default)({ storage, limits }).single('file');
const handleUploadError = (err, req, res, next) => {
    if (err && err instanceof multer_1.default.MulterError) {
        const message = err.code === 'LIMIT_FILE_SIZE'
            ? 'File too large. Max 100 MB.'
            : err.message || 'Upload error';
        if (req.accepts('html')) {
            return res.status(400).render('files/upload', { title: 'Upload File', errors: [{ msg: message }] });
        }
        return res.status(400).json({ error: message });
    }
    if (err)
        return next(err);
    next();
};
exports.handleUploadError = handleUploadError;
