"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const adminController_1 = require("../controllers/adminController");
const router = (0, express_1.Router)();
router.get('/users', auth_1.requireAdmin, adminController_1.usersPage);
router.post('/users', auth_1.requireAdmin, adminController_1.validateCreateUser, adminController_1.postCreateUser);
exports.default = router;
