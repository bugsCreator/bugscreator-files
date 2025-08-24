import { Router } from 'express';
import { getUpload, listFiles, postUpload, streamDownload, streamBySlug, validateUpload, getDetailsById, getDetailsBySlug } from '../controllers/fileController';
import { requireAuth } from '../middlewares/auth';
import { uploadSingle, handleUploadError } from '../middlewares/upload';

const router = Router();

router.get('/', listFiles);
router.get('/upload', requireAuth, getUpload);
router.post('/upload', requireAuth, uploadSingle, handleUploadError, validateUpload, postUpload);
// Slug routes first to avoid being captured by :id
router.get('/slug/:slug/details', getDetailsBySlug);
router.get('/slug/:slug', streamBySlug);
// ID routes after
router.get('/:id/download', streamDownload);
router.get('/:id', getDetailsById);

export default router;
