// Loads server/.env when present (Node 22+), then exposes settings.
try {
  process.loadEnvFile();
} catch {
  /* no .env file — defaults / real environment variables are used */
}

export const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shivshakti_billing';
export const PORT = Number(process.env.PORT) || 4000;
