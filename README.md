# BugsCreator Files (TypeScript + Express + MongoDB)

A simple file sharing/management web app with server-rendered EJS views, login sessions, and role-based access (admin/user). This README focuses on running and using the app via the UI and excludes API documentation.

## Features

- User authentication with sessions
- Admin-only user management (create users via Admin UI)
- First-user bootstrap: the very first registered account becomes admin automatically
- Upload and list files (with public browsing on the home page)
- API keys management UI (generate/revoke) tied to your account
- EJS views + Tailwind (CDN) for styling

## Tech Stack

- Node.js, Express, TypeScript
- MongoDB with Mongoose
- EJS templates with express-ejs-layouts
- express-session + connect-mongo

## Project Structure

```
.
├─ controllers/
├─ middlewares/
├─ models/
├─ routes/
├─ views/
├─ public/
├─ uploads/               # runtime uploads
├─ types/                 # TS typings augmentation
├─ server.ts              # app entry
├─ tsconfig.json
├─ package.json
├─ .env                   # environment (example below)
└─ seeds/
   └─ sample-admin.json   # sample admin user doc
```

## Prerequisites

- Node.js 18+ and npm
- MongoDB running locally or accessible via URI

## Environment

Create a `.env` file in the project root (already present in your repo). Example:

```
MONGODB_URI=mongodb://127.0.0.1:27017/bugscreator_files_ts
SESSION_SECRET="replace_me_with_a_strong_secret"
PORT=2901
```

- `MONGODB_URI`: Mongo connection string
- `SESSION_SECRET`: random string for session signing
- `PORT`: server port

## Install and Run

- Development (auto-reload):

```powershell
npm install
npm run dev
```

- Production build and start:

```powershell
npm run build
npm run start
```

The app will listen on http://localhost:2901 (from `.env`).

## First Admin and Admin UI

- On a fresh database with no users, visit `/auth/register` in the browser. The first account created becomes `admin`.
- After at least one user exists, only admins can access registration and user creation.
- Admin UI is at `/admin/users` (there will be an “Admin” link in the navbar for admins). From there, you can create additional users and see the user list.

## Seeding a Sample Admin User (optional)

If you want to seed a user directly in MongoDB instead of using the first-run registration flow, you can import the provided document using MongoDB Compass or the Mongo shell.

- File: `seeds/sample-admin.json`
- Collection: `users` (inside the database from your `MONGODB_URI`)

### Import via MongoDB Compass

1. Open your database (e.g., `bugscreator_files_ts`).
2. Open the `users` collection (create it if missing).
3. Click “Add Data” → “Import JSON”.
4. Pick `seeds/sample-admin.json`.
5. Import.

Then log in at `/auth/login` using this user’s credentials. If you don’t know the plaintext password for the provided hash, either:
- Use the first-run bootstrap method instead, or
- Create your own user via Admin UI after logging in with a known admin, or
- Replace `passwordHash` in the JSON with a hash you generate (see below).

### Generate a bcrypt hash for your own password

Optionally generate a new hash locally and update the JSON before importing:

```powershell
node -e "require('bcrypt').hash(process.argv[1], 10).then(h=>console.log(h))" "YourStrongPassword123!"
```

Copy the printed hash into the `passwordHash` field of the JSON.

## UI Pages (high level)

- `/` Home: recent public files
- `/auth/login` Login
- `/auth/register` Register (admin-only after the first user exists)
- `/files` Files list
- `/files/upload` Upload (requires login)
- `/auth/api-keys` Manage API keys (requires login)
- `/admin/users` Admin users management (admins only)

## Troubleshooting

- Mongo connection: ensure the database is running and `MONGODB_URI` is correct.
- Session secret: use a long random string in `SESSION_SECRET`.
- Port in use: change `PORT` in `.env` or stop the conflicting process.
- TypeScript build: run `npm run build` and fix any reported errors.

## License

MIT