"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiKeyAuth = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const User_1 = __importDefault(require("../models/User"));
// Token format: userId.keyId.secret
function parseToken(token) {
    if (!token)
        return null;
    const [userId, keyId, secret] = token.split('.');
    if (!userId || !keyId || !secret)
        return null;
    return { userId, keyId, secret };
}
const apiKeyAuth = async (req, _res, next) => {
    try {
        const header = req.headers['x-api-key'] || undefined;
        const query = req.query['api_key'] || undefined;
        const token = header || query;
        const parsed = parseToken(token);
        if (!parsed)
            return next();
        const user = await User_1.default.findById(parsed.userId);
        if (!user)
            return next();
        const key = user.apiKeys.find((k) => k._id?.toString() === parsed.keyId);
        if (!key || key.revoked)
            return next();
        const ok = await bcrypt_1.default.compare(parsed.secret, key.hash);
        if (!ok)
            return next();
        // Attach apiUser to request locals for downstream access checks
        req.apiUser = { id: user.id, username: user.username, keyId: key._id.toString() };
        // touch lastUsed asynchronously
        user.touchApiKey(key._id.toString()).catch(() => void 0);
    }
    catch (_) {
        // swallow errors; treat as no auth
    }
    finally {
        next();
    }
};
exports.apiKeyAuth = apiKeyAuth;
