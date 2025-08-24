import mongoose, { Schema, Document, Types } from 'mongoose';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  verifyPassword(password: string): Promise<boolean>;
  apiKeys: Array<{
    _id: Types.ObjectId;
    label?: string;
    hash: string; // bcrypt hash of secret
    createdAt: Date;
    lastUsedAt?: Date;
    revoked: boolean;
  }>;
  generateApiKey(label?: string): Promise<{ token: string; keyId: string }>;
  revokeApiKey(keyId: string): Promise<void>;
  touchApiKey(keyId: string): Promise<void>;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 30 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    apiKeys: [
      new Schema(
        {
          label: { type: String, trim: true },
          hash: { type: String, required: true },
          createdAt: { type: Date, default: Date.now },
          lastUsedAt: { type: Date },
          revoked: { type: Boolean, default: false }
        },
        { _id: true }
      )
    ]
  },
  { timestamps: true }
);

UserSchema.methods.verifyPassword = function (password: string) {
  return bcrypt.compare(password, this.passwordHash);
};

export const hashPassword = async (password: string) => bcrypt.hash(password, 10);

UserSchema.methods.generateApiKey = async function (label?: string) {
  const secret = crypto.randomBytes(24).toString('base64url');
  const hash = await bcrypt.hash(secret, 10);
  this.apiKeys.push({ label, hash, createdAt: new Date(), revoked: false });
  await this.save();
  const key = this.apiKeys[this.apiKeys.length - 1];
  // Token format: userId.keyId.secret
  const token = `${this._id.toString()}.${key._id.toString()}.${secret}`;
  return { token, keyId: key._id.toString() };
};

UserSchema.methods.revokeApiKey = async function (keyId: string) {
  const key = this.apiKeys.id(keyId);
  if (key) {
    key.revoked = true;
    await this.save();
  }
};

UserSchema.methods.touchApiKey = async function (keyId: string) {
  const key = this.apiKeys.id(keyId);
  if (key) {
    key.lastUsedAt = new Date();
    await this.save();
  }
};

export default mongoose.model<IUser>('User', UserSchema);
