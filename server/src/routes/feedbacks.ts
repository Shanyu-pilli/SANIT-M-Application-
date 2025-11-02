import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../lib/auth';

const prisma = new PrismaClient();
const router = express.Router();

// list feedbacks (if admin returns all, else user's own)
router.get('/', async (req: any, res: any) => {
  try {
    const token = req.cookies['sanit_token'];
    const decoded: any = token ? verifyToken(token) : null;
    if (!decoded) return res.json([]);
    // naive: if profile role is faculty/admin we might return more; for now return all to faculty/admin
    const profile = await prisma.profile.findUnique({ where: { userId: decoded.id } });
    if (profile && (profile.role === 'faculty' || profile.role === 'admin')) {
      const all = await prisma.feedback.findMany({ orderBy: { createdAt: 'desc' } });
      return res.json(all);
    }
    const items = await prisma.feedback.findMany({ where: { userId: decoded.id }, orderBy: { createdAt: 'desc' } });
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});

// submit feedback
router.post('/', async (req: any, res: any) => {
  try {
    const token = req.cookies['sanit_token'];
    const decoded: any = token ? verifyToken(token) : null;
    if (!decoded) return res.status(401).json({ message: 'Not authenticated' });
    const { content, attachmentUrl } = req.body;
    const fb = await prisma.feedback.create({ data: { userId: decoded.id, content: content || {}, attachmentUrl: attachmentUrl || null } });
    // Placeholder: encryption/hash/blockchain steps should be performed here server-side per your flow diagram.
    return res.json(fb);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// update feedback
router.put('/:id', async (req: any, res: any) => {
  try {
    const token = req.cookies['sanit_token'];
    const decoded: any = token ? verifyToken(token) : null;
    if (!decoded) return res.status(401).json({ message: 'Not authenticated' });
    const { id } = req.params;
    const { content, attachmentUrl } = req.body;
    const updated = await prisma.feedback.updateMany({ where: { id, userId: decoded.id }, data: { content, attachmentUrl } });
    res.json({ count: updated.count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
