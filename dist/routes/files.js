"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fileController_1 = require("../controllers/fileController");
const auth_1 = require("../middlewares/auth");
const upload_1 = require("../middlewares/upload");
const router = (0, express_1.Router)();
router.get('/', fileController_1.listFiles);
router.get('/upload', auth_1.requireAuth, fileController_1.getUpload);
router.post('/upload', auth_1.requireAuth, upload_1.uploadSingle, upload_1.handleUploadError, fileController_1.validateUpload, fileController_1.postUpload);
// Slug routes first to avoid being captured by :id
router.get('/slug/:slug/details', fileController_1.getDetailsBySlug);
router.get('/slug/:slug', fileController_1.streamBySlug);
// ID routes after
router.get('/:id/download', fileController_1.streamDownload);
router.get('/:id', fileController_1.getDetailsById);
exports.default = router;
