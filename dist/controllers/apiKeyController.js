"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.revokeKey = exports.createKey = exports.validateCreate = exports.managePage = void 0;
const express_validator_1 = require("express-validator");
const User_1 = __importDefault(require("../models/User"));
const managePage = async (req, res) => {
    const userId = req.session.user?.id;
    if (!userId)
        return res.redirect('/auth/login');
    const user = await User_1.default.findById(userId).lean();
    if (!user)
        return res.redirect('/auth/login');
    res.render('auth/api-keys', { title: 'API Keys', keys: user.apiKeys || [] });
};
exports.managePage = managePage;
exports.validateCreate = [
    (0, express_validator_1.body)('label').optional().trim().isLength({ max: 50 }).withMessage('Label too long')
];
const createKey = async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        req.session.flash = { type: 'error', message: errors.array()[0].msg };
        return res.redirect('/auth/api-keys');
    }
    const user = await User_1.default.findById(req.session.user.id);
    if (!user)
        return res.redirect('/auth/login');
    const { token } = await user.generateApiKey(req.body.label || undefined);
    // Show once; store in flash to display
    req.session.flash = { type: 'success', message: `API Key created. Copy now: ${token}` };
    res.redirect('/auth/api-keys');
};
exports.createKey = createKey;
const revokeKey = async (req, res) => {
    const user = await User_1.default.findById(req.session.user.id);
    if (!user)
        return res.redirect('/auth/login');
    const keyId = req.params.keyId;
    await user.revokeApiKey(keyId);
    req.session.flash = { type: 'success', message: 'API Key revoked' };
    res.redirect('/auth/api-keys');
};
exports.revokeKey = revokeKey;
