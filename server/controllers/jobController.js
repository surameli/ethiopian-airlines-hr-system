import Job from '../models/Job.js';

// GET /api/jobs  — public
export const getJobs = async (req, res) => {
  try {
    const { department, type, search } = req.query;
    const filter = { isOpen: true };

    if (department) filter.department = department;
    if (type) filter.type = type;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const jobs = await Job.find(filter)
      .populate('postedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/jobs/:id  — public
export const getJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('postedBy', 'name');
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/jobs  — hr/admin only
export const createJob = async (req, res) => {
  try {
    const { title, department, location, type, description, requirements, keywords, deadline } = req.body;

    if (!title || !department || !location || !description || !deadline) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const job = await Job.create({
      title,
      department,
      location,
      type,
      description,
      requirements: requirements || [],
      keywords: keywords || [],
      deadline,
      postedBy: req.user._id,
    });

    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/jobs/:id  — hr/admin only
export const updateJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/jobs/:id  — hr/admin only
export const deleteJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json({ message: 'Job deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/jobs/hr/all  — hr/admin: see all jobs including closed
export const getAllJobsHR = async (req, res) => {
  try {
    const jobs = await Job.find()
      .populate('postedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
