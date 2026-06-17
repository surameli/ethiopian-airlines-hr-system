import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo1.png";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <img src={logo} alt="Ethiopian Airlines" className="logo" />
      </Link>

      <div className="navbar-links">
        <Link to="/jobs">Jobs</Link>

        {!user ? (
          <>
            <Link to="/login" className="btn-outline">
              Login
            </Link>
            <Link to="/register" className="btn-primary">
              Apply Now
            </Link>
          </>
        ) : (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <span className="navbar-role">{user.role}</span>
            <button onClick={handleLogout} className="btn-outline">
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}