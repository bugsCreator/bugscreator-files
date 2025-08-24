import mongoose, { Schema, Document, Types } from 'mongoose';

export type AccessType = 'public' | 'private';

export interface IFile extends Document {
  owner: Types.ObjectId;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  slug?: string;
  access: AccessType;
  downloads: number;
  createdAt: Date;
  updatedAt: Date;
}

const FileSchema = new Schema<IFile>(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    path: { type: String, required: true },
  slug: { type: String, unique: true, sparse: true, trim: true, lowercase: true },
    access: { type: String, enum: ['public', 'private'], default: 'private' },
    downloads: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export default mongoose.model<IFile>('File', FileSchema);
