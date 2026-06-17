import express from 'express';
import {
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  getAllJobsHR,
  closeJob,
  openJob,
} from '../controllers/jobController.js';

import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

//
// Public Routes
//
router.get('/', getJobs);
router.get('/:id', getJob);

//
// HR / Admin Routes
//
router.get('/hr/all', protect, requireRole('hr', 'admin'), getAllJobsHR);

router.post(
  '/',
  protect,
  requireRole('hr', 'admin'),
  createJob
);

router.put(
  '/:id',
  protect,
  requireRole('hr', 'admin'),
  updateJob
);

router.delete(
  '/:id',
  protect,
  requireRole('hr', 'admin'),
  deleteJob
);

//
// Open / Close Vacancy
//
router.patch(
  '/:id/close',
  protect,
  requireRole('hr', 'admin'),
  closeJob
);

router.patch(
  '/:id/open',
  protect,
  requireRole('hr', 'admin'),
  openJob
);

export default router;