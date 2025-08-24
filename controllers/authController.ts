import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import User, { hashPassword } from '../models/User';

export const getLogin = (req: Request, res: Response) => {
  return res.render('auth/login', { title: 'Login' });
};

export const getRegister = (req: Request, res: Response) => {
  res.render('auth/register', { title: 'Register' });
};

export const validateRegister = [
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 chars'),
  body('email').isEmail().withMessage('Invalid email').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 chars')
];

export const postRegister = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).render('auth/register', { title: 'Register', errors: errors.array() });
  }
  const { username, email, password } = req.body;
  // Admin-only creation, except bootstrap: if there are no users, allow creating the first user as admin.
  const totalUsers = await User.estimatedDocumentCount();
  if (totalUsers > 0 && req.session.user?.role !== 'admin') {
    req.session.flash = { type: 'error', message: 'Only admins can create new users.' };
    return res.redirect('/auth/login');
  }
  const existing = await User.findOne({ $or: [{ username }, { email }] });
  if (existing) {
    return res.status(400).render('auth/register', { title: 'Register', errors: [{ msg: 'User already exists' }] });
  }
  const passwordHash = await hashPassword(password);
  const role = totalUsers === 0 ? 'admin' : 'user';
  const user = await User.create({ username, email, passwordHash, role });
  req.session.user = { id: user.id, username: user.username, role: user.role };
  req.session.flash = { type: 'success', message: 'Registered successfully' };
  return res.redirect('/');
};

export const validateLogin = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
];

export const postLogin = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).render('auth/login', { title: 'Login', errors: errors.array() });
  }
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user || !(await user.verifyPassword(password))) {
    return res.status(400).render('auth/login', { title: 'Login', errors: [{ msg: 'Invalid credentials' }] });
  }
  req.session.user = { id: user.id, username: user.username, role: user.role };
  req.session.flash = { type: 'success', message: 'Logged in' };
  return res.redirect('/');
};

export const logout = (req: Request, res: Response) => {
  req.session.destroy(() => {
    return res.redirect('/');
  });
};
