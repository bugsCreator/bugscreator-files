import { Request, Response, NextFunction } from 'express';
import User from '../models/User';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.user) {
    req.session.flash = { type: 'error', message: 'Please log in' };
    return res.redirect('/auth/login');
  }
  next();
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.user) {
    req.session.flash = { type: 'error', message: 'Please log in' };
    return res.redirect('/auth/login');
  }
  if (req.session.user.role !== 'admin') {
    req.session.flash = { type: 'error', message: 'Admins only' };
    return res.redirect('/');
  }
  next();
};

// Allows access if there are no users yet (bootstrap first admin), otherwise requires admin
export const requireAdminOrFirstUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const total = await User.estimatedDocumentCount();
    if (total === 0) return next();
  } catch (e) {
    // If DB check fails, fall back to auth check to be safe
  }
  if (!req.session.user || req.session.user.role !== 'admin') {
    req.session.flash = { type: 'error', message: 'Admins only' };
    return res.redirect('/');
  }
  next();
};
