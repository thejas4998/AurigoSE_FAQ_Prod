import React from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { logout, getCurrentUser } from '../Api/authAPI';
import './Layout.css';

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = getCurrentUser();

  const handleLogout = () => {
    const confirmLogout = window.confirm('Are you sure you want to logout?');
    if (confirmLogout) {
      logout();
      // The logout function already redirects to /login
    }
  };

  // Check if we're on the home page
  const isHomePage = location.pathname === '/';

  return (
    <div className="layout-container">
      <header className="layout-header">
        <div className="logo-title">
          <Link to="/" className="logo-link">
            <img src="/aurigo.png" alt="Aurigo Logo" className="logo" />
          </Link>
        </div>
        <nav className="nav-links">
          {/* Only show Home link when not on home page */}
          {!isHomePage && (
            <Link to="/">Home</Link>
          )}
          
          <div className="nav-divider"></div>
          
          <div className="user-section">
            {currentUser && (
              <span className="user-info">
                <svg className="user-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                {currentUser.name || currentUser.email}
              </span>
            )}
            
            <button onClick={handleLogout} className="logout-link">
              <svg className="logout-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </button>
          </div>
        </nav>
      </header>
      <main className="layout-main">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;