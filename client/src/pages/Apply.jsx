import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/axios';
import Loader from '../components/Loader';

export default function Apply() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cvFile, setCvFile] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.get(`/jobs/${jobId}`)
      .then((res) => setJob(res.data))
      .catch(() => navigate('/jobs'))
      .finally(() => setLoading(false));
  }, [jobId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cvFile) return setError('Please upload your CV in PDF format');
    if (cvFile.type !== 'application/pdf') return setError('Only PDF files are accepted');

    setError('');
    setSubmitting(true);

    const formData = new FormData();
    formData.append('jobId', jobId);
    formData.append('cv', cvFile);
    formData.append('coverLetter', coverLetter);

    try {
      await api.post('/applications', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader />;
  if (!job) return null;

  if (success) {
    return (
      <div className="apply-page">
        <div className="success-card">
          <div className="success-icon">✅</div>
          <h2>Application Submitted!</h2>
          <p>Your CV is being processed by our AI screening system.</p>
          <p>We'll notify you about the next steps. Redirecting to dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="apply-page">
      <div className="apply-card">
        <div className="apply-header">
          <h1>Apply for {job.title}</h1>
          <p>{job.department} · {job.location}</p>
        </div>

        <div className="ai-info-box">
          <span>🤖</span>
          <div>
            <strong>AI-Powered Screening</strong>
            <p>Your CV will be automatically analyzed and scored against the job requirements.</p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="cv">CV / Resume (PDF only, max 5MB)</label>
            <div className="file-upload">
              <input
                id="cv"
                type="file"
                accept="application/pdf"
                onChange={(e) => setCvFile(e.target.files[0])}
                required
              />
              {cvFile && (
                <span className="file-name">📄 {cvFile.name}</span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="coverLetter">Cover Letter (optional)</label>
            <textarea
              id="coverLetter"
              rows={5}
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Tell us why you're the right person for this role…"
            />
          </div>

          <button
            type="submit"
            className="btn-primary btn-full"
            disabled={submitting}
          >
            {submitting ? 'Submitting…' : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  );
}
