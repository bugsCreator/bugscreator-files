import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import User, { hashPassword } from '../models/User';

export const getLogin = (req: Request, res: Response) => {
  res.render('auth/login', { title: 'Login' });
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
  const existing = await User.findOne({ $or: [{ username }, { email }] });
  if (existing) {
    return res.status(400).render('auth/register', { title: 'Register', errors: [{ msg: 'User already exists' }] });
  }
  const passwordHash = await hashPassword(password);
  const user = await User.create({ username, email, passwordHash });
  req.session.user = { id: user.id, username: user.username };
  req.session.flash = { type: 'success', message: 'Registered successfully' };
  res.redirect('/');
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
  req.session.user = { id: user.id, username: user.username };
  req.session.flash = { type: 'success', message: 'Logged in' };
  res.redirect('/');
};

export const logout = (req: Request, res: Response) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
};
