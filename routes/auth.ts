import { Router } from 'express';
import { getLogin, getRegister, postLogin, postRegister, validateLogin, validateRegister, logout } from '../controllers/authController';

const router = Router();

router.get('/login', getLogin);
router.get('/register', getRegister);
router.post('/login', validateLogin, postLogin);
router.post('/register', validateRegister, postRegister);
router.post('/logout', logout);

export default router;
