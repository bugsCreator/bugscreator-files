"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
const UserSchema = new mongoose_1.Schema({
    username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 30 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
    apiKeys: [
        new mongoose_1.Schema({
            label: { type: String, trim: true },
            hash: { type: String, required: true },
            createdAt: { type: Date, default: Date.now },
            lastUsedAt: { type: Date },
            revoked: { type: Boolean, default: false }
        }, { _id: true })
    ]
}, { timestamps: true });
UserSchema.methods.verifyPassword = function (password) {
    return bcrypt_1.default.compare(password, this.passwordHash);
};
const hashPassword = async (password) => bcrypt_1.default.hash(password, 10);
exports.hashPassword = hashPassword;
UserSchema.methods.generateApiKey = async function (label) {
    const secret = crypto_1.default.randomBytes(24).toString('base64url');
    const hash = await bcrypt_1.default.hash(secret, 10);
    this.apiKeys.push({ label, hash, createdAt: new Date(), revoked: false });
    await this.save();
    const key = this.apiKeys[this.apiKeys.length - 1];
    // Token format: userId.keyId.secret
    const token = `${this._id.toString()}.${key._id.toString()}.${secret}`;
    return { token, keyId: key._id.toString() };
};
UserSchema.methods.revokeApiKey = async function (keyId) {
    const key = this.apiKeys.id(keyId);
    if (key) {
        key.revoked = true;
        await this.save();
    }
};
UserSchema.methods.touchApiKey = async function (keyId) {
    const key = this.apiKeys.id(keyId);
    if (key) {
        key.lastUsedAt = new Date();
        await this.save();
    }
};
exports.default = mongoose_1.default.model('User', UserSchema);
