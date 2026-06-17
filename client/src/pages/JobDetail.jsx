import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';

export default function JobDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/jobs/${id}`)
      .then((res) => setJob(res.data))
      .catch(() => navigate('/jobs'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader />;
  if (!job) return null;

  const deadline = new Date(job.deadline);
  const isExpired = deadline < new Date();

  return (
  <div className="job-detail-page">
    <div className="job-detail-container">

      <div className="job-header">
        <h1>{job.title}</h1>

        <div className="job-meta">
          <span>🏢 {job.department}</span>
          <span>📍 {job.location}</span>
          <span>🕒 {job.type}</span>
          <span>👥 {job.applicantCount} Applicants</span>

          <span className={`badge ${isExpired ? "badge-closed" : "badge-open"}`}>
            {isExpired ? "Closed" : "Open"}
          </span>
        </div>
      </div>

      <section className="job-section">
        <h2>About the Role</h2>
        <p>{job.description}</p>
      </section>

      {job.requirements?.length > 0 && (
        <section className="job-section">
          <h2>Requirements</h2>

          <ul>
            {job.requirements.map((req, i) => (
              <li key={i}>{req}</li>
            ))}
          </ul>
        </section>
      )}

      <div className="job-detail-footer">
        <p>
          <strong>Application Deadline:</strong>{" "}
          {deadline.toLocaleDateString()}
        </p>

        {!isExpired && (
          <>
            {!user ? (
              <Link to="/register" className="btn-primary">
                Register to Apply
              </Link>
            ) : user.role === "applicant" ? (
              <Link
                to={`/apply/${job._id}`}
                className="btn-primary"
              >
                Apply Now
              </Link>
            ) : null}
          </>
        )}
      </div>

    </div>
  </div>
);
}
