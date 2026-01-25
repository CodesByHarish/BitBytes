import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AuthForms.css';

const BLOCKS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

const StudentSignup = () => {
    const navigate = useNavigate();
    const { signupStudent } = useAuth();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        hostel: '',
        block: '',
        roomNumber: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            await signupStudent({
                email: formData.email,
                password: formData.password,
                hostel: formData.hostel,
                block: formData.block,
                roomNumber: formData.roomNumber
            });
            navigate('/dashboard/student');
        } catch (err) {
            setError(err.response?.data?.message || 'Signup failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <Link to="/" className="back-link">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Back to Home
                </Link>

                <div className="auth-header">
                    <div className="auth-icon student-icon">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 14L21 9L12 4L3 9L12 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M21 9V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M6 11.5V17C6 17 6 20 12 20C18 20 18 17 18 17V11.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <h1>Student Sign Up</h1>
                    <p>Create your student account to get started</p>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="your@email.com"
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-divider">
                        <span>Hostel Details</span>
                    </div>

                    <div className="form-group">
                        <label htmlFor="hostel">Hostel Type</label>
                        <select
                            id="hostel"
                            name="hostel"
                            value={formData.hostel}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select Hostel Type</option>
                            <option value="Boys Hostel">Boys Hostel</option>
                            <option value="Girls Hostel">Girls Hostel</option>
                        </select>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="block">Block / Wing</label>
                            <select
                                id="block"
                                name="block"
                                value={formData.block}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Block</option>
                                {BLOCKS.map((block) => (
                                    <option key={block} value={block}>
                                        Block {block}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="roomNumber">Room Number</label>
                            <input
                                type="text"
                                id="roomNumber"
                                name="roomNumber"
                                value={formData.roomNumber}
                                onChange={handleChange}
                                placeholder="e.g., 101"
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? (
                            <>
                                <span className="btn-spinner"></span>
                                Creating Account...
                            </>
                        ) : (
                            'Create Account'
                        )}
                    </button>
                </form>

                <p className="auth-footer">
                    Already have an account? <Link to="/login/student">Login here</Link>
                </p>
            </div>
        </div>
    );
};

export default StudentSignup;
