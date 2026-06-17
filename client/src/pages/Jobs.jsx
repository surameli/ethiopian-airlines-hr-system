import { useState, useEffect } from 'react';
import api from '../utils/axios';
import JobCard from '../components/JobCard';
import Loader from '../components/Loader';

const DEPARTMENTS = ['All', 'Flight Operations', 'Engineering', 'Cabin Crew', 'Finance', 'IT', 'HR', 'Ground Services'];
const TYPES = ['All', 'Full-time', 'Part-time', 'Contract', 'Internship'];

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All');
  const [type, setType] = useState('All');

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (department !== 'All') params.department = department;
      if (type !== 'All') params.type = type;

      const res = await api.get('/jobs', { params });
      setJobs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [department, type]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchJobs();
  };

  return (
    <div className="jobs-page">
      <div className="jobs-header">
        <h1>Open Positions</h1>
        <p>Find your place in Africa's leading airline.</p>
      </div>

      {/* Filters */}
      <div className="jobs-filters">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search by title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn-primary">Search</button>
        </form>

        <div className="filter-group">
          <select value={department} onChange={(e) => setDepartment(e.target.value)}>
            {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
          </select>

          <select value={type} onChange={(e) => setType(e.target.value)}>
            {TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : jobs.length === 0 ? (
        <div className="empty-state">
          <p>No jobs found. Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="jobs-grid">
          {jobs.map((job) => <JobCard key={job._id} job={job} />)}
        </div>
      )}
    </div>
  );
}
