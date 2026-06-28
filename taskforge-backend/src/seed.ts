import { generateNKeysBetween } from 'fractional-indexing';
import { connectDB, disconnectDB } from './config/db';
import { User, hashPassword } from './models/User';
import { Task, TASK_STATUSES, type TaskStatus, type TaskPriority } from './models/Task';

const DAY = 24 * 60 * 60 * 1000;

function daysFromNow(n: number) {
  return new Date(Date.now() + n * DAY);
}

async function seed() {
  await connectDB();

  await User.deleteMany({});
  await Task.deleteMany({});

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

  await Task.insertMany(tasks);

  console.log('✓ Seed complete — 4 users, 50 tasks created');
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
