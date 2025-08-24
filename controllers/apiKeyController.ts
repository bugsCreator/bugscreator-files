import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User';

export const managePage = async (req: Request, res: Response) => {
  const userId = req.session.user?.id;
  if (!userId) return res.redirect('/auth/login');
  const user = await User.findById(userId).lean();
  if (!user) return res.redirect('/auth/login');
  res.render('auth/api-keys', { title: 'API Keys', keys: user.apiKeys || [] });
};

export const validateCreate = [
  body('label').optional().trim().isLength({ max: 50 }).withMessage('Label too long')
];

export const createKey = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.session.flash = { type: 'error', message: errors.array()[0].msg };
    return res.redirect('/auth/api-keys');
  }
  const user = await User.findById(req.session.user!.id);
  if (!user) return res.redirect('/auth/login');
  const { token } = await user.generateApiKey(req.body.label || undefined);
  // Show once; store in flash to display
  req.session.flash = { type: 'success', message: `API Key created. Copy now: ${token}` };
  res.redirect('/auth/api-keys');
};

export const revokeKey = async (req: Request, res: Response) => {
  const user = await User.findById(req.session.user!.id);
  if (!user) return res.redirect('/auth/login');
  const keyId = req.params.keyId;
  await user.revokeApiKey(keyId);
  req.session.flash = { type: 'success', message: 'API Key revoked' };
  res.redirect('/auth/api-keys');
};
