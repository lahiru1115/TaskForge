import { generateNKeysBetween } from 'fractional-indexing';
import crypto from 'crypto';
import { Types } from 'mongoose';
import { connectDB, disconnectDB } from '../config/db';
import { User, hashPassword, type UserRole } from '../models/User';
import { Task, TASK_STATUSES, type TaskStatus, type TaskPriority } from '../models/Task';
import { Activity, type ActivityType } from '../models/Activity';
import { Comment } from '../models/Comment';
import { LoginEvent } from '../models/LoginEvent';
import { Workspace } from '../models/Workspace';
import { WorkspaceMember, type WorkspaceRole } from '../models/WorkspaceMember';
import { Invite } from '../models/Invite';

// Narrative content (who, what, when) lives in seed-data/*.json. This file
// just resolves key references (e.g. "admin", a task's array index) into
// real documents and simulates a plausible history.
import usersData from './seed-data/users.json';
import workspacesData from './seed-data/workspaces.json';
import membershipsData from './seed-data/memberships.json';
import acmeTasksData from './seed-data/tasks.acme.json';
import sideTasksData from './seed-data/tasks.side.json';
import commentsData from './seed-data/comments.json';
import invitesData from './seed-data/invites.json';

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

function daysFromNow(n: number) {
  return new Date(Date.now() + n * DAY);
}

function ago(hours: number) {
  return new Date(Date.now() - hours * HOUR);
}

type UserId = Types.ObjectId;

type RawTask = {
  title: string;
  description: string;
  priority: string;
  status: string;
  createdBy: string;
  assignedTo: string | null;
  dueDateOffsetDays?: number;
};

type TaskSeed = {
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: Date;
  assignedTo?: UserId | null;
  createdBy: UserId;
  workspace: Types.ObjectId;
};

async function seed() {
  await connectDB();

  await Promise.all([
    User.deleteMany({}),
    Task.deleteMany({}),
    Activity.deleteMany({}),
    Comment.deleteMany({}),
    LoginEvent.deleteMany({}),
    Workspace.deleteMany({}),
    WorkspaceMember.deleteMany({}),
    Invite.deleteMany({}),
  ]);

  // --- Users ---

  const users: Record<string, InstanceType<typeof User>> = {};
  for (const u of usersData) {
    users[u.key] = await User.create({
      name: u.name,
      email: u.email,
      passwordHash: await hashPassword(u.password),
      role: u.role as UserRole,
    });
  }
  const admin = users.admin;
  const jane = users.jane;
  const john = users.john;
  const sarah = users.sarah;

  // --- Workspaces + memberships ---

  const workspaces: Record<string, InstanceType<typeof Workspace>> = {};
  for (const w of workspacesData) {
    workspaces[w.key] = await Workspace.create({
      name: w.name,
      slug: w.slug,
      owner: users[w.owner]._id,
    });
  }

  await WorkspaceMember.insertMany(
    membershipsData.map((m) => ({
      workspace: workspaces[m.workspace]._id,
      user: users[m.user]._id,
      role: m.role as WorkspaceRole,
      status: 'active' as const,
    }))
  );

  // --- Tasks ---

  function buildTasks(raw: RawTask[], workspaceId: Types.ObjectId): TaskSeed[] {
    return raw.map((t) => ({
      title: t.title,
      description: t.description,
      priority: t.priority as TaskPriority,
      status: t.status as TaskStatus,
      createdBy: users[t.createdBy]._id,
      assignedTo: t.assignedTo ? users[t.assignedTo]._id : null,
      dueDate: t.dueDateOffsetDays !== undefined ? daysFromNow(t.dueDateOffsetDays) : undefined,
      workspace: workspaceId,
    }));
  }

  const acmeTasks = buildTasks(acmeTasksData, workspaces.acme._id);
  const sideTasks = buildTasks(sideTasksData, workspaces.side._id);

  // Rank each workspace's tasks independently, grouped by status.
  function assignRanks(taskList: TaskSeed[]) {
    for (const status of TASK_STATUSES) {
      const group = taskList.filter((t) => t.status === status);
      const keys = generateNKeysBetween(null, null, group.length);
      group.forEach((t, i) => {
        (t as TaskSeed & { rank: string }).rank = keys[i];
      });
    }
  }
  assignRanks(acmeTasks);
  assignRanks(sideTasks);

  const insertedAcmeTasks = await Task.insertMany(acmeTasks);
  const insertedSideTasks = await Task.insertMany(sideTasks);
  const tasks = [...acmeTasks, ...sideTasks];

  // --- Activity logs (Acme) ---
  // Simulated timeline, not authored data — status timing is derived from
  // index, not written per task.

  const nameMap: Record<string, string> = {
    [admin._id.toString()]: admin.name,
    [jane._id.toString()]: jane.name,
    [john._id.toString()]: john.name,
    [sarah._id.toString()]: sarah.name,
  };

  function actorName(id: UserId): string {
    return nameMap[id.toString()] ?? 'Unknown';
  }

  type ActivityDoc = {
    task: UserId;
    actor: UserId;
    actorName: string;
    type: ActivityType;
    field?: string;
    from?: string;
    to?: string;
    createdAt: Date;
    workspace: Types.ObjectId;
  };

  const activityDocs: ActivityDoc[] = [];

  function push(doc: ActivityDoc) {
    activityDocs.push(doc);
  }

  insertedAcmeTasks.forEach((task, i) => {
    const s = acmeTasks[i];
    const creator = s.createdBy as UserId;
    const assignee = (s.assignedTo ?? null) as UserId | null;
    const workspace = s.workspace;

    if (s.status === 'open') {
      // Unassigned tasks are brand-new — leave them with no activity so the
      // empty state shows.
      if (!assignee) return;
      const t0 = ago((3 + (i % 10)) * 24);
      push({ task: task._id, actor: creator, actorName: actorName(creator), type: 'created', createdAt: t0, workspace });
      if (i % 3 === 0) {
        push({ task: task._id, actor: admin._id, actorName: 'Admin User', type: 'assigned', to: actorName(assignee), createdAt: new Date(t0.getTime() + 2 * HOUR), workspace });
      }

    } else if (s.status === 'in_progress') {
      // created 10–17 days ago; moved to in_progress 4–7 days ago
      const off = i - 15;
      const t0 = ago((10 + off % 8) * 24);
      const t1 = ago((4 + off % 4) * 24);
      push({ task: task._id, actor: creator, actorName: actorName(creator), type: 'created', createdAt: t0, workspace });
      if (assignee && off % 2 === 0) {
        push({ task: task._id, actor: creator, actorName: actorName(creator), type: 'assigned', to: actorName(assignee), createdAt: new Date(t0.getTime() + 3 * HOUR), workspace });
      }
      if (off % 4 === 1) {
        const prevPriority = s.priority === 'high' ? 'medium' : 'low';
        push({ task: task._id, actor: admin._id, actorName: 'Admin User', type: 'priority_changed', from: prevPriority, to: s.priority, createdAt: new Date(t0.getTime() + 5 * HOUR), workspace });
      }
      push({ task: task._id, actor: assignee ?? creator, actorName: actorName(assignee ?? creator), type: 'status_changed', from: 'open', to: 'in_progress', createdAt: t1, workspace });
      if (off % 3 === 2) {
        push({ task: task._id, actor: creator, actorName: actorName(creator), type: 'edited', field: 'description', createdAt: new Date(t1.getTime() + 4 * HOUR), workspace });
      }

    } else if (s.status === 'testing') {
      // created 18–27 days ago; open→in_progress 12–16 days ago; in_progress→testing 3–5 days ago
      const off = i - 30;
      const t0 = ago((18 + off % 10) * 24);
      const t1 = ago((12 + off % 5) * 24);
      const t2 = ago((3 + off % 3) * 24);
      push({ task: task._id, actor: creator, actorName: actorName(creator), type: 'created', createdAt: t0, workspace });
      if (assignee) {
        push({ task: task._id, actor: admin._id, actorName: 'Admin User', type: 'assigned', to: actorName(assignee), createdAt: new Date(t0.getTime() + HOUR), workspace });
      }
      push({ task: task._id, actor: assignee ?? creator, actorName: actorName(assignee ?? creator), type: 'status_changed', from: 'open', to: 'in_progress', createdAt: t1, workspace });
      if (off % 2 === 0) {
        push({ task: task._id, actor: admin._id, actorName: 'Admin User', type: 'edited', field: 'title', createdAt: new Date(t1.getTime() + 2 * HOUR), workspace });
      }
      push({ task: task._id, actor: assignee ?? creator, actorName: actorName(assignee ?? creator), type: 'status_changed', from: 'in_progress', to: 'testing', createdAt: t2, workspace });

    } else if (s.status === 'done') {
      // created 25–39 days ago; full open→in_progress→testing→done pipeline
      const off = i - 40;
      const t0 = ago((25 + off % 15) * 24);
      const t1 = ago((18 + off % 7) * 24);
      const t2 = ago((9 + off % 5) * 24);
      const t3 = ago((1 + off % 3) * 24);
      push({ task: task._id, actor: creator, actorName: actorName(creator), type: 'created', createdAt: t0, workspace });
      if (assignee) {
        push({ task: task._id, actor: admin._id, actorName: 'Admin User', type: 'assigned', to: actorName(assignee), createdAt: new Date(t0.getTime() + 30 * 60 * 1000), workspace });
      }
      if (off % 3 === 0) {
        const prevPriority = s.priority === 'high' ? 'medium' : (s.priority === 'medium' ? 'low' : 'medium');
        push({ task: task._id, actor: admin._id, actorName: 'Admin User', type: 'priority_changed', from: prevPriority, to: s.priority, createdAt: new Date(t0.getTime() + 2 * HOUR), workspace });
      }
      push({ task: task._id, actor: assignee ?? creator, actorName: actorName(assignee ?? creator), type: 'status_changed', from: 'open', to: 'in_progress', createdAt: t1, workspace });
      if (off % 2 === 1) {
        push({ task: task._id, actor: creator, actorName: actorName(creator), type: 'edited', field: 'description', createdAt: new Date(t1.getTime() + 3 * HOUR), workspace });
      }
      push({ task: task._id, actor: assignee ?? creator, actorName: actorName(assignee ?? creator), type: 'status_changed', from: 'in_progress', to: 'testing', createdAt: t2, workspace });
      push({ task: task._id, actor: admin._id, actorName: 'Admin User', type: 'status_changed', from: 'testing', to: 'done', createdAt: t3, workspace });
    }
  });

  // --- Activity logs (Side Project) — lighter touch: created + one status hop each ---

  insertedSideTasks.forEach((task, i) => {
    const s = sideTasks[i];
    const creator = s.createdBy as UserId;
    const assignee = (s.assignedTo ?? null) as UserId | null;
    const workspace = s.workspace;
    const t0 = ago((2 + i * 3) * 24);

    push({ task: task._id, actor: creator, actorName: actorName(creator), type: 'created', createdAt: t0, workspace });
    if (assignee && s.status !== 'open') {
      push({ task: task._id, actor: creator, actorName: actorName(creator), type: 'assigned', to: actorName(assignee), createdAt: new Date(t0.getTime() + HOUR), workspace });
    }
    if (s.status === 'in_progress') {
      push({ task: task._id, actor: assignee ?? creator, actorName: actorName(assignee ?? creator), type: 'status_changed', from: 'open', to: 'in_progress', createdAt: new Date(t0.getTime() + DAY), workspace });
    } else if (s.status === 'testing') {
      push({ task: task._id, actor: assignee ?? creator, actorName: actorName(assignee ?? creator), type: 'status_changed', from: 'in_progress', to: 'testing', createdAt: new Date(t0.getTime() + 2 * DAY), workspace });
    } else if (s.status === 'done') {
      push({ task: task._id, actor: assignee ?? creator, actorName: actorName(assignee ?? creator), type: 'status_changed', from: 'testing', to: 'done', createdAt: new Date(t0.getTime() + 3 * DAY), workspace });
    }
  });

  await Activity.insertMany(activityDocs);

  // --- Comments ---

  type CommentDoc = {
    task: Types.ObjectId;
    author: Types.ObjectId;
    authorName: string;
    body: string;
    createdAt: Date;
    workspace: Types.ObjectId;
  };

  const commentDocs: CommentDoc[] = commentsData.map((c) => {
    const insertedList = c.workspace === 'acme' ? insertedAcmeTasks : insertedSideTasks;
    const author = users[c.author];
    return {
      task: insertedList[c.taskIndex]._id,
      author: author._id,
      authorName: author.name,
      body: c.body,
      createdAt: ago(c.agoHours),
      workspace: workspaces[c.workspace]._id,
    };
  });

  await Comment.insertMany(commentDocs);

  // --- Invites ---

  for (const inv of invitesData) {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await Invite.create({
      workspace: workspaces[inv.workspace]._id,
      email: inv.email,
      role: inv.role as WorkspaceRole,
      tokenHash,
      invitedBy: users[inv.invitedBy]._id,
      expiresAt: daysFromNow(inv.expiresInDays),
    });
  }

  console.log(
    `✓ Seed complete — ${usersData.length} users, ${workspacesData.length} workspaces, ${tasks.length} tasks (${acmeTasks.length} Acme + ${sideTasks.length} Side), ` +
      `${activityDocs.length} activity entries, ${commentDocs.length} comments, ${invitesData.length} pending invite(s)`
  );
  console.log('  admin@taskforge.com  / admin123  (owner: Acme Product, owner: Side Project)');
  console.log('  jane@taskforge.com   / user1234  (admin: Acme Product, member: Side Project)');
  console.log('  john@taskforge.com   / user1234  (member: Acme Product only)');
  console.log('  sarah@taskforge.com  / user1234  (viewer: Acme Product only)');
  console.log('  Pending invite → mike@taskforge.com (Acme Product, member)');

  await disconnectDB();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
