import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import ProfileDropdown from '../components/common/ProfileDropdown';
import './Dashboard.css';

const ManagementDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('issues');
    const [complaints, setComplaints] = useState([]);
    const [pendingUsers, setPendingUsers] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [newAnnouncement, setNewAnnouncement] = useState({
        text: '',
        priority: 'medium'
    });
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({
        students: 0,
        pending: 0,
        resolved: 0
    });

    // Action State
    const [actionId, setActionId] = useState(null); // ID of complaint being edited
    const [actionType, setActionType] = useState(null); // 'assign', 'status', 'priority'
    const [actionValue, setActionValue] = useState('');
    const [actionComment, setActionComment] = useState('');

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'issues') {
                const { data } = await authAPI.getAllComplaints();
                setComplaints(data);
                // Calculate stats from complaints
                const pending = data.filter(c => c.status !== 'resolved' && c.status !== 'closed').length;
                const resolved = data.filter(c => c.status === 'resolved' || c.status === 'closed').length;
                setStats(s => ({ ...s, pending, resolved }));
            } else if (activeTab === 'users' && user?.isAdmin) {
                const { data } = await authAPI.getPendingUsers();
                setPendingUsers(data);
            } else if (activeTab === 'announcements') {
                const { data } = await authAPI.getAnnouncements();
                setAnnouncements(data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            const msg = error.response?.data?.message || error.message;
            alert(`Fetch Error: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    const handleAnnouncementSubmit = async (e) => {
        e.preventDefault();
        try {
            await authAPI.createAnnouncement(newAnnouncement);
            setNewAnnouncement({ text: '', priority: 'medium' });
            const { data } = await authAPI.getAnnouncements();
            setAnnouncements(data);
            alert('Announcement posted!');
        } catch (error) {
            console.error('Error posting announcement:', error);
            alert('Failed to post announcement');
        }
    };

    const handleDeleteAnnouncement = async (id) => {
        if (!window.confirm('Delete this announcement?')) return;
        try {
            await authAPI.deleteAnnouncement(id);
            setAnnouncements(announcements.filter(a => a._id !== id));
        } catch (error) {
            console.error('Error deleting announcement:', error);
        }
    };

    const handleActionSubmit = async (e) => {
        e.preventDefault();
        try {
            if (actionType === 'assign') {
                await authAPI.assignCaretaker(actionId, actionValue);
            } else if (actionType === 'status') {
                await authAPI.updateComplaintStatus(actionId, actionValue, actionComment);
            } else if (actionType === 'priority') {
                await authAPI.updateComplaintPriority(actionId, actionValue, actionComment);
            }

            setActionId(null);
            setActionType(null);
            setActionValue('');
            setActionComment('');
            fetchData(); // Refresh list
            alert('Updated successfully!');
        } catch (error) {
            console.error('Error performing action:', error);
            alert('Action failed');
        }
    };

    const handleApprove = async (id) => {
        try {
            await authAPI.approveUser(id);
            setPendingUsers(pendingUsers.filter(u => u._id !== id));
        } catch (error) {
            console.error('Error approving user:', error);
            alert('Failed to approve user');
        }
    };

    return (
        <div className="dashboard management-dashboard">
            <header className="dashboard-header">
                <div className="header-left">
                    <Link to="/" className="logo-link">
                        <div className="logo-mini management-logo">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 21V8L12 3L21 8V21H15V14H9V21H3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <h1>HostelEase</h1>
                    </Link>
                    <span className="admin-badge">Management</span>
                </div>
                <div className="header-right">
                    <ProfileDropdown />
                </div>
            </header>

            <main className="dashboard-main">
                <div className="welcome-card management-welcome">
                    <div className="welcome-content">
                        <h2>Management Portal 🏢</h2>
                        <p>Overseeing hostel operations and student wellbeing.</p>
                        {user?.isAdmin && <span className="admin-tag">Super Admin Access</span>}
                    </div>
                </div>

                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                            </svg>
                        </div>
                        <div className="stat-content">
                            <span className="stat-value">{complaints.length}</span>
                            <span className="stat-label">Total Issues</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon pending-icon">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                            </svg>
                        </div>
                        <div className="stat-content">
                            <span className="stat-value">{stats.pending}</span>
                            <span className="stat-label">Active Issues</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon resolved-icon">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18457 2.99721 7.13633 4.39828 5.49707C5.79935 3.85782 7.69279 2.71538 9.79619 2.24015C11.8996 1.76491 14.1003 1.98234 16.07 2.86" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <div className="stat-content">
                            <span className="stat-value">{stats.resolved}</span>
                            <span className="stat-label">Resolved</span>
                        </div>
                    </div>
                </div>

                {/* Management Tabs */}
                <div className="dashboard-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'issues' ? 'active' : ''}`}
                        onClick={() => setActiveTab('issues')}
                    >
                        Active Issues
                    </button>
                    {user?.isAdmin && (
                        <button
                            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
                            onClick={() => setActiveTab('users')}
                        >
                            Pending Users
                        </button>
                    )}
                    <button
                        className={`tab-btn ${activeTab === 'announcements' ? 'active' : ''}`}
                        onClick={() => setActiveTab('announcements')}
                    >
                        Announcements
                    </button>
                </div>

                <div className="tab-content">
                    {activeTab === 'issues' && (
                        <div className="management-issues-list">
                            {loading ? <p>Loading...</p> : complaints.length === 0 ? (
                                <p className="no-pending">No complaints reported yet.</p>
                            ) : (
                                complaints.map(complaint => (
                                    <div key={complaint._id} className="complaint-card management-card">
                                        <div className="card-header">
                                            <div className="header-meta">
                                                <span className={`priority-badge ${complaint.priority}`}>
                                                    {complaint.priority}
                                                </span>
                                                <span className={`status-badge ${complaint.status}`}>
                                                    {complaint.status}
                                                </span>
                                            </div>
                                            <div className="location-tag">
                                                {complaint.hostel} • {complaint.block}-{complaint.roomNumber}
                                            </div>
                                        </div>

                                        <div className="complaint-body">
                                            <h3>{complaint.category}</h3>
                                            <p className="reporter">By: {complaint.student?.email}</p>
                                            <p className="description">{complaint.description}</p>
                                            {complaint.caretaker && (
                                                <div className="caretaker-info">
                                                    👷 Caretaker: <strong>{complaint.caretaker}</strong>
                                                </div>
                                            )}
                                        </div>

                                        <div className="complaint-actions">
                                            {actionId === complaint._id ? (
                                                <form onSubmit={handleActionSubmit} className="action-inline-form">
                                                    {actionType === 'assign' && (
                                                        <input
                                                            type="text"
                                                            placeholder="Caretaker Name"
                                                            value={actionValue}
                                                            onChange={(e) => setActionValue(e.target.value)}
                                                            required
                                                        />
                                                    )}
                                                    {actionType === 'status' && (
                                                        <select
                                                            value={actionValue}
                                                            onChange={(e) => setActionValue(e.target.value)}
                                                            required
                                                        >
                                                            <option value="">Update Status</option>
                                                            <option value="in-progress">In Progress</option>
                                                            <option value="resolved">Resolved</option>
                                                            <option value="closed">Closed</option>
                                                            <option value="reported">Re-open (Reported)</option>
                                                        </select>
                                                    )}
                                                    {actionType === 'priority' && (
                                                        <select
                                                            value={actionValue}
                                                            onChange={(e) => setActionValue(e.target.value)}
                                                            required
                                                        >
                                                            <option value="">Update Priority</option>
                                                            <option value="low">Low</option>
                                                            <option value="medium">Medium</option>
                                                            <option value="high">High</option>
                                                            <option value="emergency">Emergency</option>
                                                        </select>
                                                    )}
                                                    <textarea
                                                        placeholder="Optional remarks..."
                                                        value={actionComment}
                                                        onChange={(e) => setActionComment(e.target.value)}
                                                    />
                                                    <div className="inline-btns">
                                                        <button type="submit" className="save-btn">Save</button>
                                                        <button type="button" onClick={() => setActionId(null)} className="cancel-btn">Cancel</button>
                                                    </div>
                                                </form>
                                            ) : (
                                                <>
                                                    <button onClick={() => { setActionId(complaint._id); setActionType('assign'); setActionValue(complaint.caretaker || ''); }}>
                                                        {complaint.caretaker ? 'Reassign' : 'Assign Caretaker'}
                                                    </button>
                                                    <button onClick={() => { setActionId(complaint._id); setActionType('status'); setActionValue(complaint.status); }}>
                                                        Update Status
                                                    </button>
                                                    <button onClick={() => { setActionId(complaint._id); setActionType('priority'); setActionValue(complaint.priority); }}>
                                                        Change Priority
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'users' && user?.isAdmin && (
                        <div className="admin-section">
                            <h3>Pending Manager Registrations</h3>
                            {pendingUsers.length === 0 ? (
                                <p className="no-pending">No pending approvals</p>
                            ) : (
                                <div className="pending-list">
                                    {pendingUsers.map(u => (
                                        <div key={u._id} className="pending-user-card">
                                            <div className="pending-info">
                                                <span className="pending-email">{u.email}</span>
                                                <span className="pending-date">Registered on {new Date(u.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <button onClick={() => handleApprove(u._id)} className="approve-btn">
                                                Approve Account
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'announcements' && (
                        <div className="announcements-management">
                            <div className="create-announcement-card">
                                <h3>Post New Announcement</h3>
                                <form onSubmit={handleAnnouncementSubmit} className="announcement-form">
                                    <textarea
                                        placeholder="What's happening in the hostel? (Max 150 chars)"
                                        maxLength="150"
                                        value={newAnnouncement.text}
                                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, text: e.target.value })}
                                        required
                                    />
                                    <div className="form-footer">
                                        <select
                                            value={newAnnouncement.priority}
                                            onChange={(e) => setNewAnnouncement({ ...newAnnouncement, priority: e.target.value })}
                                        >
                                            <option value="low">Low Priority</option>
                                            <option value="medium">Medium Priority</option>
                                            <option value="high">High Priority</option>
                                            <option value="urgent">🚨 Urgent</option>
                                        </select>
                                        <button type="submit" className="post-btn">Post Announcement</button>
                                    </div>
                                </form>
                            </div>

                            <div className="active-announcements-list">
                                <h3>Active Announcements</h3>
                                {announcements.length === 0 ? (
                                    <p className="no-pending">No active announcements.</p>
                                ) : (
                                    announcements.map(a => (
                                        <div key={a._id} className={`announcement-item ${a.priority}`}>
                                            <div className="announcement-text">{a.text}</div>
                                            <div className="announcement-meta">
                                                <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                                                <button onClick={() => handleDeleteAnnouncement(a._id)} className="delete-icon-btn">
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ManagementDashboard;
