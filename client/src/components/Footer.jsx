import { Link } from "react-router-dom";
import logo from "../assets/logo1.png";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">

        <div className="footer-section">
          <img src={logo} alt="Ethiopian Airlines" className="footer-logo" />
          <h2>Ethiopian Airlines</h2>
          <p>
            AI-powered recruitment platform helping talented professionals
            discover career opportunities with Africa's leading airline.
          </p>
        </div>

        <div className="footer-section">
          <h3>Quick Links</h3>

          <Link to="/">Home</Link>
          <Link to="/jobs">Jobs</Link>
          <Link to="/login">Login</Link>
          <Link to="/register">Apply Now</Link>
        </div>

        <div className="footer-section">
          <h3>Recruitment</h3>

          <p>✔ AI CV Screening</p>
          <p>✔ Online Assessment</p>
          <p>✔ HR Review</p>
          <p>✔ Interview Process</p>
        </div>

        <div className="footer-section">
          <h3>Contact</h3>

          <p>Bole International Airport</p>
          <p>Addis Ababa, Ethiopia</p>
          <p>Email: careers@ethiopianairlines.com</p>
          <p>Phone: +251 11 665 6666</p>
        </div>

      </div>

      <hr />

      <div className="footer-bottom">
        <p>
          © {new Date().getFullYear()} Ethiopian Airlines. All Rights Reserved.
        </p>

        <p>Powered by AI Recruitment System</p>
      </div>
    </footer>
  );
}