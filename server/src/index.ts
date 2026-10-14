import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { initDatabase, db } from './db';
import { seedDemoData } from './seed';
import transactionsRouter from './routes/transactions';
import decisionsRouter from './routes/decisions';
import analysisRouter from './routes/analysis';
import voiceRouter from './routes/voice';
import auditRouter from './routes/audit';
import statsRouter from './routes/stats';
import settingsRouter from './routes/settings';
import demoRouter from './routes/demo';

const app = express();
const PORT = process.env.PORT || 4000;

// Initialize SQLite database
initDatabase();

// Check if we should seed default demonstration data
const txCount = (db.prepare('SELECT COUNT(*) as count FROM transactions').get() as any).count;
if (txCount === 0) {
  console.log('Database empty. Seeding initial presentation demo dataset...');
  seedDemoData();
}

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'FINOVA AI Financial Intelligence & Blockchain Verification API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/transactions', transactionsRouter);
app.use('/api/decisions', decisionsRouter);
app.use('/api/analysis', analysisRouter);
app.use('/api/voice', voiceRouter);
app.use('/api/audit', auditRouter);
app.use('/api/stats', statsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/demo', demoRouter);

import path from 'path';
import fs from 'fs';

// Serve client in production
const clientDist = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
  console.log(`Serving FINOVA frontend from: ${clientDist}`);
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`FINOVA Backend server active on http://localhost:${PORT}`);
});
