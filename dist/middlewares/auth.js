"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = void 0;
const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        req.session.flash = { type: 'error', message: 'Please log in' };
        return res.redirect('/auth/login');
    }
    next();
};
exports.requireAuth = requireAuth;
