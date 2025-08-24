import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import User from '../models/User';

// Token format: userId.keyId.secret
function parseToken(token: string | undefined) {
  if (!token) return null;
  const [userId, keyId, secret] = token.split('.');
  if (!userId || !keyId || !secret) return null;
  return { userId, keyId, secret };
}

export const apiKeyAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const header = (req.headers['x-api-key'] as string) || undefined;
    const query = (req.query['api_key'] as string) || undefined;
    const token = header || query;
    const parsed = parseToken(token);
    if (!parsed) return next();

    const user = await User.findById(parsed.userId);
    if (!user) return next();
  const key = user.apiKeys.find((k: any) => k._id?.toString() === parsed.keyId);
    if (!key || key.revoked) return next();
    const ok = await bcrypt.compare(parsed.secret, key.hash);
    if (!ok) return next();

    // Attach apiUser to request locals for downstream access checks
  (req as any).apiUser = { id: user.id, username: user.username, keyId: key._id.toString() };
  // touch lastUsed asynchronously
  user.touchApiKey(key._id.toString()).catch(() => void 0);
  } catch (_) {
    // swallow errors; treat as no auth
  } finally {
    next();
  }
};
