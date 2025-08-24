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
exports.logout = exports.postLogin = exports.validateLogin = exports.postRegister = exports.validateRegister = exports.getRegister = exports.getLogin = void 0;
const express_validator_1 = require("express-validator");
const User_1 = __importStar(require("../models/User"));
const getLogin = (req, res) => {
    res.render('auth/login', { title: 'Login' });
};
exports.getLogin = getLogin;
const getRegister = (req, res) => {
    res.render('auth/register', { title: 'Register' });
};
exports.getRegister = getRegister;
exports.validateRegister = [
    (0, express_validator_1.body)('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 chars'),
    (0, express_validator_1.body)('email').isEmail().withMessage('Invalid email').normalizeEmail(),
    (0, express_validator_1.body)('password').isLength({ min: 6 }).withMessage('Password must be at least 6 chars')
];
const postRegister = async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).render('auth/register', { title: 'Register', errors: errors.array() });
    }
    const { username, email, password } = req.body;
    const existing = await User_1.default.findOne({ $or: [{ username }, { email }] });
    if (existing) {
        return res.status(400).render('auth/register', { title: 'Register', errors: [{ msg: 'User already exists' }] });
    }
    const passwordHash = await (0, User_1.hashPassword)(password);
    const user = await User_1.default.create({ username, email, passwordHash });
    req.session.user = { id: user.id, username: user.username };
    req.session.flash = { type: 'success', message: 'Registered successfully' };
    res.redirect('/');
};
exports.postRegister = postRegister;
exports.validateLogin = [
    (0, express_validator_1.body)('username').trim().notEmpty().withMessage('Username is required'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required')
];
const postLogin = async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).render('auth/login', { title: 'Login', errors: errors.array() });
    }
    const { username, password } = req.body;
    const user = await User_1.default.findOne({ username });
    if (!user || !(await user.verifyPassword(password))) {
        return res.status(400).render('auth/login', { title: 'Login', errors: [{ msg: 'Invalid credentials' }] });
    }
    req.session.user = { id: user.id, username: user.username };
    req.session.flash = { type: 'success', message: 'Logged in' };
    res.redirect('/');
};
exports.postLogin = postLogin;
const logout = (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
};
exports.logout = logout;
