import express from 'express';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const validateCollegeEmail = (email: string, role?: string): boolean => {
  const domain = '@nitm.ac.in';
  if (!email.endsWith(domain)) return false;

  const username = email.split('@')[0];
  if (!role) return true;

  if (role === 'student') {
    const studentPattern = /^b\d{2}[a-z]{2}\d{3}$/i;
    return studentPattern.test(username);
  }
  if (role === 'faculty') {
    const facultyPattern = /^f[a-z]{2}\d{3}$/i;
    return facultyPattern.test(username);
  }
  if (role === 'admin') {
    const adminPattern = /^a\d{3}$/i;
    return adminPattern.test(username);
  }
  return true;
};

// send-otp: validate, generate OTP, store in DB, optionally send email (dev returns OTP)
router.post('/send-otp', async (req: any, res: any) => {
  try {
    const { email, name, role } = req.body || {};
    if (!email || !name) return res.status(400).json({ error: 'Email and name are required' });

    if (!validateCollegeEmail(email, role)) {
      return res.status(400).json({ error: 'Invalid college email format for the specified role' });
    }

    // If a user already exists with this email, reject
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'Email is already registered' });

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete existing OTPs for this email
    await prisma.oTPVerification.deleteMany({ where: { email } });

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    await prisma.oTPVerification.create({ data: { email, otpCode, expiresAt } });

    console.log('Generated OTP for', email, otpCode);

    // If RESEND_API_KEY is configured we could send email; for now return devMode info
    if (process.env.RESEND_API_KEY) {
      // Optional: implement Resend API call here. For now just log and return success.
      console.log('RESEND_API_KEY present but email sending not implemented in this build.');
    }

    return res.json({ success: true, devMode: true, otp: otpCode });
  } catch (err: any) {
    console.error('send-otp error', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// verify-otp: check DB record and expiration, delete on success or expired
router.post('/verify-otp', async (req: any, res: any) => {
  try {
    const { email, otpCode } = req.body || {};
    if (!email || !otpCode) return res.status(400).json({ error: 'Email and OTP code are required' });

    const record = await prisma.oTPVerification.findFirst({ where: { email, otpCode } });
    if (!record) return res.status(400).json({ error: 'Invalid OTP code' });

    const now = new Date();
    if (now > record.expiresAt) {
      await prisma.oTPVerification.deleteMany({ where: { email } });
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    // valid - delete and return success
    await prisma.oTPVerification.deleteMany({ where: { email } });
    return res.json({ success: true, message: 'OTP verified successfully' });
  } catch (err: any) {
    console.error('verify-otp error', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// placeholder for blockchain/hash operations
router.post('/submit-hash', async (req: any, res: any) => {
  try {
    const { payload } = req.body || {};
    const hash = crypto.createHash('sha256').update(JSON.stringify(payload || {})).digest('hex');
    res.json({ hash, txId: null });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
