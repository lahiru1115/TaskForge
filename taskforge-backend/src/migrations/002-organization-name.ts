import mongoose from 'mongoose';
import { Workspace } from '../models/Workspace';
import type { MigrationModule } from './runner';

async function up(): Promise<void> {
  // Raw collection, not the Mongoose Model — the current schema no longer
  // declares `name`, and Mongoose's strict-mode update sanitization silently
  // drops $rename operators that reference undeclared paths, so
  // Workspace.updateMany(...) here would appear to succeed (and even touch
  // `updatedAt` via the timestamps option) while doing nothing at all.
  const raw = mongoose.connection.db!.collection('workspaces');

  const renameResult = await raw.updateMany(
    { workspaceName: { $exists: false }, name: { $exists: true } },
    { $rename: { name: 'workspaceName' } }
  );
  console.log(`  Renamed name -> workspaceName on ${renameResult.modifiedCount} workspace(s).`);

  // No real "organization" data existed before this field — default it to the
  // workspace's own name, the least-surprising value an owner can rename later.
  // Aggregation-pipeline update: one atomic pass referencing another field's
  // value, no read-then-write round trip.
  const backfillResult = await raw.updateMany({ organizationName: { $exists: false } }, [
    { $set: { organizationName: '$workspaceName' } },
  ]);
  console.log(
    `  Backfilled organizationName on ${backfillResult.modifiedCount} workspace(s) (defaulted to workspaceName).`
  );

  const remaining = await Workspace.countDocuments({
    $or: [{ workspaceName: { $exists: false } }, { organizationName: { $exists: false } }],
  });
  if (remaining > 0) {
    throw new Error(
      `Verification failed: ${remaining} workspace(s) still missing workspaceName or organizationName.`
    );
  }
}

const migration: MigrationModule = { name: '002-organization-name', up };
export default migration;
