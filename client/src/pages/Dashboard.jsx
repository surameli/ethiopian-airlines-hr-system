import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/axios';
import Loader from '../components/Loader';

// ─── Applicant Dashboard ────────────────────────────────────────────────────

function ApplicantDashboard({ user }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/applications/my')
      .then((res) => setApplications(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  const statusColor = {
    under_review: 'badge-pending',
    shortlisted: 'badge-open',
    rejected: 'badge-closed',
    hired: 'badge-hired',
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Welcome, {user.name}</h1>
          <p className="dashboard-sub">Track your applications and exam results below.</p>
        </div>
        <Link to="/jobs" className="btn-primary">Browse Jobs</Link>
      </div>

      <h2 className="section-title">My Applications ({applications.length})</h2>

      {applications.length === 0 ? (
        <div className="empty-state">
          <p>You haven't applied to any jobs yet.</p>
          <Link to="/jobs" className="btn-primary">Find Jobs</Link>
        </div>
      ) : (
        <div className="applications-list">
          {applications.map((app) => (
            <div key={app._id} className="application-card">
              <div className="application-info">
                <h3>{app.job?.title}</h3>
                <p className="text-muted">{app.job?.department} · {app.job?.location}</p>
                <p className="app-date">Applied {new Date(app.createdAt).toLocaleDateString()}</p>
              </div>

              <div className="application-scores">
                {/* CV Score */}
                <div className="mini-score">
                  <span className="mini-score-label">CV Score</span>
                  {app.aiScore !== null ? (
                    <span className={`mini-score-val ${app.aiScore >= 30 ? 'score-pass' : 'score-fail'}`}>
                      {app.aiScore}<span className="mini-score-max">/50</span>
                    </span>
                  ) : (
                    <span className="badge badge-pending">Screening…</span>
                  )}
                </div>

                {/* Exam Score */}
                <div className="mini-score">
                  <span className="mini-score-label">Exam Score</span>
                  {app.examScore !== null ? (
                    <span className={`mini-score-val ${app.examScore >= 25 ? 'score-pass' : 'score-fail'}`}>
                      {app.examScore}<span className="mini-score-max">/50</span>
                    </span>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </div>

                {/* Total Score */}
                <div className="mini-score mini-score-total">
                  <span className="mini-score-label">Total</span>
                  {app.totalScore !== null && app.totalScore !== undefined ? (
                    <span className="mini-score-val">
                      {app.totalScore}<span className="mini-score-max">/100</span>
                    </span>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </div>
              </div>

              <div className="application-actions">
                {app.examStatus === 'invited' && (
                  <Link to={`/exam/${app.job._id}`} className="btn-primary btn-sm">
                    Take Exam 📝
                  </Link>
                )}
                {app.examStatus === 'started' && (
                  <Link to={`/exam/${app.job._id}`} className="btn-outline btn-sm">
                    Continue Exam ▶
                  </Link>
                )}

                <span className={`badge ${statusColor[app.status] || ''}`}>
                  {app.status.replace('_', ' ')}
                </span>
              </div>

              {app.aiFeedback && (
                <p className="ai-feedback">💬 {app.aiFeedback}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── HR Dashboard ────────────────────────────────────────────────────────────

function HRDashboard({ user }) {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingApps, setLoadingApps] = useState(false);
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [minScore, setMinScore] = useState(0);
  const [generatingExam, setGeneratingExam] = useState(false);
  const [examMsg, setExamMsg] = useState('');

  useEffect(() => {
    api.get('/jobs/hr/all')
      .then((res) => setJobs(res.data))
      .finally(() => setLoadingJobs(false));
  }, []);

  const loadApplications = (jobId) => {
    setSelectedJob(jobId);
    setExamMsg('');
    setLoadingApps(true);
    api.get(`/applications/job/${jobId}`, { params: { minScore } })
      .then((res) => setApplications(res.data))
      .finally(() => setLoadingApps(false));
  };

  const updateStatus = async (appId, status) => {
    await api.patch(`/applications/${appId}/status`, { status });
    setApplications((prev) =>
      prev.map((a) => (a._id === appId ? { ...a, status } : a))
    );
  };

  const handleGenerateExam = async (jobId) => {
    setGeneratingExam(true);
    setExamMsg('');
    try {
      await api.post(`/exam/generate/${jobId}`);
      setExamMsg('✅ Exam generated! Qualified candidates can now take it.');
    } catch (err) {
      setExamMsg(err.response?.data?.message || '❌ Failed to generate exam');
    } finally {
      setGeneratingExam(false);
    }
  };

  if (loadingJobs) return <Loader />;

  const selectedJobObj = jobs.find((j) => j._id === selectedJob);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>HR Dashboard</h1>
          <p className="dashboard-sub">Manage vacancies and review AI-ranked candidates.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreateJob(true)}>
          + Post New Job
        </button>
      </div>

      {showCreateJob && (
        <CreateJobForm
          onClose={() => setShowCreateJob(false)}
          onCreated={(job) => {
            setJobs((prev) => [job, ...prev]);
            setShowCreateJob(false);
          }}
        />
      )}

      <div className="hr-layout">
        {/* Jobs sidebar */}
        <aside className="jobs-sidebar">
          <h2>Vacancies ({jobs.length})</h2>
          {jobs.map((job) => (
            <div
              key={job._id}
              className={`sidebar-job ${selectedJob === job._id ? 'active' : ''}`}
              onClick={() => loadApplications(job._id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && loadApplications(job._id)}
            >
              <span className="sidebar-job-title">{job.title}</span>
              <div className="sidebar-job-meta">
                <span className="sidebar-job-count">{job.applicantCount} applicants</span>
                <span className={`badge ${job.isOpen ? 'badge-open' : 'badge-closed'}`}>
                  {job.isOpen ? 'Open' : 'Closed'}
                </span>
              </div>
            </div>
          ))}
        </aside>

        {/* Applications panel */}
        <main className="applications-panel">
          {!selectedJob ? (
            <div className="empty-state">
              <p>← Select a vacancy to see ranked candidates</p>
            </div>
          ) : (
            <>
              <div className="panel-header">
                <h2>{selectedJobObj?.title}</h2>

                <div className="panel-actions">
                  <label className="filter-label">
                    Min Total Score:
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={minScore}
                      onChange={(e) => setMinScore(e.target.value)}
                      className="score-filter-input"
                    />
                  </label>
                  <button className="btn-outline btn-sm" onClick={() => loadApplications(selectedJob)}>
                    Filter
                  </button>
                  <button
                    className="btn-primary btn-sm"
                    onClick={() => handleGenerateExam(selectedJob)}
                    disabled={generatingExam}
                  >
                    {generatingExam ? 'Generating…' : '🤖 Generate Exam'}
                  </button>
                </div>
              </div>

              {examMsg && <div className="alert alert-info">{examMsg}</div>}

              <div className="scoring-legend">
                <span>🤖 CV Score <strong>/50</strong></span>
                <span>📝 Exam Score <strong>/50</strong></span>
                <span>⭐ Total <strong>/100</strong></span>
                <span className="legend-note">Candidates ranked highest to lowest</span>
              </div>

              {loadingApps ? (
                <Loader />
              ) : applications.length === 0 ? (
                <div className="empty-state">
                  <p>No applications match the current filter.</p>
                </div>
              ) : (
                <div className="applications-table-wrapper">
                  <table className="applications-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Candidate</th>
                        <th>Email</th>
                        <th>CV Score <small>/50</small></th>
                        <th>Exam Score <small>/50</small></th>
                        <th>Total <small>/100</small></th>
                        <th>Status</th>
                        <th>CV</th>
                        <th>Decision</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.map((app, idx) => (
                        <tr key={app._id} className={idx < 3 ? 'top-candidate' : ''}>
                          <td className="rank-cell">
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                          </td>
                          <td className="candidate-name">{app.applicant?.name}</td>
                          <td className="text-muted">{app.applicant?.email}</td>
                          <td>
                            <span className={`score-chip ${(app.aiScore ?? 0) >= 30 ? 'chip-pass' : 'chip-fail'}`}>
                              {app.aiScore ?? '—'}
                            </span>
                          </td>
                          <td>
                            <span className={`score-chip ${(app.examScore ?? 0) >= 25 ? 'chip-pass' : 'chip-neutral'}`}>
                              {app.examScore ?? '—'}
                            </span>
                          </td>
                          <td>
                            <span className={`score-chip score-chip-total ${(app.totalScore ?? 0) >= 60 ? 'chip-pass' : (app.totalScore ?? 0) >= 40 ? 'chip-mid' : 'chip-fail'}`}>
                              {app.totalScore ?? '—'}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${statusBadge(app.status)}`}>
                              {app.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td>
                            <a
                              href={`http://localhost:5000/${app.cvPath.replace(/\\/g, '/')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-outline btn-sm"
                            >
                              View CV
                            </a>
                          </td>
                          <td>
                            <select
                              value={app.status}
                              onChange={(e) => updateStatus(app._id, e.target.value)}
                              className="status-select"
                            >
                              <option value="under_review">Under Review</option>
                              <option value="shortlisted">Shortlisted</option>
                              <option value="rejected">Rejected</option>
                              <option value="hired">Hired</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function statusBadge(status) {
  return { under_review: 'badge-pending', shortlisted: 'badge-open', rejected: 'badge-closed', hired: 'badge-hired' }[status] || '';
}

// ─── Create Job Form ─────────────────────────────────────────────────────────

function CreateJobForm({ onClose, onCreated }) {
  const [form, setForm] = useState({
    title: '', department: '', location: '', type: 'Full-time',
    description: '', requirements: '', keywords: '', deadline: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...form,
        requirements: form.requirements.split('\n').map((r) => r.trim()).filter(Boolean),
        keywords: form.keywords.split(',').map((k) => k.trim()).filter(Boolean),
      };
      const res = await api.post('/jobs', payload);
      onCreated(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Post New Vacancy</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="create-job-form">
          <div className="form-row">
            <div className="form-group">
              <label>Job Title *</label>
              <input name="title" value={form.title} onChange={handleChange} required placeholder="Senior Software Engineer" />
            </div>
            <div className="form-group">
              <label>Department *</label>
              <input name="department" value={form.department} onChange={handleChange} required placeholder="IT" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Location *</label>
              <input name="location" value={form.location} onChange={handleChange} required placeholder="Addis Ababa" />
            </div>
            <div className="form-group">
              <label>Employment Type</label>
              <select name="type" value={form.type} onChange={handleChange}>
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Contract</option>
                <option>Internship</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Job Description *</label>
            <textarea name="description" rows={4} value={form.description} onChange={handleChange} required placeholder="Describe responsibilities, team, and expectations…" />
          </div>

          <div className="form-group">
            <label>Requirements (one per line)</label>
            <textarea name="requirements" rows={3} value={form.requirements} onChange={handleChange} placeholder={"BSc in Computer Science\n3+ years experience\nStrong Python skills"} />
          </div>

          <div className="form-group">
            <label>AI Screening Keywords <span className="label-hint">(comma-separated — used to score CVs)</span></label>
            <input name="keywords" value={form.keywords} onChange={handleChange} placeholder="Python, REST API, SQL, Agile, Team leadership" />
          </div>

          <div className="form-group">
            <label>Application Deadline *</label>
            <input type="date" name="deadline" value={form.deadline} onChange={handleChange} required />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Posting…' : 'Post Vacancy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Root export ─────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth();
  if (!user) return <Loader />;
  return user.role === 'applicant' ? <ApplicantDashboard user={user} /> : <HRDashboard user={user} />;
}
