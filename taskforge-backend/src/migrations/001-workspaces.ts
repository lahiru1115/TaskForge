import { User } from '../models/User';
import { Task } from '../models/Task';
import { Comment } from '../models/Comment';
import { Activity } from '../models/Activity';
import { Workspace } from '../models/Workspace';
import { WorkspaceMember, WorkspaceRole } from '../models/WorkspaceMember';
import type { MigrationModule } from './runner';

const DEFAULT_WORKSPACE = { name: 'TaskForge', slug: 'taskforge' };

async function up(): Promise<void> {
  const users = await User.find().sort({ createdAt: 1 });
  if (users.length === 0) {
    console.log('  No users found — nothing to migrate.');
    return;
  }

  // Prefer the first admin as owner; fall back to the very first user on an admin-less DB.
  const owner = users.find((u) => u.role === 'admin') ?? users[0];

  // Upsert, not insert — safe to re-run if a previous attempt got this far but never wrote the stamp.
  const workspace = await Workspace.findOneAndUpdate(
    { slug: DEFAULT_WORKSPACE.slug },
    { $setOnInsert: { name: DEFAULT_WORKSPACE.name, slug: DEFAULT_WORKSPACE.slug, owner: owner._id } },
    { upsert: true, returnDocument: 'after' }
  );
  console.log(`  Workspace "${workspace.name}" (${workspace.slug}) ready — owner ${owner.email}`);

  const memberOps = users.map((u) => {
    let role: WorkspaceRole;
    if (u._id.equals(owner._id)) role = 'owner';
    else if (u.role === 'admin') role = 'admin';
    else role = 'member';

    return {
      updateOne: {
        filter: { workspace: workspace._id, user: u._id },
        update: { $setOnInsert: { workspace: workspace._id, user: u._id, role, status: 'active' as const } },
        upsert: true,
      },
    };
  });
  const memberResult = await WorkspaceMember.bulkWrite(memberOps);
  console.log(
    `  ${memberResult.upsertedCount} workspace membership(s) created (${users.length - memberResult.upsertedCount} already existed).`
  );

  const taskResult = await Task.updateMany(
    { workspace: { $exists: false } },
    { $set: { workspace: workspace._id } }
  );
  console.log(`  Task: backfilled ${taskResult.modifiedCount} document(s).`);

  const commentResult = await Comment.updateMany(
    { workspace: { $exists: false } },
    { $set: { workspace: workspace._id } }
  );
  console.log(`  Comment: backfilled ${commentResult.modifiedCount} document(s).`);

  const activityResult = await Activity.updateMany(
    { workspace: { $exists: false } },
    { $set: { workspace: workspace._id } }
  );
  console.log(`  Activity: backfilled ${activityResult.modifiedCount} document(s).`);

  const [orphanTasks, orphanComments, orphanActivities] = await Promise.all([
    Task.countDocuments({ workspace: { $exists: false } }),
    Comment.countDocuments({ workspace: { $exists: false } }),
    Activity.countDocuments({ workspace: { $exists: false } }),
  ]);
  const orphanTotal = orphanTasks + orphanComments + orphanActivities;
  if (orphanTotal > 0) {
    // Thrown, not process.exit(1) — this file doesn't own the connection or
    // exit code; the runner does.
    throw new Error(
      `Verification failed: ${orphanTotal} document(s) still missing workspace ` +
        `(Task=${orphanTasks}, Comment=${orphanComments}, Activity=${orphanActivities}).`
    );
  }
}

const migration: MigrationModule = { name: '001-workspaces', up };
export default migration;
