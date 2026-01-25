import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import ProfileDropdown from '../components/common/ProfileDropdown';
import AnnouncementTicker from '../components/common/AnnouncementTicker';
import { authAPI } from '../services/api';
import './Dashboard.css';

const StudentDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('announcements');
    const [complaints, setComplaints] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        category: 'plumbing',
        priority: 'medium',
        description: '',
        isPublic: false
    });

    useEffect(() => {
        if (activeTab === 'my-issues') {
            fetchMyComplaints();
        } else if (activeTab === 'announcements') {
            fetchAnnouncements();
        }
    }, [activeTab]);

    const fetchMyComplaints = async () => {
        try {
            setLoading(true);
            const { data } = await authAPI.getMyComplaints();
            setComplaints(data);
        } catch (error) {
            console.error('Error fetching complaints:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const { data } = await authAPI.getAnnouncements();
            setAnnouncements(data);
        } catch (error) {
            console.error('Error fetching announcements:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await authAPI.createComplaint(formData);
            alert('Complaint raised successfully!');
            setFormData({
                category: 'plumbing',
                priority: 'medium',
                description: '',
                isPublic: false
            });
            setActiveTab('my-issues');
        } catch (error) {
            console.error('Error raising complaint:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to raise complaint';
            alert(`Error: ${errorMessage}`);
        }
    };

    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <div className="header-left">
                    <Link to="/" className="logo-link">
                        <div className="logo-mini">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 21V8L12 3L21 8V21H15V14H9V21H3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <h1>HostelEase</h1>
                    </Link>
                </div>
                <div className="header-right">
                    <ProfileDropdown />
                </div>
            </header>

            <AnnouncementTicker />

            <main className="dashboard-main">
                <div className="welcome-card">
                    <div className="welcome-content">
                        <h2>Welcome back! 👋</h2>
                        <p>{user?.hostel} • Block {user?.block} • Room {user?.roomNumber}</p>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="dashboard-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'announcements' ? 'active' : ''}`}
                        onClick={() => setActiveTab('announcements')}
                    >
                        Announcements
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'report' ? 'active' : ''}`}
                        onClick={() => setActiveTab('report')}
                    >
                        Report Issue
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'my-issues' ? 'active' : ''}`}
                        onClick={() => setActiveTab('my-issues')}
                    >
                        My Issues
                    </button>
                </div>

                {/* Tab Content */}
                <div className="tab-content">
                    {activeTab === 'report' && (
                        <div className="report-form-container">
                            <form onSubmit={handleSubmit} className="complaint-form">
                                <div className="form-group">
                                    <label>Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="plumbing">🚰 Plumbing</option>
                                        <option value="electrical">⚡ Electrical</option>
                                        <option value="cleanliness">🧹 Cleanliness</option>
                                        <option value="internet">Wi-Fi / Internet</option>
                                        <option value="furniture">Furniture</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Priority</label>
                                    <select
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="emergency">🚨 Emergency</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Describe the issue in detail..."
                                        rows="4"
                                        required
                                    />
                                </div>

                                <div className="form-checkbox">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={formData.isPublic}
                                            onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                                        />
                                        Make this issue public (visible to other students)
                                    </label>
                                </div>

                                <button type="submit" className="submit-btn">Raise Complaint</button>
                            </form>
                        </div>
                    )}

                    {activeTab === 'my-issues' && (
                        <div className="complaints-list">
                            {loading ? <p>Loading...</p> : complaints.length === 0 ? (
                                <div className="empty-state">
                                    <p>No complaints raised yet.</p>
                                </div>
                            ) : (
                                complaints.map(complaint => (
                                    <div key={complaint._id} className="complaint-card">
                                        <div className="card-header">
                                            <span className={`priority-badge ${complaint.priority}`}>
                                                {complaint.priority}
                                            </span>
                                            <span className={`status-badge ${complaint.status}`}>
                                                {complaint.status}
                                            </span>
                                        </div>
                                        <h3>{complaint.category}</h3>
                                        <p>{complaint.description}</p>
                                        {complaint.caretaker && (
                                            <div className="caretaker-info">
                                                Caretaker: <strong>{complaint.caretaker}</strong>
                                            </div>
                                        )}
                                        <div className="card-footer">
                                            <span className="date">
                                                {new Date(complaint.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'announcements' && (
                        <div className="active-announcements-list">
                            {loading ? <p>Loading...</p> : announcements.length === 0 ? (
                                <div className="empty-state">
                                    <p>No active announcements.</p>
                                </div>
                            ) : (
                                announcements.map(a => (
                                    <div key={a._id} className={`announcement-item ${a.priority}`}>
                                        <div className="announcement-text">{a.text}</div>
                                        <div className="announcement-meta">
                                            <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default StudentDashboard;
