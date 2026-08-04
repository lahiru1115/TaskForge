import { env } from './config/env';
import { connectDB, disconnectDB } from './config/db';
import app from './app';

const SHUTDOWN_TIMEOUT_MS = 10_000;

async function start() {
  await connectDB();
  const server = app.listen(env.port, () => {
    console.log(`✓ Server listening on port ${env.port}`);
  });

  function shutdown(signal: string) {
    console.log(`${signal} received, shutting down gracefully...`);

    const forceExit = setTimeout(() => {
      console.error('Graceful shutdown timed out, forcing exit');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    forceExit.unref();

    server.close(async () => {
      await disconnectDB();
      clearTimeout(forceExit);
      process.exit(0);
    });
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
