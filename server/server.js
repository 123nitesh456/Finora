import 'dotenv/config'; // must stay the first import so env vars are loaded
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

const app = express();
app.disable('x-powered-by');

// ---- CORS: only the frontend URL(s) listed in CLIENT_URL may call this API ----
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((url) => url.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // No origin = curl / Postman / server-to-server, which is fine.
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      const err = new Error(`CORS blocked origin: ${origin}`);
      err.statusCode = 403;
      return callback(err);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '1mb' }));

// ---- Routes ----
app.get('/', (req, res) => res.json({ name: 'Finora API', status: 'ok' }));
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ---- Errors (must be last) ----
app.use(notFound);
app.use(errorHandler);

const start = async () => {
  for (const key of ['MONGO_URI', 'JWT_SECRET']) {
    if (!process.env[key]) {
      console.error(`Missing ${key}. Add it to server/.env (see .env.example).`);
      process.exit(1);
    }
  }
  await connectDB();
  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`Finora API running on port ${port}`));
};

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
