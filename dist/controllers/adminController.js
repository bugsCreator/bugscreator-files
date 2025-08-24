"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.postCreateUser = exports.validateCreateUser = exports.usersPage = void 0;
const express_validator_1 = require("express-validator");
const User_1 = __importStar(require("../models/User"));
const usersPage = async (req, res) => {
    const users = await User_1.default.find({}, { username: 1, email: 1, role: 1, createdAt: 1 })
        .sort({ createdAt: -1 })
        .lean();
    res.render('admin/users', { title: 'Manage Users', users });
};
exports.usersPage = usersPage;
exports.validateCreateUser = [
    (0, express_validator_1.body)('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 chars'),
    (0, express_validator_1.body)('email').isEmail().withMessage('Invalid email').normalizeEmail(),
    (0, express_validator_1.body)('password').isLength({ min: 6 }).withMessage('Password must be at least 6 chars'),
    (0, express_validator_1.body)('role').optional().isIn(['user', 'admin']).withMessage('Invalid role')
];
const postCreateUser = async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        req.session.flash = { type: 'error', message: errors.array()[0].msg };
        return res.redirect('/admin/users');
    }
    const { username, email, password } = req.body;
    const role = req.body.role || 'user';
    const existing = await User_1.default.findOne({ $or: [{ username }, { email }] });
    if (existing) {
        req.session.flash = { type: 'error', message: 'User already exists' };
        return res.redirect('/admin/users');
    }
    const passwordHash = await (0, User_1.hashPassword)(password);
    await User_1.default.create({ username, email, passwordHash, role });
    req.session.flash = { type: 'success', message: `User ${username} created` };
    return res.redirect('/admin/users');
};
exports.postCreateUser = postCreateUser;
