"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const apiKeyController_1 = require("../controllers/apiKeyController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
router.get('/login', authController_1.getLogin);
router.get('/register', auth_1.requireAdminOrFirstUser, authController_1.getRegister);
router.post('/login', authController_1.validateLogin, authController_1.postLogin);
router.post('/register', auth_1.requireAdminOrFirstUser, authController_1.validateRegister, authController_1.postRegister);
router.post('/logout', authController_1.logout);
// API keys management
router.get('/api-keys', auth_1.requireAuth, apiKeyController_1.managePage);
router.post('/api-keys', auth_1.requireAuth, apiKeyController_1.validateCreate, apiKeyController_1.createKey);
router.post('/api-keys/:keyId/revoke', auth_1.requireAuth, apiKeyController_1.revokeKey);
exports.default = router;
