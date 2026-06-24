import { connectDB, disconnectDB } from './config/db';
import { User, hashPassword } from './models/User';
import { Task } from './models/Task';

async function seed() {
  await connectDB();

  await User.deleteMany({});
  await Task.deleteMany({});

  const adminHash = await hashPassword('admin123');
  const userHash = await hashPassword('user1234');

  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@taskforge.dev',
    passwordHash: adminHash,
    role: 'admin',
  });

  const regular = await User.create({
    name: 'Jane Doe',
    email: 'jane@taskforge.dev',
    passwordHash: userHash,
    role: 'user',
  });

  await Task.insertMany([
    {
      title: 'Set up CI/CD pipeline',
      description: 'Configure GitHub Actions for automated builds and deployments.',
      priority: 'high',
      status: 'in_progress',
      createdBy: admin._id,
      assignedTo: regular._id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Write API documentation',
      description: 'Document all REST endpoints with request/response examples.',
      priority: 'medium',
      status: 'open',
      createdBy: admin._id,
      assignedTo: null,
    },
    {
      title: 'Fix login redirect bug',
      description: 'After login, users are sometimes redirected to a blank page.',
      priority: 'high',
      status: 'done',
      createdBy: regular._id,
      assignedTo: regular._id,
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Design onboarding flow',
      description: 'Create wireframes for the new user onboarding experience.',
      priority: 'low',
      status: 'open',
      createdBy: regular._id,
      assignedTo: null,
    },
    {
      title: 'Database index audit',
      description: 'Review slow query logs and add missing indexes.',
      priority: 'medium',
      status: 'done',
      createdBy: admin._id,
      assignedTo: admin._id,
    },
  ]);

  console.log('✓ Seed complete');
  console.log('  admin@taskforge.dev  / admin123  (role: admin)');
  console.log('  jane@taskforge.dev   / user1234  (role: user)');

  await disconnectDB();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
