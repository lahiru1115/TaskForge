import { Schema, model, Document } from 'mongoose';

export interface ILoginEvent extends Document {
  email: string;
  name: string;
  role: string;
  ip: string;
  userAgent: string;
  isDemoAccount: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const loginEventSchema = new Schema<ILoginEvent>(
  {
    email:         { type: String, required: true },
    name:          { type: String, required: true },
    role:          { type: String, required: true },
    ip:            { type: String, required: true },
    userAgent:     { type: String, required: true },
    isDemoAccount: { type: Boolean, required: true },
  },
  { timestamps: true },
);

// Append-only collection — bound its growth and support the only query shape it needs.
loginEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
loginEventSchema.index({ email: 1, createdAt: -1 });

export const LoginEvent = model<ILoginEvent>('LoginEvent', loginEventSchema);
