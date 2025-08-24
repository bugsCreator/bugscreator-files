# BugsCreator Files (TypeScript)

Auth + file upload/download (streaming) with access control (public/private), Express + EJS + MongoDB.

## Features
- Register/Login/Logout (session-based)
- Upload files with public/private access
- Download via streaming with access control
- EJS templates with Tailwind CSS (CDN)
- MongoDB via Mongoose

## Quick start
1. Create `.env`:
   - `MONGODB_URI=mongodb://127.0.0.1:27017/bugscreator_files_ts`
   - `SESSION_SECRET=your-secret`
   - `PORT=3000`
2. Install deps
3. Run dev server

## Scripts
- `npm run dev` start with ts-node-dev
- `npm run build` compile to `dist`
- `npm start` run compiled server

## Routes
- `GET /` home (recent public files)
- `GET /auth/login` login form
- `POST /auth/login`
- `GET /auth/register` register form
- `POST /auth/register`
- `POST /auth/logout`
- `GET /files` list public + current user's private files
- `GET /files/upload` upload form (auth)
- `POST /files/upload` upload (auth)
- `GET /files/:id/download` download stream (public or owner only)

## Notes
- Upload directory: `uploads/` (auto-created)
- Tailwind via CDN for simplicity