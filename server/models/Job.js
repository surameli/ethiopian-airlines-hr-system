import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    type: { type: String, enum: ['Full-time', 'Part-time', 'Contract', 'Internship'], default: 'Full-time' },
    description: { type: String, required: true },
    requirements: [{ type: String }],        // e.g. ["BSc in CS", "3+ years experience"]
    keywords: [{ type: String }],            // Used by AI scorer to match CVs
    deadline: { type: Date, required: true },
    isOpen: { type: Boolean, default: true },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    applicantCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('Job', jobSchema);
