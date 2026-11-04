import express from 'express';
import cors from 'cors';
import api from './routes/api.js';
import { AppError } from './errors.js';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use('/api', api);

  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err instanceof AppError) return res.status(err.status).json({ error: err.message, details: err.details });
    if (err?.name === 'ValidationError') return res.status(400).json({ error: err.message });
    if (err?.code === 11000) return res.status(409).json({ error: 'Duplicate record' });
    console.error(err);
    res.status(500).json({ error: 'Something went wrong on the server' });
  });

  return app;
}
