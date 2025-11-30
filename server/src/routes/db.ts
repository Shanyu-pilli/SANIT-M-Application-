import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../lib/auth';

const prisma = new PrismaClient();
const router = express.Router();

// Lightweight endpoint that accepts the builder state from the frontend shim
// and executes simple operations against Prisma. This is intentionally
// minimal — it supports select, insert, update, delete, upsert with `eq`
// filters and basic ordering. It expects the body to look like the shim's
// `state` object.
router.post('/', async (req: any, res: any) => {
  try {
    const state = req.body || {};
    const { table, op, filters = [], payload, order, single } = state;
    if (!table || !op) return res.status(400).json({ message: 'Invalid request' });

    // build a simple where object supporting only `eq`
    const where: any = {};
    for (const f of filters) {
      if (f.op === 'eq') where[f.k] = f.v;
    }

    const model = (name: string) => {
      switch ((name || '').toLowerCase()) {
        case 'profiles': return prisma.profile as any;
        case 'feedbacks': return prisma.feedback as any;
        case 'users': return prisma.user as any;
        case 'otp_verifications': return prisma.oTPVerification as any;
        default: return (prisma as any)[name];
      }
    };

    const m = model(table);
    if (!m) return res.status(400).json({ message: `Unknown table ${table}` });

    if (op === 'select') {
      const orderBy = order ? { [order.column]: order.opts?.ascending ? 'asc' : 'desc' } : undefined;
      if (single) {
        const item = await m.findFirst({ where, orderBy });
        return res.json(item);
      }
      const items = await m.findMany({ where, orderBy });
      return res.json(items);
    }

    // auth-check: require a valid token for write operations
    const token = req.cookies?.['sanit_token'];
    const decoded: any = token ? verifyToken(token) : null;
    if (!decoded && ['insert','update','delete','upsert'].includes(op)) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (op === 'insert') {
      const created = await m.create({ data: payload });
      return res.json(created);
    }

    if (op === 'update') {
      const updated = await m.updateMany({ where, data: payload });
      return res.json({ count: updated.count });
    }

    if (op === 'delete') {
      // Only allow delete if the actor is admin or the owner (profile.userId === decoded.id)
      // For simplicity, check admin role on profile
      const actorProfile = await prisma.profile.findUnique({ where: { userId: decoded.id } });
      if (!actorProfile) return res.status(403).json({ message: 'Forbidden' });
      if (actorProfile.role !== 'admin') return res.status(403).json({ message: 'Forbidden - admin only' });
      const deleted = await m.deleteMany({ where });
      return res.json({ count: deleted.count });
    }

    if (op === 'upsert') {
      // naive upsert: if payload contains id try update, else create
      if (payload && payload.id) {
        const updated = await m.updateMany({ where: { id: payload.id }, data: payload });
        return res.json({ count: updated.count });
      }
      const created = await m.create({ data: payload });
      return res.json(created);
    }

    return res.status(400).json({ message: 'Unsupported operation' });
  } catch (err) {
    console.error('db route error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
