import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    cvPath: { type: String, required: true },          // path to uploaded PDF
    coverLetter: { type: String, default: '' },

    // AI Screening — scored out of 50
    aiScore: { type: Number, default: null },           // 0–50
    aiFeedback: { type: String, default: '' },          // AI explanation
    screeningStatus: {
      type: String,
      enum: ['pending', 'screened', 'failed'],
      default: 'pending',
    },

    // Exam — scored out of 50
    examStatus: {
      type: String,
      enum: ['not_invited', 'invited', 'started', 'completed'],
      default: 'not_invited',
    },
    examScore: { type: Number, default: null },         // 0–50
    examAnswers: [
      {
        question: String,
        answer: String,
        correct: Boolean,
      },
    ],
    examCompletedAt: { type: Date },

    // Combined total score out of 100
    totalScore: { type: Number, default: null },

    // Final HR decision
    status: {
      type: String,
      enum: ['under_review', 'shortlisted', 'rejected', 'hired'],
      default: 'under_review',
    },
  },
  { timestamps: true }
);

// Prevent duplicate applications
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

export default mongoose.model('Application', applicationSchema);
