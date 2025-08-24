import 'express-session';

declare module 'express-session' {
  interface SessionData {
    user?: { id: string; username: string };
    flash?: { type: 'success' | 'error'; message: string };
  }
}
