import { Router } from 'express';
import { requireAdmin } from '../middlewares/auth';
import { usersPage, validateCreateUser, postCreateUser } from '../controllers/adminController';

const router = Router();

router.get('/users', requireAdmin, usersPage);
router.post('/users', requireAdmin, validateCreateUser, postCreateUser);

export default router;
