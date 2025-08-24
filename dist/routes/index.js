"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const File_1 = __importDefault(require("../models/File"));
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    const recentPublic = await File_1.default.find({ access: 'public' }).sort({ createdAt: -1 }).limit(10).lean();
    res.render('index', { title: 'Home', recentPublic });
});
exports.default = router;
