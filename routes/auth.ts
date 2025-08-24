import { Router } from 'express';
import { getLogin, getRegister, postLogin, postRegister, validateLogin, validateRegister, logout } from '../controllers/authController';
import { managePage, createKey, revokeKey, validateCreate } from '../controllers/apiKeyController';
import { requireAuth } from '../middlewares/auth';

const router = Router();

router.get('/login', getLogin);
router.get('/register', getRegister);
router.post('/login', validateLogin, postLogin);
router.post('/register', validateRegister, postRegister);
router.post('/logout', logout);
// API keys management
router.get('/api-keys', requireAuth, managePage);
router.post('/api-keys', requireAuth, validateCreate, createKey);
router.post('/api-keys/:keyId/revoke', requireAuth, revokeKey);

export default router;
