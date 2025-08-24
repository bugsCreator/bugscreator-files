import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import User, { hashPassword } from '../models/User';

export const usersPage = async (req: Request, res: Response) => {
  const users = await User.find({}, { username: 1, email: 1, role: 1, createdAt: 1 })
    .sort({ createdAt: -1 })
    .lean();
  res.render('admin/users', { title: 'Manage Users', users });
};

export const validateCreateUser = [
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 chars'),
  body('email').isEmail().withMessage('Invalid email').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 chars'),
  body('role').optional().isIn(['user', 'admin']).withMessage('Invalid role')
];

export const postCreateUser = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.session.flash = { type: 'error', message: errors.array()[0].msg };
    return res.redirect('/admin/users');
  }
  const { username, email, password } = req.body as {
    username: string;
    email: string;
    password: string;
  };
  const role = (req.body.role as 'user' | 'admin') || 'user';
  const existing = await User.findOne({ $or: [{ username }, { email }] });
  if (existing) {
    req.session.flash = { type: 'error', message: 'User already exists' };
    return res.redirect('/admin/users');
  }
  const passwordHash = await hashPassword(password);
  await User.create({ username, email, passwordHash, role });
  req.session.flash = { type: 'success', message: `User ${username} created` };
  return res.redirect('/admin/users');
};
