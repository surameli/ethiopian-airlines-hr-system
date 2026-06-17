import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/axios';
import Loader from '../components/Loader';

export default function Exam() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    api.get(`/exam/${jobId}`)
      .then((res) => {
        setExam(res.data);
        setTimeLeft(res.data.duration * 60);
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not load exam'))
      .finally(() => setLoading(false));
  }, [jobId]);

  // Countdown
  useEffect(() => {
    if (timeLeft === null || result) return;
    if (timeLeft <= 0) { handleSubmit(true); return; }
    timerRef.current = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [timeLeft, result]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleAnswer = (questionId, answer) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!autoSubmit) {
      const unanswered = exam.questions.length - Object.keys(answers).length;
      if (unanswered > 0 && !window.confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`)) {
        return;
      }
    }
    clearTimeout(timerRef.current);
    setSubmitting(true);

    const payload = exam.questions.map((q) => ({
      questionId: q._id,
      answer: answers[q._id] || '',
    }));

    try {
      const res = await api.post(`/exam/${jobId}/submit`, { answers: payload });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader />;

  if (error) {
    return (
      <div className="exam-page">
        <div className="alert alert-error">{error}</div>
        <button className="btn-outline" onClick={() => navigate('/dashboard')}>← Back to Dashboard</button>
      </div>
    );
  }

  if (result) {
    return (
      <div className="exam-page">
        <div className={`result-card ${result.passed ? 'result-pass' : 'result-fail'}`}>
          <div className="result-icon">{result.passed ? '🎉' : '📋'}</div>
          <h2>{result.passed ? 'Congratulations!' : 'Thank You for Applying'}</h2>

          {/* Score breakdown */}
          <div className="score-breakdown">
            <div className="score-box">
              <span className="score-box-value">{result.aiScore}</span>
              <span className="score-box-label">CV Score</span>
              <span className="score-box-max">/50</span>
            </div>
            <div className="score-box-divider">+</div>
            <div className="score-box">
              <span className="score-box-value">{result.examScore}</span>
              <span className="score-box-label">Exam Score</span>
              <span className="score-box-max">/50</span>
            </div>
            <div className="score-box-divider">=</div>
            <div className="score-box score-box-total">
              <span className="score-box-value">{result.totalScore}</span>
              <span className="score-box-label">Total Score</span>
              <span className="score-box-max">/100</span>
            </div>
          </div>

          <p className="result-detail">
            You answered {result.correct} out of {result.total} questions correctly.
          </p>
          <p className="result-detail">
            {result.passed
              ? 'You have been shortlisted. Our HR team will contact you soon.'
              : 'Your application is under review. We appreciate your interest in Ethiopian Airlines.'}
          </p>
          <button className="btn-primary" onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const answered = Object.keys(answers).length;
  const isUrgent = timeLeft < 120;

  return (
    <div className="exam-page">
      <div className="exam-header">
        <div>
          <h1>Screening Exam</h1>
          <p>{exam.totalQuestions} questions · {exam.pointsPerQuestion} pts each · 50 pts total</p>
        </div>
        <div className={`timer ${isUrgent ? 'timer-urgent' : ''}`}>
          ⏱ {formatTime(timeLeft)}
        </div>
      </div>

      <div className="exam-progress">
        <div
          className="exam-progress-bar"
          style={{ width: `${(answered / exam.totalQuestions) * 100}%` }}
        />
        <span>{answered}/{exam.totalQuestions} answered</span>
      </div>

      <div className="questions-list">
        {exam.questions.map((q, idx) => (
          <div key={q._id} className={`question-card ${answers[q._id] ? 'answered' : ''}`}>
            <p className="question-text">
              <span className="question-num">{idx + 1}.</span> {q.question}
            </p>
            <div className="options-list">
              {q.options.map((opt) => (
                <label
                  key={opt}
                  className={`option ${answers[q._id] === opt ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name={q._id}
                    value={opt}
                    checked={answers[q._id] === opt}
                    onChange={() => handleAnswer(q._id, opt)}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="exam-submit">
        <button
          className="btn-primary btn-lg"
          onClick={() => handleSubmit(false)}
          disabled={submitting}
        >
          {submitting ? 'Submitting…' : 'Submit Exam'}
        </button>
      </div>
    </div>
  );
}
