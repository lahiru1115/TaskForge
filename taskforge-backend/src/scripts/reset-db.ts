import { connectDB, disconnectDB } from '../config/db';
import { User } from '../models/User';
import { Task } from '../models/Task';
import { Activity } from '../models/Activity';

const collections: Record<string, any> = {
  User,
  Task,
  Activity,
};

async function resetDB() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: npm run reset:db -- <all|collection1 collection2 ...>');
    console.error('Examples:');
    console.error('  npm run reset:db -- all');
    console.error('  npm run reset:db -- User Task');
    process.exit(1);
  }

  await connectDB();

  const toDelete = args[0].toLowerCase() === 'all' ? Object.keys(collections) : args;

  // Validate collection names
  const invalid = toDelete.filter((name) => !collections[name]);
  if (invalid.length) {
    console.error(`✗ Invalid collection(s): ${invalid.join(', ')}`);
    console.error(`  Available: ${Object.keys(collections).join(', ')}`);
    await disconnectDB();
    process.exit(1);
  }

  console.log(`\nResetting: ${toDelete.join(', ')}\n`);

  for (const name of toDelete) {
    const count = await collections[name].deleteMany({});
    console.log(`  ✓ ${name}: ${count.deletedCount} documents deleted`);
  }

  console.log('\n✓ Reset complete\n');
  await disconnectDB();
}

resetDB().catch((err) => {
  console.error('Reset failed:', err);
  process.exit(1);
});
