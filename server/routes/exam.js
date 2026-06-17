import express from 'express';
import {
  generateExam,
  getExam,
  submitExam,
  getExamResults,
} from '../controllers/examController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// HR generates exam for a job
router.post('/generate/:jobId', protect, requireRole('hr', 'admin'), generateExam);

// Applicant takes exam
router.get('/:jobId', protect, requireRole('applicant'), getExam);
router.post('/:jobId/submit', protect, requireRole('applicant'), submitExam);

// HR sees results
router.get('/results/:jobId', protect, requireRole('hr', 'admin'), getExamResults);

export default router;
