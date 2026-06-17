import { Link } from 'react-router-dom';

export default function JobCard({ job }) {
  const deadline = new Date(job.deadline);

  const isClosed =
    !job.isOpen || deadline < new Date();

  return (
    <div className="job-card">

      <div className="job-card-header">
        <h3>{job.title}</h3>

        <span
          className={`badge ${
            isClosed ? 'badge-closed' : 'badge-open'
          }`}
        >
          {isClosed ? 'Closed' : 'Open'}
        </span>
      </div>

      <div className="job-meta">
        <span>🏢 {job.department}</span>
        <span>📍 {job.location}</span>
        <span>🕒 {job.type}</span>
      </div>

      <p className="job-desc">
        {job.description.substring(0, 120)}...
      </p>

      <div className="job-card-footer">
        <span>
          Deadline:
          {' '}
          {deadline.toLocaleDateString()}
        </span>

        <Link
          to={`/jobs/${job._id}`}
          className="btn-primary"
        >
          View Details
        </Link>
      </div>

    </div>
  );
}