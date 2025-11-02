import express from 'express';
import crypto from 'crypto';

const router = express.Router();

// Simple OTP sender (development): returns an OTP in response when devMode
router.post('/send-otp', async (req: any, res: any) => {
  try {
    const { email, name } = req.body || {};
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // In production you'd send email via an SMTP provider and not return the OTP
    console.log(`OTP for ${email}: ${otp}`);
    res.json({ devMode: true, otp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/verify-otp', async (req: any, res: any) => {
  // This is a placeholder that always returns success for dev mode.
  res.json({ ok: true });
});

// placeholder for blockchain/hash operations
router.post('/submit-hash', async (req: any, res: any) => {
  try {
    const { payload } = req.body || {};
    // Example: compute SHA256 hash and return it
    const hash = crypto.createHash('sha256').update(JSON.stringify(payload || {})).digest('hex');
    // In production, you would submit this hash to the blockchain and return tx id
    res.json({ hash, txId: null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
