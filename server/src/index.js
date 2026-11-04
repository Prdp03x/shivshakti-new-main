import dns from 'dns';
dns.setServers(["1.1.1.1","8.8.8.8"]);
import mongoose from 'mongoose';
import { MONGODB_URI, PORT } from './config.js';
import { createApp } from './app.js';

try {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
} catch (e) {
  console.error(`Could not connect to MongoDB at ${MONGODB_URI}\n${e.message}`);
  process.exit(1);
}
console.log(`MongoDB connected: ${mongoose.connection.name}`);

createApp().listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
