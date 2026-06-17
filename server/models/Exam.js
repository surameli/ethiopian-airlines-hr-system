import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String }],               // 4 options for MCQ
  correctAnswer: { type: String, required: true },
  type: { type: String, enum: ['mcq', 'short'], default: 'mcq' },
});

const examSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true, unique: true },
    questions: [questionSchema],
    duration: { type: Number, default: 30 },   // minutes
    passMark: { type: Number, default: 25 },   // out of 50 (50%)
    generatedByAI: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Exam', examSchema);
