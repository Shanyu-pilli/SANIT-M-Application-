import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

const upload = multer({ storage });

router.post('/upload', upload.single('file'), (req: any, res: any) => {
  if (!req.file) return res.status(400).json({ message: 'No file' });
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
});

export default router;
