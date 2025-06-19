import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginWithCredentials, loginWithAzureAD } from '../Api/authAPI';
import './Login.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await loginWithCredentials(email, password);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAzureLogin = async () => {
    setError('');
    setIsLoading(true);

    try {
      // In a real app, this would redirect to Azure AD login
      // For now, we'll simulate it
      await loginWithAzureAD();
      // Azure AD would redirect back with a token
      // which we'd store and then navigate
      navigate('/');
    } catch (err: any) {
      setError('Azure AD login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="login-container"
      style={{
        backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${process.env.PUBLIC_URL}/bg.jpg)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <div className="login-box">
        <div className="login-header">
          <div className="logo-section">
            {/* Option 1: Using an image file */}
            { <img 
              src={`${process.env.PUBLIC_URL}/aurigo.png`} 
              alt="Aurigo" 
              className="aurigo-logo"
            /> }
            
          </div>
          <h1 className="portal-title">FAQ Portal</h1>
        </div>

        <form onSubmit={handleCredentialLogin} className="login-form">
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
              disabled={isLoading}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              disabled={isLoading}
              className="form-input"
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="login-button primary"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="divider">
          <span>OR</span>
        </div>

        <button
          onClick={handleAzureLogin}
          disabled={isLoading}
          className="login-button azure"
        >
          <svg className="azure-icon" viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M13.55 1a.77.77 0 00-.72.5l-4.83 11.88L2.33 23h6.25l1.85-3.43h6.3l1.87 3.43h6.4L13.55 1zm.01 5.98l2.48 6.02h-5l2.52-6.02z"/>
          </svg>
          Sign in with Microsoft
        </button>

        <div className="login-footer">
          <p>New to the platform? Contact your administrator for access.</p>
          <p className="copyright">© 2025 Aurigo Software Technologies</p>
        </div>
      </div>
    </div>
  );
};

export default Login;