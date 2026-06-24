import { Schema, model, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'admin' | 'user';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function (
  this: IUser,
  candidate: string
): Promise<boolean> {
  return bcrypt.compare(candidate, this.passwordHash);
};

export async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

export const User = model<IUser>('User', userSchema);
