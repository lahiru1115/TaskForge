// Runs before each test file's own imports resolve, so config/env.ts's
// required() checks never throw. Real DB connection is per-test-file
// (mongodb-memory-server), not here — this only satisfies startup.
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/taskforge-test-placeholder';
process.env.JWT_SECRET = 'test-jwt-secret-do-not-use-in-production';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';
