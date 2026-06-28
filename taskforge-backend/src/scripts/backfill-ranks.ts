import { generateNKeysBetween } from 'fractional-indexing';
import { connectDB } from '../config/db';
import { Task, TASK_STATUSES } from '../models/Task';

async function backfillRanks() {
  await connectDB();

  for (const status of TASK_STATUSES) {
    const tasks = await Task.find({ status, $or: [{ rank: { $exists: false } }, { rank: '' }] })
      .sort({ createdAt: 1 })
      .select('_id rank');

    if (tasks.length === 0) continue;

    const keys = generateNKeysBetween(null, null, tasks.length);

    for (let i = 0; i < tasks.length; i++) {
      await Task.updateOne({ _id: tasks[i]._id }, { $set: { rank: keys[i] } });
    }

    console.log(`Backfilled ${tasks.length} tasks in column "${status}"`);
  }

  console.log('Done.');
  process.exit(0);
}

backfillRanks().catch((err) => {
  console.error(err);
  process.exit(1);
});
