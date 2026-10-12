import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { apiRouter } from './routes/index.js';
import { authMiddleware } from './middleware/auth.js';

import path from 'node:path';
import fs from 'node:fs';

const candidateEnvFiles = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'src', '.env'),
  path.resolve(process.cwd(), '..', '.env'),
];
for (const envFile of candidateEnvFiles) {
  if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile });
  }
}
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);
app.use(express.json());
app.use(authMiddleware);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    hackathon: 'ZETATHON',
    timestamp: new Date().toISOString(),
    service: 'ZETATHON API Engine v1.0.0',
  });
});

// Mount Routes
app.use('/api', apiRouter);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error occurred.',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 404 Handler for undefined API routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

app.listen(PORT, () => {
  console.log(`\x1b[32m✔ ZETATHON API server is running live on http://localhost:${PORT}\x1b[0m`);
  console.log(`\x1b[36m⚡ Endpoints available at http://localhost:${PORT}/api\x1b[0m`);
});
