import { Router } from 'express';
import File from '../models/File';

const router = Router();

router.get('/', async (req, res) => {
  const recentPublic = await File.find({ access: 'public' }).sort({ createdAt: -1 }).limit(10).lean();
  res.render('index', { title: 'Home', recentPublic });
});

export default router;
