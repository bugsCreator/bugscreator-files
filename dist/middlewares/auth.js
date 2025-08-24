"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdminOrFirstUser = exports.requireAdmin = exports.requireAuth = void 0;
const User_1 = __importDefault(require("../models/User"));
const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        req.session.flash = { type: 'error', message: 'Please log in' };
        return res.redirect('/auth/login');
    }
    next();
};
exports.requireAuth = requireAuth;
const requireAdmin = (req, res, next) => {
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
exports.requireAdmin = requireAdmin;
// Allows access if there are no users yet (bootstrap first admin), otherwise requires admin
const requireAdminOrFirstUser = async (req, res, next) => {
    try {
        const total = await User_1.default.estimatedDocumentCount();
        if (total === 0)
            return next();
    }
    catch (e) {
        // If DB check fails, fall back to auth check to be safe
    }
    if (!req.session.user || req.session.user.role !== 'admin') {
        req.session.flash = { type: 'error', message: 'Admins only' };
        return res.redirect('/');
    }
    next();
};
exports.requireAdminOrFirstUser = requireAdminOrFirstUser;
