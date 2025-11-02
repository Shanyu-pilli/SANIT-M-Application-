import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../lib/auth';

const prisma = new PrismaClient();
const router = express.Router();

router.get('/', async (req: any, res: any) => {
  try {
    const token = req.cookies['sanit_token'];
    if (!token) return res.status(200).json(null);
    const decoded: any = verifyToken(token as string);
    if (!decoded) return res.status(200).json(null);
    const profile = await prisma.profile.findUnique({ where: { userId: decoded.id } });
    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json(null);
  }
});

export default router;
