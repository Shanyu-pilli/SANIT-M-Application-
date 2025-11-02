import express from 'express';
import { PrismaClient } from '@prisma/client';
import { hashPassword, verifyPassword, signToken } from '../lib/auth';

const prisma = new PrismaClient();
const router = express.Router();

// signup
router.post('/signup', async (req, res) => {
  const { email, password, name, role } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Missing credentials' });
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ message: 'User exists' });
    const hashed = await hashPassword(password);
    const user = await prisma.user.create({ data: { email, password: hashed } });
    await prisma.profile.create({ data: { userId: user.id, name: name || null, role: role || 'student' } });
    const token = signToken({ id: user.id, email: user.email });
    res.cookie('sanit_token', token, { httpOnly: true, sameSite: 'lax' });
    res.json({ user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// signin
router.post('/signin', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Missing credentials' });
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const ok = await verifyPassword(password, user.password);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });
    const token = signToken({ id: user.id, email: user.email });
    res.cookie('sanit_token', token, { httpOnly: true, sameSite: 'lax' });
    res.json({ user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// signout
router.post('/signout', (_req, res) => {
  res.clearCookie('sanit_token');
  res.json({ ok: true });
});

// get user from cookie
router.get('/user', async (req, res) => {
  try {
    const token = req.cookies['sanit_token'];
    if (!token) return res.json({ user: null });
    // verify token
    // importing verifyToken inline to avoid circular imports
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    if (!decoded) return res.json({ user: null });
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return res.json({ user: null });
    res.json({ id: user.id, email: user.email });
  } catch (err) {
    console.error(err);
    res.json({ user: null });
  }
});

export default router;
