import mongoose from 'mongoose';
import { config } from './config';
import { createApp } from './app';

async function main() {
  await mongoose.connect(config.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  console.log('Connected to MongoDB');

  const server = createApp({ clientOrigin: config.CLIENT_ORIGIN }).listen(config.PORT, () => {
    console.log(`API listening on http://localhost:${config.PORT}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`${signal} received, shutting down`);
    server.close();
    await mongoose.disconnect();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('Failed to start API:', err instanceof Error ? err.message : err);
  process.exit(1);
});
