import { Request, Response, NextFunction } from 'express';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.user) {
    req.session.flash = { type: 'error', message: 'Please log in' };
    return res.redirect('/auth/login');
  }
  next();
};
