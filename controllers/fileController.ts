import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import fs from 'fs';
import path from 'path';
import File from '../models/File';

export const getUpload = (req: Request, res: Response) => {
  res.render('files/upload', { title: 'Upload File' });
};

export const validateUpload = [
  body('access').isIn(['public', 'private']).withMessage('Access must be public or private'),
  body('slug')
    .optional({ values: 'falsy' })
    .isLength({ min: 3, max: 64 })
    .withMessage('Slug must be 3-64 chars')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug can contain lowercase letters, numbers, and dashes only')
];

const formatTimestamp = () => {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const yyyy = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const HH = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `${yyyy}${MM}${dd}${HH}${mm}${ss}`;
};

export const postUpload = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).render('files/upload', { title: 'Upload File', errors: errors.array() });
  }
  if (!req.file) {
    return res.status(400).render('files/upload', { title: 'Upload File', errors: [{ msg: 'No file uploaded' }] });
  }
  const access = (req.body.access as 'public' | 'private') || 'private';
  const rawSlug = (req.body.slug as string | undefined)?.toLowerCase()?.trim() || undefined;
  const slug = rawSlug ? `${rawSlug}-${formatTimestamp()}` : undefined;
  const ownerId = req.session.user?.id;
  if (!ownerId) {
    return res.status(401).redirect('/auth/login');
  }
  // Ensure slug is unique if provided
  if (slug) {
    const exists = await File.findOne({ slug });
    if (exists) {
      return res.status(400).render('files/upload', { title: 'Upload File', errors: [{ msg: 'Slug already in use (with timestamp)' }] });
    }
  }

  const created = await File.create({
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
  return res.redirect(`/files/${created.id}`);
};

export const listFiles = async (req: Request, res: Response) => {
  console.log('listFiles handler invoked');
  const userId = req.session.user?.id;
  const publicFiles = await File.find({ access: 'public' }).sort({ createdAt: -1 }).lean();
  const privateFiles = userId ? await File.find({ owner: userId, access: 'private' }).sort({ createdAt: -1 }).lean() : [];
  return res.render('files/index', { title: 'Files', publicFiles, privateFiles });
};

export const streamDownload = async (req: Request, res: Response) => {
  const id = req.params.id;
  const file = await File.findById(id);
  if (!file) return res.status(404).render('404', { title: 'Not Found' });

  // Access control
  if (file.access === 'private') {
    const apiUser = (req as any).apiUser as { id: string } | undefined;
    const ownerId = file.owner.toString();
    const isOwnerSession = req.session.user && req.session.user.id === ownerId;
    const isOwnerApi = apiUser && apiUser.id === ownerId;
    if (!isOwnerSession && !isOwnerApi) {
      return res.status(403).render('error', { title: 'Forbidden', error: { message: 'Access denied' } });
    }
  }

  const absPath = path.isAbsolute(file.path) ? file.path : path.join(process.cwd(), file.path);
  if (!fs.existsSync(absPath)) return res.status(404).render('404', { title: 'Not Found' });

  res.setHeader('Content-Type', file.mimeType);
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);

  // Stream the file
  const readStream = fs.createReadStream(absPath);
  readStream.on('error', (err) => {
    console.error('Stream error', err);
    if (!res.headersSent) res.status(500).end('Error reading file');
  });
  readStream.pipe(res);

  // Fire and forget download count
  File.findByIdAndUpdate(file._id, { $inc: { downloads: 1 } }).exec().catch(() => void 0);
};

export const streamBySlug = async (req: Request, res: Response) => {
  const slug = (req.params.slug || '').toLowerCase();
  const file = await File.findOne({ slug });
  if (!file) return res.status(404).render('404', { title: 'Not Found' });

  // Access control
  if (file.access === 'private') {
    const apiUser = (req as any).apiUser as { id: string } | undefined;
    const ownerId = file.owner.toString();
    const isOwnerSession = req.session.user && req.session.user.id === ownerId;
    const isOwnerApi = apiUser && apiUser.id === ownerId;
    if (!isOwnerSession && !isOwnerApi) {
      return res.status(403).render('error', { title: 'Forbidden', error: { message: 'Access denied' } });
    }
  }

  const absPath = path.isAbsolute(file.path) ? file.path : path.join(process.cwd(), file.path);
  if (!fs.existsSync(absPath)) return res.status(404).render('404', { title: 'Not Found' });

  res.setHeader('Content-Type', file.mimeType);
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);

  const readStream = fs.createReadStream(absPath);
  readStream.on('error', (err) => {
    console.error('Stream error', err);
    if (!res.headersSent) res.status(500).end('Error reading file');
  });
  readStream.pipe(res);

  File.findByIdAndUpdate(file._id, { $inc: { downloads: 1 } }).exec().catch(() => void 0);
};

export const getDetailsById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const file = await File.findById(id).lean();
  if (!file) return res.status(404).render('404', { title: 'Not Found' });

  // For private files, only owner can view details
  if (file.access === 'private') {
    const apiUser = (req as any).apiUser as { id: string } | undefined;
    const ownerId = file.owner.toString();
    const isOwnerSession = req.session.user && req.session.user.id === ownerId;
    const isOwnerApi = apiUser && apiUser.id === ownerId;
    if (!isOwnerSession && !isOwnerApi) {
      return res.status(403).render('error', { title: 'Forbidden', error: { message: 'Access denied' } });
    }
  }

  return  res.render('files/detail', { title: 'File Details', file });
};

export const getDetailsBySlug = async (req: Request, res: Response) => {
  const slug = (req.params.slug || '').toLowerCase();
  const file = await File.findOne({ slug }).lean();
  if (!file) return res.status(404).render('404', { title: 'Not Found' });

  if (file.access === 'private') {
    const apiUser = (req as any).apiUser as { id: string } | undefined;
    const ownerId = file.owner.toString();
    const isOwnerSession = req.session.user && req.session.user.id === ownerId;
    const isOwnerApi = apiUser && apiUser.id === ownerId;
    if (!isOwnerSession && !isOwnerApi) {
      return res.status(403).render('error', { title: 'Forbidden', error: { message: 'Access denied' } });
    }
  }

  return res.render('files/detail', { title: 'File Details', file });
};
