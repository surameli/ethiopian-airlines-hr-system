import Exam from '../models/Exam.js';
import Application from '../models/Application.js';
import Job from '../models/Job.js';
import { generateExamQuestions } from '../utils/aiScorer.js';

// POST /api/exam/generate/:jobId  — HR generates AI exam for a job
export const generateExam = async (req, res) => {
  try {
    const { jobId } = req.params;

    const existing = await Exam.findOne({ job: jobId });
    if (existing) {
      return res.status(409).json({ message: 'Exam already exists for this job', exam: existing });
    }

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const questions = await generateExamQuestions(job);
    if (!questions.length) {
      return res.status(500).json({ message: 'Failed to generate exam questions' });
    }

    const exam = await Exam.create({
      job: jobId,
      questions,
      generatedByAI: true,
      // passMark = 25 out of 50 (50%) — set in model default
    });

    res.status(201).json(exam);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/exam/:jobId  — applicant fetches exam (no correct answers exposed)
export const getExam = async (req, res) => {
  try {
    const { jobId } = req.params;

    const application = await Application.findOne({
      job: jobId,
      applicant: req.user._id,
      examStatus: { $in: ['invited', 'started'] },
    });

    if (!application) {
      return res.status(403).json({ message: 'You are not invited to take this exam' });
    }

    const exam = await Exam.findOne({ job: jobId });
    if (!exam) return res.status(404).json({ message: 'Exam not ready yet. Please check back soon.' });

    if (application.examStatus === 'invited') {
      await Application.findByIdAndUpdate(application._id, { examStatus: 'started' });
    }

    // Never send correctAnswer to the client
    const sanitizedQuestions = exam.questions.map((q) => ({
      _id: q._id,
      question: q.question,
      options: q.options,
      type: q.type,
    }));

    res.json({
      examId: exam._id,
      duration: exam.duration,
      totalQuestions: exam.questions.length,
      pointsPerQuestion: 5,   // 10 questions × 5 pts = 50 total
      questions: sanitizedQuestions,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/exam/:jobId/submit  — applicant submits answers
export const submitExam = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { answers } = req.body; // [{ questionId, answer }]

    const application = await Application.findOne({
      job: jobId,
      applicant: req.user._id,
      examStatus: 'started',
    });

    if (!application) {
      return res.status(400).json({ message: 'No active exam session found or already submitted' });
    }

    const exam = await Exam.findOne({ job: jobId });
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    // Grade: each correct answer = 5 points, total out of 50
    let correct = 0;
    const gradedAnswers = exam.questions.map((q) => {
      const submitted = answers.find((a) => a.questionId === q._id.toString());
      const isCorrect = submitted?.answer === q.correctAnswer;
      if (isCorrect) correct++;
      return {
        question: q.question,
        answer: submitted?.answer || '',
        correct: isCorrect,
      };
    });

    const examScore = correct * 5; // out of 50
    const passed = examScore >= exam.passMark; // passMark default = 25

    // Combine with AI CV score → total out of 100
    const aiScore = application.aiScore ?? 0;
    const totalScore = aiScore + examScore;

    await Application.findByIdAndUpdate(application._id, {
      examStatus: 'completed',
      examScore,
      examAnswers: gradedAnswers,
      examCompletedAt: new Date(),
      totalScore,
      status: passed ? 'shortlisted' : 'under_review',
    });

    res.json({
      message: 'Exam submitted successfully',
      examScore,          // out of 50
      aiScore,            // out of 50
      totalScore,         // out of 100
      correct,
      total: exam.questions.length,
      passed,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/exam/results/:jobId  — HR views all exam results ranked by totalScore
export const getExamResults = async (req, res) => {
  try {
    const applications = await Application.find({
      job: req.params.jobId,
      examStatus: 'completed',
    })
      .populate('applicant', 'name email')
      .sort({ totalScore: -1 });

    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
