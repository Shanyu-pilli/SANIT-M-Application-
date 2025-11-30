import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth';
import profileRoutes from './routes/profile';
import feedbackRoutes from './routes/feedbacks';
import functionsRoutes from './routes/functions';
import dbRoutes from './routes/db';
import storageRoutes from './routes/storage';
import multer from 'multer';
import path from 'path';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));

// static uploads folder for local testing
const uploadDir = path.join(__dirname, '..', '..', 'uploads');
app.use('/uploads', express.static(uploadDir));

// routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/feedbacks', feedbackRoutes);
app.use('/api/functions', functionsRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/db', dbRoutes);

app.get('/', (_req, res) => res.json({ ok: true, message: 'SANIT API' }));

app.listen(port, () => {
  console.log(`SANIT server running on http://localhost:${port}`);
});
