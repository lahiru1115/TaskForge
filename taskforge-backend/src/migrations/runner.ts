import { connectDB, disconnectDB } from '../config/db';
import { Migration } from '../models/Migration';
import migration001 from './001-workspaces';

export type MigrationModule = {
  name: string;
  up: () => Promise<void>;
};

// Migrations run in this order, top to bottom. Explicit registration, not
// filesystem auto-discovery — what runs, and in what order, is always
// visible in one place here rather than implied by file naming, and a
// migration can never accidentally run before it's actually ready to.
//
// To add one: write src/migrations/00N-description.ts exporting a default
// `{ name, up }` (see 001-workspaces.ts), import it above, and append it
// to this array.
const MIGRATIONS: MigrationModule[] = [migration001];

async function run() {
  await connectDB();

  if (MIGRATIONS.length === 0) {
    console.log('No migrations registered.');
    return;
  }

  for (const migration of MIGRATIONS) {
    const already = await Migration.findOne({ name: migration.name });
    if (already) {
      console.log(`⊙ ${migration.name} — already applied ${already.appliedAt.toISOString()}, skipping.`);
      continue;
    }

    console.log(`▶ ${migration.name} — running...`);
    await migration.up();
    await Migration.create({ name: migration.name, appliedAt: new Date() });
    console.log(`✓ ${migration.name} — complete and stamped.`);
  }
}

run()
  .then(() => disconnectDB())
  .catch(async (err) => {
    console.error('Migration run failed:', err);
    await disconnectDB().catch(() => {});
    process.exit(1);
  });
