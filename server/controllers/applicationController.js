import path from 'path';
import { fileURLToPath } from 'url';
import Application from '../models/Application.js';
import Job from '../models/Job.js';
import { extractTextFromCV } from '../utils/cvParser.js';
import { scoreCV } from '../utils/aiScorer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// POST /api/applications  — applicant submits CV
export const applyForJob = async (req, res) => {
  try {
    const { jobId, coverLetter } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'CV file is required' });
    }

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (!job.isOpen) return res.status(400).json({ message: 'This job is no longer accepting applications' });

    const existing = await Application.findOne({ job: jobId, applicant: req.user._id });
    if (existing) return res.status(409).json({ message: 'You have already applied for this job' });

    const application = await Application.create({
      job: jobId,
      applicant: req.user._id,
      cvPath: req.file.path,
      coverLetter: coverLetter || '',
    });

    await Job.findByIdAndUpdate(jobId, { $inc: { applicantCount: 1 } });

    // Trigger AI screening async — do not block the response
    screenApplicationAsync(application._id, req.file.path, job);

    res.status(201).json({
      message: 'Application submitted. AI screening is in progress.',
      application,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Background AI screening — scores CV out of 50
// Candidates scoring >= 30/50 are invited to the exam
const screenApplicationAsync = async (applicationId, cvPath, job) => {
  try {
    const cvText = await extractTextFromCV(cvPath);
    const { score, feedback } = await scoreCV(cvText, job);

    // Pass threshold: 30 out of 50
    const screeningStatus = score >= 30 ? 'screened' : 'failed';
    const examStatus = score >= 30 ? 'invited' : 'not_invited';

    await Application.findByIdAndUpdate(applicationId, {
      aiScore: score,
      aiFeedback: feedback,
      screeningStatus,
      examStatus,
    });

    console.log(`✅ Screened application ${applicationId}: cvScore=${score}/50`);
  } catch (err) {
    console.error(`❌ Screening failed for ${applicationId}:`, err.message);
    await Application.findByIdAndUpdate(applicationId, { screeningStatus: 'failed' });
  }
};

// GET /api/applications/my  — applicant sees their own applications
export const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ applicant: req.user._id })
      .populate('job', 'title department location deadline')
      .sort({ createdAt: -1 });
    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/applications/job/:jobId  — HR sees applications sorted by totalScore
export const getApplicationsByJob = async (req, res) => {
  try {
    const { minScore = 0, status } = req.query;
    const filter = { job: req.params.jobId };

    if (status) filter.status = status;
    // Filter by total score (aiScore + examScore combined)
    if (Number(minScore) > 0) filter.totalScore = { $gte: Number(minScore) };

    const applications = await Application.find(filter)
      .populate('applicant', 'name email phone')
      .populate('job', 'title department')
      .sort({ totalScore: -1, aiScore: -1 }); // rank by total, then by CV score

    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/applications/:id  — get one application (detail)
export const getApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('applicant', 'name email phone')
      .populate('job', 'title department location description requirements');

    if (!application) return res.status(404).json({ message: 'Application not found' });

    if (
      req.user.role === 'applicant' &&
      application.applicant._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(application);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/applications/:id/status  — HR updates final decision
export const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['under_review', 'shortlisted', 'rejected', 'hired'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('applicant', 'name email');

    if (!application) return res.status(404).json({ message: 'Application not found' });
    res.json(application);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
