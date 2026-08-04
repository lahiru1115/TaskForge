import { Schema, model, Document } from 'mongoose';

export interface IMigration extends Document {
  name: string;
  appliedAt: Date;
}

const migrationSchema = new Schema<IMigration>({
  name: { type: String, required: true, unique: true },
  appliedAt: { type: Date, required: true },
});

export const Migration = model<IMigration>('Migration', migrationSchema);
