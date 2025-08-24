"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDetailsBySlug = exports.getDetailsById = exports.streamBySlug = exports.streamDownload = exports.listFiles = exports.postUpload = exports.validateUpload = exports.getUpload = void 0;
const express_validator_1 = require("express-validator");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const File_1 = __importDefault(require("../models/File"));
const getUpload = (req, res) => {
    res.render('files/upload', { title: 'Upload File' });
};
exports.getUpload = getUpload;
exports.validateUpload = [
    (0, express_validator_1.body)('access').isIn(['public', 'private']).withMessage('Access must be public or private'),
    (0, express_validator_1.body)('slug')
        .optional({ values: 'falsy' })
        .isLength({ min: 3, max: 64 })
        .withMessage('Slug must be 3-64 chars')
        .matches(/^[a-z0-9-]+$/)
        .withMessage('Slug can contain lowercase letters, numbers, and dashes only')
];
const formatTimestamp = () => {
    const d = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    const yyyy = d.getFullYear();
    const MM = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const HH = pad(d.getHours());
    const mm = pad(d.getMinutes());
    const ss = pad(d.getSeconds());
    return `${yyyy}${MM}${dd}${HH}${mm}${ss}`;
};
const postUpload = async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).render('files/upload', { title: 'Upload File', errors: errors.array() });
    }
    if (!req.file) {
        return res.status(400).render('files/upload', { title: 'Upload File', errors: [{ msg: 'No file uploaded' }] });
    }
    const access = req.body.access || 'private';
    const rawSlug = req.body.slug?.toLowerCase()?.trim() || undefined;
    const slug = rawSlug ? `${rawSlug}-${formatTimestamp()}` : undefined;
    const ownerId = req.session.user?.id;
    if (!ownerId) {
        return res.status(401).redirect('/auth/login');
    }
    // Ensure slug is unique if provided
    if (slug) {
        const exists = await File_1.default.findOne({ slug });
        if (exists) {
            return res.status(400).render('files/upload', { title: 'Upload File', errors: [{ msg: 'Slug already in use (with timestamp)' }] });
        }
    }
    const created = await File_1.default.create({
        owner: ownerId,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        access,
        slug
    });
    req.session.flash = { type: 'success', message: 'File uploaded' };
    if (created.slug) {
        return res.redirect(`/files/slug/${created.slug}/details`);
    }
    res.redirect(`/files/${created.id}`);
};
exports.postUpload = postUpload;
const listFiles = async (req, res) => {
    console.log('listFiles handler invoked');
    const userId = req.session.user?.id;
    const publicFiles = await File_1.default.find({ access: 'public' }).sort({ createdAt: -1 }).lean();
    const privateFiles = userId ? await File_1.default.find({ owner: userId, access: 'private' }).sort({ createdAt: -1 }).lean() : [];
    return res.render('files/index', { title: 'Files', publicFiles, privateFiles });
};
exports.listFiles = listFiles;
const streamDownload = async (req, res) => {
    const id = req.params.id;
    const file = await File_1.default.findById(id);
    if (!file)
        return res.status(404).render('404', { title: 'Not Found' });
    // Access control
    if (file.access === 'private') {
        const apiUser = req.apiUser;
        const ownerId = file.owner.toString();
        const isOwnerSession = req.session.user && req.session.user.id === ownerId;
        const isOwnerApi = apiUser && apiUser.id === ownerId;
        if (!isOwnerSession && !isOwnerApi) {
            return res.status(403).render('error', { title: 'Forbidden', error: { message: 'Access denied' } });
        }
    }
    const absPath = path_1.default.isAbsolute(file.path) ? file.path : path_1.default.join(process.cwd(), file.path);
    if (!fs_1.default.existsSync(absPath))
        return res.status(404).render('404', { title: 'Not Found' });
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
    // Stream the file
    const readStream = fs_1.default.createReadStream(absPath);
    readStream.on('error', (err) => {
        console.error('Stream error', err);
        if (!res.headersSent)
            res.status(500).end('Error reading file');
    });
    readStream.pipe(res);
    // Fire and forget download count
    File_1.default.findByIdAndUpdate(file._id, { $inc: { downloads: 1 } }).exec().catch(() => void 0);
};
exports.streamDownload = streamDownload;
const streamBySlug = async (req, res) => {
    const slug = (req.params.slug || '').toLowerCase();
    const file = await File_1.default.findOne({ slug });
    if (!file)
        return res.status(404).render('404', { title: 'Not Found' });
    // Access control
    if (file.access === 'private') {
        const apiUser = req.apiUser;
        const ownerId = file.owner.toString();
        const isOwnerSession = req.session.user && req.session.user.id === ownerId;
        const isOwnerApi = apiUser && apiUser.id === ownerId;
        if (!isOwnerSession && !isOwnerApi) {
            return res.status(403).render('error', { title: 'Forbidden', error: { message: 'Access denied' } });
        }
    }
    const absPath = path_1.default.isAbsolute(file.path) ? file.path : path_1.default.join(process.cwd(), file.path);
    if (!fs_1.default.existsSync(absPath))
        return res.status(404).render('404', { title: 'Not Found' });
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
    const readStream = fs_1.default.createReadStream(absPath);
    readStream.on('error', (err) => {
        console.error('Stream error', err);
        if (!res.headersSent)
            res.status(500).end('Error reading file');
    });
    readStream.pipe(res);
    File_1.default.findByIdAndUpdate(file._id, { $inc: { downloads: 1 } }).exec().catch(() => void 0);
};
exports.streamBySlug = streamBySlug;
const getDetailsById = async (req, res) => {
    const { id } = req.params;
    const file = await File_1.default.findById(id).lean();
    if (!file)
        return res.status(404).render('404', { title: 'Not Found' });
    // For private files, only owner can view details
    if (file.access === 'private') {
        const apiUser = req.apiUser;
        const ownerId = file.owner.toString();
        const isOwnerSession = req.session.user && req.session.user.id === ownerId;
        const isOwnerApi = apiUser && apiUser.id === ownerId;
        if (!isOwnerSession && !isOwnerApi) {
            return res.status(403).render('error', { title: 'Forbidden', error: { message: 'Access denied' } });
        }
    }
    res.render('files/detail', { title: 'File Details', file });
};
exports.getDetailsById = getDetailsById;
const getDetailsBySlug = async (req, res) => {
    const slug = (req.params.slug || '').toLowerCase();
    const file = await File_1.default.findOne({ slug }).lean();
    if (!file)
        return res.status(404).render('404', { title: 'Not Found' });
    if (file.access === 'private') {
        const apiUser = req.apiUser;
        const ownerId = file.owner.toString();
        const isOwnerSession = req.session.user && req.session.user.id === ownerId;
        const isOwnerApi = apiUser && apiUser.id === ownerId;
        if (!isOwnerSession && !isOwnerApi) {
            return res.status(403).render('error', { title: 'Forbidden', error: { message: 'Access denied' } });
        }
    }
    res.render('files/detail', { title: 'File Details', file });
};
exports.getDetailsBySlug = getDetailsBySlug;
