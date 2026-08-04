import { generateNKeysBetween } from 'fractional-indexing';
import { connectDB, disconnectDB } from '../config/db';
import { User, hashPassword } from '../models/User';
import { Task, TASK_STATUSES, type TaskStatus, type TaskPriority } from '../models/Task';
import { Activity, type ActivityType } from '../models/Activity';
import { Comment } from '../models/Comment';
import { LoginEvent } from '../models/LoginEvent';

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

function daysFromNow(n: number) {
  return new Date(Date.now() + n * DAY);
}

function ago(hours: number) {
  return new Date(Date.now() - hours * HOUR);
}

async function seed() {
  await connectDB();

  await User.deleteMany({});
  await Task.deleteMany({});
  await Activity.deleteMany({});
  await Comment.deleteMany({});
  await LoginEvent.deleteMany({});

  const [adminHash, janeHash, johnHash, sarahHash] = await Promise.all([
    hashPassword('admin123'),
    hashPassword('user1234'),
    hashPassword('user1234'),
    hashPassword('user1234'),
  ]);

  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@taskforge.com',
    passwordHash: adminHash,
    role: 'admin',
  });

  const jane = await User.create({
    name: 'Jane Doe',
    email: 'jane@taskforge.com',
    passwordHash: janeHash,
    role: 'user',
  });

  const john = await User.create({
    name: 'John Smith',
    email: 'john@taskforge.com',
    passwordHash: johnHash,
    role: 'user',
  });

  const sarah = await User.create({
    name: 'Sarah Johnson',
    email: 'sarah@taskforge.com',
    passwordHash: sarahHash,
    role: 'user',
  });

  type UserId = typeof admin._id;
  type TaskSeed = {
    title: string;
    description: string;
    priority: TaskPriority;
    status: TaskStatus;
    dueDate?: Date;
    assignedTo?: UserId | null;
    createdBy: UserId;
  };

  const tasks: TaskSeed[] = [
    // --- OPEN (15) ---
    {
      title: 'Set up monorepo with Turborepo',
      description: 'Configure shared packages, lint, and build caching across all workspaces.',
      priority: 'high', status: 'open', createdBy: admin._id, assignedTo: john._id,
      dueDate: daysFromNow(10),
    },
    {
      title: 'Design system color tokens',
      description: 'Define semantic color variables for light/dark mode across all components.',
      priority: 'medium', status: 'open', createdBy: admin._id, assignedTo: sarah._id,
      dueDate: daysFromNow(7),
    },
    {
      title: 'Write onboarding documentation',
      description: 'Create a getting-started guide for new engineers joining the team.',
      priority: 'low', status: 'open', createdBy: jane._id, assignedTo: null,
    },
    {
      title: 'Implement rate limiting on API',
      description: 'Add per-IP and per-user rate limits to all public endpoints using express-rate-limit.',
      priority: 'high', status: 'open', createdBy: admin._id, assignedTo: john._id,
      dueDate: daysFromNow(5),
    },
    {
      title: 'Add CSV export for task list',
      description: 'Allow users to download their filtered task list as a CSV file.',
      priority: 'medium', status: 'open', createdBy: jane._id, assignedTo: jane._id,
      dueDate: daysFromNow(14),
    },
    {
      title: 'Integrate Sentry for error tracking',
      description: 'Set up Sentry in both frontend and backend, configure source maps and alerts.',
      priority: 'medium', status: 'open', createdBy: admin._id, assignedTo: null,
    },
    {
      title: 'Add email notification on task assignment',
      description: 'Send an email to the assigned user whenever a task is assigned or reassigned.',
      priority: 'low', status: 'open', createdBy: admin._id, assignedTo: sarah._id,
      dueDate: daysFromNow(21),
    },
    {
      title: 'Implement task commenting',
      description: 'Allow team members to leave threaded comments on individual tasks.',
      priority: 'medium', status: 'open', createdBy: jane._id, assignedTo: null,
    },
    {
      title: 'Upgrade Node.js to v22 LTS',
      description: 'Update runtime version across all services, CI pipelines, and Docker images.',
      priority: 'low', status: 'open', createdBy: admin._id, assignedTo: john._id,
    },
    {
      title: 'Add two-factor authentication',
      description: 'Implement TOTP-based 2FA with QR code enrollment and recovery codes.',
      priority: 'high', status: 'open', createdBy: admin._id, assignedTo: null,
      dueDate: daysFromNow(30),
    },
    {
      title: 'Build activity feed for tasks',
      description: 'Show a timeline of status changes, comments, and edits on each task detail page.',
      priority: 'medium', status: 'open', createdBy: jane._id, assignedTo: sarah._id,
      dueDate: daysFromNow(12),
    },
    {
      title: 'Add keyboard shortcuts guide',
      description: 'Create a modal listing all available keyboard shortcuts accessible with ?.',
      priority: 'low', status: 'open', createdBy: jane._id, assignedTo: null,
    },
    {
      title: 'Set up Playwright end-to-end tests',
      description: 'Write E2E tests covering auth flow, task CRUD, and Kanban drag interactions.',
      priority: 'high', status: 'open', createdBy: admin._id, assignedTo: john._id,
      dueDate: daysFromNow(8),
    },
    {
      title: 'Add pagination to task list API',
      description: 'Implement cursor-based pagination as an alternative to offset for large datasets.',
      priority: 'medium', status: 'open', createdBy: admin._id, assignedTo: null,
    },
    {
      title: 'Create admin user management page',
      description: 'Allow admins to view all users, change roles, and deactivate accounts.',
      priority: 'medium', status: 'open', createdBy: admin._id, assignedTo: sarah._id,
      dueDate: daysFromNow(18),
    },

    // --- IN PROGRESS (15) ---
    {
      title: 'Migrate database to MongoDB Atlas',
      description: 'Move local MongoDB instance to Atlas M0 free tier, update connection strings.',
      priority: 'high', status: 'in_progress', createdBy: admin._id, assignedTo: admin._id,
      dueDate: daysFromNow(3),
    },
    {
      title: 'Implement dark mode toggle',
      description: 'Persist theme preference to localStorage, avoid flash on page load.',
      priority: 'medium', status: 'in_progress', createdBy: jane._id, assignedTo: sarah._id,
      dueDate: daysFromNow(2),
    },
    {
      title: 'Refactor authentication middleware',
      description: 'Extract role-checking logic into reusable guards, add unit tests.',
      priority: 'high', status: 'in_progress', createdBy: admin._id, assignedTo: john._id,
      dueDate: daysFromNow(4),
    },
    {
      title: 'Build responsive navbar',
      description: 'Collapse navigation into a hamburger menu on mobile, add smooth transitions.',
      priority: 'medium', status: 'in_progress', createdBy: jane._id, assignedTo: sarah._id,
    },
    {
      title: 'Add drag-and-drop file attachments',
      description: 'Allow users to attach files to tasks, store in S3-compatible object storage.',
      priority: 'low', status: 'in_progress', createdBy: admin._id, assignedTo: john._id,
      dueDate: daysFromNow(9),
    },
    {
      title: 'Implement search with debounce',
      description: 'Add 300ms debounce to the task search input to reduce unnecessary API calls.',
      priority: 'medium', status: 'in_progress', createdBy: jane._id, assignedTo: jane._id,
      dueDate: daysFromNow(1),
    },
    {
      title: 'Set up CI/CD with GitHub Actions',
      description: 'Automate type-check, build, and deploy steps on push to main.',
      priority: 'high', status: 'in_progress', createdBy: admin._id, assignedTo: admin._id,
      dueDate: daysFromNow(6),
    },
    {
      title: 'Add skeleton loading states',
      description: 'Replace spinner placeholders with skeleton screens on dashboard and task list.',
      priority: 'low', status: 'in_progress', createdBy: jane._id, assignedTo: sarah._id,
    },
    {
      title: 'Optimise Mongoose queries with indexes',
      description: 'Analyse slow query logs, add compound indexes for common filter combinations.',
      priority: 'medium', status: 'in_progress', createdBy: admin._id, assignedTo: john._id,
      dueDate: daysFromNow(5),
    },
    {
      title: 'Implement JWT refresh token flow',
      description: 'Add refresh tokens with sliding expiry, rotate on use, revoke on logout.',
      priority: 'high', status: 'in_progress', createdBy: admin._id, assignedTo: admin._id,
      dueDate: daysFromNow(7),
    },
    {
      title: 'Add toast notifications system',
      description: 'Integrate Sonner for success and error toasts across all mutations.',
      priority: 'low', status: 'in_progress', createdBy: jane._id, assignedTo: sarah._id,
      dueDate: daysFromNow(2),
    },
    {
      title: 'Build dashboard statistics cards',
      description: 'Show task counts by status and priority with clickable filter shortcuts.',
      priority: 'medium', status: 'in_progress', createdBy: admin._id, assignedTo: john._id,
    },
    {
      title: 'Implement bulk task update',
      description: 'Allow selecting multiple tasks and changing status or assignee in one action.',
      priority: 'high', status: 'in_progress', createdBy: admin._id, assignedTo: admin._id,
      dueDate: daysFromNow(11),
    },
    {
      title: 'Create reusable form components',
      description: 'Extract shared form fields, validation messages, and date pickers into a library.',
      priority: 'medium', status: 'in_progress', createdBy: jane._id, assignedTo: jane._id,
      dueDate: daysFromNow(4),
    },
    {
      title: 'Add overdue task highlighting',
      description: 'Highlight tasks past their due date in red across all views.',
      priority: 'low', status: 'in_progress', createdBy: jane._id, assignedTo: sarah._id,
    },

    // --- TESTING (10) ---
    {
      title: 'Fix login redirect after session expiry',
      description: 'After token expiry, users are sent to /login but lose their intended destination URL.',
      priority: 'high', status: 'testing', createdBy: admin._id, assignedTo: john._id,
      dueDate: daysFromNow(-1),
    },
    {
      title: 'Verify task assignment email delivery',
      description: 'Check email rendering, delivery rate, and unsubscribe link across mail clients.',
      priority: 'medium', status: 'testing', createdBy: admin._id, assignedTo: sarah._id,
      dueDate: daysFromNow(2),
    },
    {
      title: 'Test Kanban drag on mobile devices',
      description: 'Verify touch drag works correctly on iOS Safari and Android Chrome.',
      priority: 'high', status: 'testing', createdBy: jane._id, assignedTo: jane._id,
      dueDate: daysFromNow(1),
    },
    {
      title: 'Validate Zod schemas against edge cases',
      description: 'Run fuzz tests on all API validators, check boundary values and Unicode inputs.',
      priority: 'medium', status: 'testing', createdBy: admin._id, assignedTo: john._id,
    },
    {
      title: 'Cross-browser compatibility check',
      description: 'Test app in Chrome, Firefox, Safari, and Edge. Fix any rendering differences.',
      priority: 'medium', status: 'testing', createdBy: jane._id, assignedTo: sarah._id,
      dueDate: daysFromNow(3),
    },
    {
      title: 'Load test API under concurrent requests',
      description: 'Use k6 to simulate 500 concurrent users, identify bottlenecks and memory leaks.',
      priority: 'high', status: 'testing', createdBy: admin._id, assignedTo: admin._id,
      dueDate: daysFromNow(-2),
    },
    {
      title: 'Test role-based access control',
      description: 'Verify admins see all tasks and regular users only see their own across all endpoints.',
      priority: 'high', status: 'testing', createdBy: admin._id, assignedTo: john._id,
      dueDate: daysFromNow(1),
    },
    {
      title: 'Accessibility audit with screen reader',
      description: 'Test all interactive elements with NVDA and VoiceOver, fix ARIA label issues.',
      priority: 'medium', status: 'testing', createdBy: jane._id, assignedTo: sarah._id,
    },
    {
      title: 'Validate dark mode across all pages',
      description: 'Check color contrast ratios and component rendering in dark mode throughout the app.',
      priority: 'low', status: 'testing', createdBy: jane._id, assignedTo: jane._id,
      dueDate: daysFromNow(2),
    },
    {
      title: 'Regression test after middleware refactor',
      description: 'Run the full manual test checklist after extracting authentication middleware.',
      priority: 'high', status: 'testing', createdBy: admin._id, assignedTo: admin._id,
      dueDate: daysFromNow(-1),
    },

    // --- DONE (10) ---
    {
      title: 'Initialise project repository',
      description: 'Create monorepo structure, add .gitignore, README, and initial package.json files.',
      priority: 'high', status: 'done', createdBy: admin._id, assignedTo: admin._id,
    },
    {
      title: 'Set up Express server with TypeScript',
      description: 'Scaffold backend with tsx watch, tsconfig, and hello-world health check endpoint.',
      priority: 'high', status: 'done', createdBy: admin._id, assignedTo: john._id,
    },
    {
      title: 'Design User and Task Mongoose schemas',
      description: 'Define fields, enums, indexes, and timestamps for User and Task models.',
      priority: 'high', status: 'done', createdBy: admin._id, assignedTo: admin._id,
    },
    {
      title: 'Implement JWT authentication',
      description: 'Build register, login, and /me endpoints with bcrypt password hashing.',
      priority: 'high', status: 'done', createdBy: admin._id, assignedTo: john._id,
    },
    {
      title: 'Build task CRUD endpoints',
      description: 'Implement list, create, get, update, and delete with role-scoped visibility.',
      priority: 'high', status: 'done', createdBy: admin._id, assignedTo: admin._id,
    },
    {
      title: 'Set up Vite React frontend',
      description: 'Scaffold with Vite, configure Tailwind, shadcn/ui, React Router, and TanStack Query.',
      priority: 'high', status: 'done', createdBy: admin._id, assignedTo: sarah._id,
    },
    {
      title: 'Build login and register pages',
      description: 'Implement split-panel auth pages with React Hook Form and Zod validation.',
      priority: 'medium', status: 'done', createdBy: jane._id, assignedTo: sarah._id,
    },
    {
      title: 'Implement task list with filters',
      description: 'Build table and card views with search, status, priority, and assignee filters.',
      priority: 'high', status: 'done', createdBy: jane._id, assignedTo: jane._id,
    },
    {
      title: 'Add Kanban board with drag and drop',
      description: 'Build /board route with @dnd-kit/sortable, fractional-index ranking, and live preview.',
      priority: 'high', status: 'done', createdBy: admin._id, assignedTo: admin._id,
    },
    {
      title: 'Write seed script with sample data',
      description: 'Create admin and regular user accounts with 50 sample tasks across all statuses.',
      priority: 'low', status: 'done', createdBy: admin._id, assignedTo: admin._id,
    },
  ];

  // Group tasks by status and generate fractional-index ranks per group
  for (const status of TASK_STATUSES) {
    const group = tasks.filter((t) => t.status === status);
    const keys = generateNKeysBetween(null, null, group.length);
    group.forEach((t, i) => {
      (t as TaskSeed & { rank: string }).rank = keys[i];
    });
  }

  const insertedTasks = await Task.insertMany(tasks);

  // --- Activity logs ---

  const nameMap: Record<string, string> = {
    [admin._id.toString()]: 'Admin User',
    [jane._id.toString()]: 'Jane Doe',
    [john._id.toString()]: 'John Smith',
    [sarah._id.toString()]: 'Sarah Johnson',
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
  };

  const activityDocs: ActivityDoc[] = [];

  function push(doc: ActivityDoc) {
    activityDocs.push(doc);
  }

  insertedTasks.forEach((task, i) => {
    const s = tasks[i];
    const creator = s.createdBy as UserId;
    const assignee = (s.assignedTo ?? null) as UserId | null;

    if (s.status === 'open') {
      // Tasks without an assignee are brand-new — leave them with no activity
      // so the "No activity yet." empty state is visible in the UI.
      if (!assignee) return;
      const t0 = ago((3 + (i % 10)) * 24);
      push({ task: task._id, actor: creator, actorName: actorName(creator), type: 'created', createdAt: t0 });
      if (i % 3 === 0) {
        push({ task: task._id, actor: admin._id, actorName: 'Admin User', type: 'assigned', to: actorName(assignee), createdAt: new Date(t0.getTime() + 2 * HOUR) });
      }

    } else if (s.status === 'in_progress') {
      // created 10–17 days ago; moved to in_progress 4–7 days ago
      const off = i - 15;
      const t0 = ago((10 + off % 8) * 24);
      const t1 = ago((4 + off % 4) * 24);
      push({ task: task._id, actor: creator, actorName: actorName(creator), type: 'created', createdAt: t0 });
      if (assignee && off % 2 === 0) {
        push({ task: task._id, actor: creator, actorName: actorName(creator), type: 'assigned', to: actorName(assignee), createdAt: new Date(t0.getTime() + 3 * HOUR) });
      }
      if (off % 4 === 1) {
        const prevPriority = s.priority === 'high' ? 'medium' : 'low';
        push({ task: task._id, actor: admin._id, actorName: 'Admin User', type: 'priority_changed', from: prevPriority, to: s.priority, createdAt: new Date(t0.getTime() + 5 * HOUR) });
      }
      push({ task: task._id, actor: assignee ?? creator, actorName: actorName(assignee ?? creator), type: 'status_changed', from: 'open', to: 'in_progress', createdAt: t1 });
      if (off % 3 === 2) {
        push({ task: task._id, actor: creator, actorName: actorName(creator), type: 'edited', field: 'description', createdAt: new Date(t1.getTime() + 4 * HOUR) });
      }

    } else if (s.status === 'testing') {
      // created 18–27 days ago; open→in_progress 12–16 days ago; in_progress→testing 3–5 days ago
      const off = i - 30;
      const t0 = ago((18 + off % 10) * 24);
      const t1 = ago((12 + off % 5) * 24);
      const t2 = ago((3 + off % 3) * 24);
      push({ task: task._id, actor: creator, actorName: actorName(creator), type: 'created', createdAt: t0 });
      if (assignee) {
        push({ task: task._id, actor: admin._id, actorName: 'Admin User', type: 'assigned', to: actorName(assignee), createdAt: new Date(t0.getTime() + HOUR) });
      }
      push({ task: task._id, actor: assignee ?? creator, actorName: actorName(assignee ?? creator), type: 'status_changed', from: 'open', to: 'in_progress', createdAt: t1 });
      if (off % 2 === 0) {
        push({ task: task._id, actor: admin._id, actorName: 'Admin User', type: 'edited', field: 'title', createdAt: new Date(t1.getTime() + 2 * HOUR) });
      }
      push({ task: task._id, actor: assignee ?? creator, actorName: actorName(assignee ?? creator), type: 'status_changed', from: 'in_progress', to: 'testing', createdAt: t2 });

    } else if (s.status === 'done') {
      // created 25–39 days ago; full open→in_progress→testing→done pipeline
      const off = i - 40;
      const t0 = ago((25 + off % 15) * 24);
      const t1 = ago((18 + off % 7) * 24);
      const t2 = ago((9 + off % 5) * 24);
      const t3 = ago((1 + off % 3) * 24);
      push({ task: task._id, actor: creator, actorName: actorName(creator), type: 'created', createdAt: t0 });
      if (assignee) {
        push({ task: task._id, actor: admin._id, actorName: 'Admin User', type: 'assigned', to: actorName(assignee), createdAt: new Date(t0.getTime() + 30 * 60 * 1000) });
      }
      if (off % 3 === 0) {
        const prevPriority = s.priority === 'high' ? 'medium' : (s.priority === 'medium' ? 'low' : 'medium');
        push({ task: task._id, actor: admin._id, actorName: 'Admin User', type: 'priority_changed', from: prevPriority, to: s.priority, createdAt: new Date(t0.getTime() + 2 * HOUR) });
      }
      push({ task: task._id, actor: assignee ?? creator, actorName: actorName(assignee ?? creator), type: 'status_changed', from: 'open', to: 'in_progress', createdAt: t1 });
      if (off % 2 === 1) {
        push({ task: task._id, actor: creator, actorName: actorName(creator), type: 'edited', field: 'description', createdAt: new Date(t1.getTime() + 3 * HOUR) });
      }
      push({ task: task._id, actor: assignee ?? creator, actorName: actorName(assignee ?? creator), type: 'status_changed', from: 'in_progress', to: 'testing', createdAt: t2 });
      push({ task: task._id, actor: admin._id, actorName: 'Admin User', type: 'status_changed', from: 'testing', to: 'done', createdAt: t3 });
    }
  });

  await Activity.insertMany(activityDocs);

  // --- Comments ---
  // Indices reference insertedTasks positions (0-14 open, 15-29 in_progress, 30-39 testing, 40-49 done)

  type CommentDoc = {
    task: typeof admin._id;
    author: typeof admin._id;
    authorName: string;
    body: string;
    createdAt: Date;
  };

  const commentDocs: CommentDoc[] = [
    // Task 0 — "Set up monorepo with Turborepo" (open)
    { task: insertedTasks[0]._id, author: admin._id, authorName: 'Admin User', body: 'Should we also set up shared TypeScript configs in packages/tsconfig? That would save duplication across workspaces.', createdAt: ago(48) },
    { task: insertedTasks[0]._id, author: john._id, authorName: 'John Smith', body: 'Good idea. I\'ll add a base tsconfig and extend from it. Also considering remote caching with Turborepo — worth discussing.', createdAt: ago(36) },
    { task: insertedTasks[0]._id, author: admin._id, authorName: 'Admin User', body: 'Agreed on remote caching. Let\'s use Vercel\'s built-in cache for now and revisit if we hit limits.', createdAt: ago(24) },

    // Task 3 — "Implement rate limiting on API" (open)
    { task: insertedTasks[3]._id, author: jane._id, authorName: 'Jane Doe', body: 'Should we apply different limits per role? Admins probably need higher thresholds than regular users.', createdAt: ago(6) },
    { task: insertedTasks[3]._id, author: admin._id, authorName: 'Admin User', body: 'Good point. Let\'s go with 100 req/min for users and 500 for admins. We can tighten later based on usage.', createdAt: ago(4) },

    // Task 15 — "Migrate database to MongoDB Atlas" (in_progress)
    { task: insertedTasks[15]._id, author: john._id, authorName: 'John Smith', body: 'Connection string updated in all environments. The M0 free tier has a 512 MB limit — worth keeping an eye on once real data comes in.', createdAt: ago(10) },
    { task: insertedTasks[15]._id, author: admin._id, authorName: 'Admin User', body: 'Already on it. Set up Atlas monitoring alerts at 80% capacity. Should be fine for the foreseeable future.', createdAt: ago(7) },
    { task: insertedTasks[15]._id, author: sarah._id, authorName: 'Sarah Johnson', body: 'Dev environment is connecting fine. Actually noticing lower latency compared to the local instance — nice side effect.', createdAt: ago(3) },

    // Task 17 — "Refactor authentication middleware" (in_progress)
    { task: insertedTasks[17]._id, author: admin._id, authorName: 'Admin User', body: 'Make sure the new guards are composable — we\'ll need to stack role checks on some routes without duplicating logic.', createdAt: ago(12) },
    { task: insertedTasks[17]._id, author: john._id, authorName: 'John Smith', body: 'Implemented as higher-order functions. You can now do requireRole(\'admin\') or requireRole(\'admin\', \'manager\'). PR is up for review.', createdAt: ago(8) },

    // Task 20 — "Implement search with debounce" (in_progress)
    { task: insertedTasks[20]._id, author: jane._id, authorName: 'Jane Doe', body: '300ms feels right for the debounce. Should we also cancel the previous in-flight request when a new one fires?', createdAt: ago(50) },
    { task: insertedTasks[20]._id, author: admin._id, authorName: 'Admin User', body: 'TanStack Query handles that automatically with the right queryKey setup — no need for manual AbortControllers.', createdAt: ago(46) },
    { task: insertedTasks[20]._id, author: jane._id, authorName: 'Jane Doe', body: 'Confirmed, works perfectly. Closing the loop on this one — ready for testing.', createdAt: ago(2) },

    // Task 30 — "Fix login redirect after session expiry" (testing)
    { task: insertedTasks[30]._id, author: john._id, authorName: 'John Smith', body: 'Reproduced consistently. The redirect to /login clears router state, losing the intended destination. Saving the URL to sessionStorage before redirecting should fix it.', createdAt: ago(20) },
    { task: insertedTasks[30]._id, author: sarah._id, authorName: 'Sarah Johnson', body: 'Confirmed fix works in my local testing. Also verified with expired tokens — redirect happens cleanly and the user lands back on the right page after re-login.', createdAt: ago(10) },
    { task: insertedTasks[30]._id, author: admin._id, authorName: 'Admin User', body: 'Good catch on the approach. Just make sure the saved URL is validated before redirect to avoid open redirect vulnerabilities.', createdAt: ago(5) },

    // Task 32 — "Test Kanban drag on mobile devices" (testing)
    { task: insertedTasks[32]._id, author: jane._id, authorName: 'Jane Doe', body: 'iOS Safari passes all scenarios. Android Chrome has a slight delay on initial grab — possibly the touch activation constraint being too tight. Testing with 150ms now.', createdAt: ago(16) },
    { task: insertedTasks[32]._id, author: john._id, authorName: 'John Smith', body: '150ms feels much better on Android. Still seeing occasional snap-back on fast swipes — investigating if it\'s a collision detection issue.', createdAt: ago(8) },

    // Task 35 — "Load test API under concurrent requests" (testing)
    { task: insertedTasks[35]._id, author: admin._id, authorName: 'Admin User', body: 'First k6 run peaked at 420 concurrent users before response times degraded. The bottleneck appears to be in the task list query — no index on the composite filter fields.', createdAt: ago(30) },
    { task: insertedTasks[35]._id, author: john._id, authorName: 'John Smith', body: 'Added compound index on { status, priority, assignedTo }. Re-running the load test — early numbers look much better.', createdAt: ago(18) },
    { task: insertedTasks[35]._id, author: admin._id, authorName: 'Admin User', body: 'Second run hit 500 concurrent users with p99 under 200ms. That\'s acceptable for now. Marking ready to merge.', createdAt: ago(6) },

    // Task 43 — "Implement JWT authentication" (done)
    { task: insertedTasks[43]._id, author: admin._id, authorName: 'Admin User', body: 'Great work using HttpOnly cookies instead of localStorage. Remember we\'ll need to set SameSite=None when deploying frontend and backend to separate domains.', createdAt: ago(240) },
    { task: insertedTasks[43]._id, author: john._id, authorName: 'John Smith', body: 'Already noted in the deployment checklist. Will flip the flag in the auth controller when we set up the prod environment.', createdAt: ago(235) },

    // Task 48 — "Add Kanban board with drag and drop" (done)
    { task: insertedTasks[48]._id, author: sarah._id, authorName: 'Sarah Johnson', body: 'The fractional indexing approach for rank is clever — avoids reindexing the entire column on every move. Nice.', createdAt: ago(120) },
    { task: insertedTasks[48]._id, author: admin._id, authorName: 'Admin User', body: 'Touch support was the tricky part. The 200ms delay on TouchSensor is the sweet spot between accidental drags and intentional ones.', createdAt: ago(100) },
    { task: insertedTasks[48]._id, author: jane._id, authorName: 'Jane Doe', body: 'Tested on iPad and it\'s smooth. One minor thing — the drag overlay shadow could be slightly stronger for better depth perception. Could be a follow-up.', createdAt: ago(80) },
  ];

  await Comment.insertMany(commentDocs);

  console.log(`✓ Seed complete — 4 users, 50 tasks, ${activityDocs.length} activity entries, ${commentDocs.length} comments created`);
  console.log('  admin@taskforge.com  / admin123  (role: admin)');
  console.log('  jane@taskforge.com   / user1234  (role: user)');
  console.log('  john@taskforge.com   / user1234  (role: user)');
  console.log('  sarah@taskforge.com  / user1234  (role: user)');

  await disconnectDB();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
