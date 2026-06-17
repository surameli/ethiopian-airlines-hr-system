import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  applyForJob,
  getMyApplications,
  getApplicationsByJob,
  getApplication,
  updateApplicationStatus,
} from '../controllers/applicationController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `cv-${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are accepted'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const router = express.Router();

router.post('/', protect, requireRole('applicant'), upload.single('cv'), applyForJob);
router.get('/my', protect, requireRole('applicant'), getMyApplications);
router.get('/job/:jobId', protect, requireRole('hr', 'admin'), getApplicationsByJob);
router.get('/:id', protect, getApplication);
router.patch('/:id/status', protect, requireRole('hr', 'admin'), updateApplicationStatus);

export default router;
