import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LandingPage.css';

const LandingPage = () => {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const handleContinue = () => {
        if (user?.role === 'student') {
            navigate('/dashboard/student');
        } else {
            navigate('/dashboard/management');
        }
    };
    return (
        <div className="landing-page">
            {/* Hero Section */}
            <header className="hero">
                <div className="hero-content">
                    <div className="logo-container">
                        <div className="logo-icon">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 21V8L12 3L21 8V21H15V14H9V21H3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <h1 className="logo-text">HostelEase</h1>
                    </div>
                    <p className="tagline">Keeping Hostel at Ease</p>
                </div>
            </header>

            {/* Main Content */}
            <main className="main-content">
                {!isAuthenticated && (
                    <>
                        {/* Login Section */}
                        <section className="auth-section login-section">
                            <h2 className="section-title">Login</h2>
                            <p className="section-subtitle">Login to continue where you left off</p>

                            <div className="cards-container">
                                <Link to="/login/student" className="auth-card login-card student-login">
                                    <div className="card-icon">
                                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M15 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M10 17L15 12L10 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    <h3>Login as Student</h3>
                                    <span className="card-arrow">→</span>
                                </Link>

                                <Link to="/login/management" className="auth-card login-card management-login">
                                    <div className="card-icon">
                                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M15 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M10 17L15 12L10 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    <h3>Login as Management</h3>
                                    <span className="card-arrow">→</span>
                                </Link>
                            </div>
                        </section>

                        {/* Divider */}
                        <div className="divider">
                            <span>or create an account</span>
                        </div>
                    </>
                )}

                {/* Signup Section */}
                <section className="auth-section">
                    {isAuthenticated ? (
                        <div className="welcome-back-container">
                            <h2 className="section-title">Welcome back, {user?.email}! 👋</h2>
                            <p className="section-subtitle">You are already logged in to your account</p>

                            <button onClick={handleContinue} className="continue-btn">
                                Continue to Dashboard
                                <span className="btn-arrow">→</span>
                            </button>
                        </div>
                    ) : (
                        <>
                            <h2 className="section-title">Get Started</h2>
                            <p className="section-subtitle">Create your account to access all features</p>

                            <div className="cards-container">
                                <Link to="/signup/student" className="auth-card student-card">
                                    <div className="card-icon">
                                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12 14L21 9L12 4L3 9L12 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M21 9V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M6 11.5V17C6 17 6 20 12 20C18 20 18 17 18 17V11.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    <h3>Sign Up as Student</h3>
                                    <p>Access complaint system, track requests, and stay updated</p>
                                    <span className="card-arrow">→</span>
                                </Link>

                                <Link to="/signup/management" className="auth-card management-card">
                                    <div className="card-icon">
                                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                                            <path d="M20 8V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                            <path d="M23 11H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                    </div>
                                    <h3>Sign Up as Management</h3>
                                    <p>Manage complaints, assign tasks, and oversee operations</p>
                                    <span className="card-arrow">→</span>
                                </Link>
                            </div>
                        </>
                    )}
                </section>
            </main>

            {/* Footer */}
            <footer className="footer">
                <p>© 2026 HostelEase. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default LandingPage;
