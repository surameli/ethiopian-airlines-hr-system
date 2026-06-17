import express from 'express';
import {
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  getAllJobsHR,
} from '../controllers/jobController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public
router.get('/', getJobs);
router.get('/:id', getJob);

// HR / Admin only
router.get('/hr/all', protect, requireRole('hr', 'admin'), getAllJobsHR);
router.post('/', protect, requireRole('hr', 'admin'), createJob);
router.put('/:id', protect, requireRole('hr', 'admin'), updateJob);
router.delete('/:id', protect, requireRole('hr', 'admin'), deleteJob);

export default router;
