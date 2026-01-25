import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import ProfileDropdown from '../components/common/ProfileDropdown';
import AnnouncementTicker from '../components/common/AnnouncementTicker';
import { authAPI } from '../services/api';
import CommentSection from '../components/common/CommentSection';
import './Dashboard.css';

const StudentDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState(null); // null = show boxes, 'announcements' | 'report' | 'my-issues' | 'block-news' | 'lost-found' = show detail
    const [complaints, setComplaints] = useState([]);
    const [publicComplaints, setPublicComplaints] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null); // { id, type } for comments view
    const [lostFoundItems, setLostFoundItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [lfTab, setLfTab] = useState('browse'); // 'browse' or 'report'
    const [lfFormData, setLfFormData] = useState({
        title: '',
        description: '',
        type: 'lost',
        location: '',
        date: '',
        media: []
    });
    const [claimMessage, setClaimMessage] = useState('');
    const [showClaimModal, setShowClaimModal] = useState(null); // item ID

    // Form State
    const [formData, setFormData] = useState({
        category: 'plumbing',
        priority: 'medium',
        description: '',
        isPublic: false
    });

    useEffect(() => {
        fetchMyComplaints();
        fetchAnnouncements();
        fetchLostFoundItems();
        fetchPublicComplaints();
    }, []);

    const fetchPublicComplaints = async () => {
        try {
            const { data } = await authAPI.getPublicComplaints();
            setPublicComplaints(data);
        } catch (error) {
            console.error('Error fetching public complaints:', error);
        }
    };

    const fetchLostFoundItems = async () => {
        try {
            const { data } = await authAPI.getLostFoundItems();
            setLostFoundItems(data);
        } catch (error) {
            console.error('Error fetching lost/found items:', error);
        }
    };

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

    const handleLfSubmit = async (e) => {
        e.preventDefault();
        try {
            await authAPI.reportLostFoundItem(lfFormData);
            alert('Item reported successfully!');
            setLfFormData({ title: '', description: '', type: 'lost', location: '', date: '', media: [] });
            setLfTab('browse');
            fetchLostFoundItems();
        } catch (error) {
            console.error('Error reporting item:', error);
            alert('Failed to report item');
        }
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);

        files.forEach(file => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = () => {
                setLfFormData(prev => ({
                    ...prev,
                    media: [...prev.media, reader.result]
                }));
            };
        });
    };

    const removeImage = (index) => {
        setLfFormData(prev => ({
            ...prev,
            media: prev.media.filter((_, i) => i !== index)
        }));
    };

    const handleClaimSubmit = async (id) => {
        try {
            await authAPI.claimItem(id, claimMessage);
            alert('Claim submitted! Awaiting moderation.');
            setShowClaimModal(null);
            setClaimMessage('');
            fetchLostFoundItems();
        } catch (error) {
            console.error('Error submitting claim:', error);
            alert('Failed to submit claim');
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
            fetchMyComplaints();
            setActiveSection('my-issues');
        } catch (error) {
            console.error('Error raising complaint:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to raise complaint';
            alert(`Error: ${errorMessage}`);
        }
    };

    const handleBack = () => {
        setActiveSection(null);
    };

    const handleUpvote = async (id, type) => {
        try {
            if (type === 'announcement') {
                const { data } = await authAPI.upvoteAnnouncement(id);
                setAnnouncements(announcements.map(a => a._id === id ? { ...a, upvotes: data.upvotes } : a));
            } else {
                const { data } = await authAPI.upvoteComplaint(id);
                setPublicComplaints(publicComplaints.map(c => c._id === id ? { ...c, upvotes: data.upvotes } : c));
            }
        } catch (error) {
            console.error('Error upvoting:', error);
        }
    };

    // Render navigation boxes when no section is selected
    const renderNavigationBoxes = () => (
        <div className="nav-boxes-grid">
            <div
                className="nav-box announcements-box"
                onClick={() => setActiveSection('announcements')}
            >
                <div className="nav-box-icon">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <h3>Announcements</h3>
                <p>View global hostel announcements</p>
                {announcements.filter(a => a.type === 'general' || !a.type).length > 0 && (
                    <span className="nav-box-badge">
                        {announcements.filter(a => a.type === 'general' || !a.type).length}
                    </span>
                )}
            </div>

            <div
                className="nav-box report-box"
                onClick={() => setActiveSection('report')}
            >
                <div className="nav-box-icon">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <h3>Report Issue</h3>
                <p>Submit a new complaint or issue</p>
            </div>

            <div
                className="nav-box block-news-box"
                onClick={() => setActiveSection('block-news')}
            >
                <div className="nav-box-icon">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 16V8C21 6.89543 20.1046 6 19 6H5C3.89543 6 3 6.89543 3 8V16C3 17.1046 3.89543 18 5 18H19C20.1046 18 21 17.1046 21 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M7 10H7.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M11 10H11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M15 10H15.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <h3>Hostel Block News</h3>
                <p>Specific news for Block {user?.block}</p>
                {announcements.filter(a => a.type === 'block').length > 0 && (
                    <span className="nav-box-badge">
                        {announcements.filter(a => a.type === 'block').length}
                    </span>
                )}
            </div>

            <div
                className="nav-box lost-found-box"
                onClick={() => setActiveSection('lost-found')}
            >
                <div className="nav-box-icon">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <h3>Lost & Found</h3>
                <p>Check for lost belongings or report found items</p>
            </div>

            <div
                className="nav-box issues-box"
                onClick={() => setActiveSection('my-issues')}
            >
                <div className="nav-box-icon">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 5H7C6.46957 5 5.96086 5.21071 5.58579 5.58579C5.21071 5.96086 5 6.46957 5 7V19C5 19.5304 5.21071 20.0391 5.58579 20.4142C5.96086 20.7893 6.46957 21 7 21H17C17.5304 21 18.0391 20.7893 18.4142 20.4142C18.7893 20.0391 19 19.5304 19 19V7C19 6.46957 18.7893 5.96086 18.4142 5.58579C18.0391 5.21071 17.5304 5 17 5H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M9 5C9 4.46957 9.21071 3.96086 9.58579 3.58579C9.96086 3.21071 10.4696 3 11 3H13C13.5304 3 14.0391 3.21071 14.4142 3.58579C14.7893 3.96086 15 4.46957 15 5C15 5.53043 14.7893 6.03914 14.4142 6.41421C14.0391 6.78929 13.5304 7 13 7H11C10.4696 7 9.96086 6.78929 9.58579 6.41421C9.21071 6.03914 9 5.53043 9 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <h3>My Issues</h3>
                <p>Track your submitted complaints</p>
                {complaints.length > 0 && (
                    <span className="nav-box-badge">{complaints.length}</span>
                )}
            </div>

            <div
                className="nav-box community-box"
                onClick={() => setActiveSection('community')}
            >
                <div className="nav-box-icon">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M23 21V19C22.9993 18.1137 22.7044 17.2524 22.1614 16.5523C21.6184 15.8522 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55117C18.7122 5.25162 19.0078 6.1134 19.0078 7.0005C19.0078 7.8876 18.7122 8.74938 18.1676 9.44983C17.623 10.1503 16.8604 10.6507 16 10.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <h3>Community Feed</h3>
                <p>Discuss public issues & announcements</p>
                {publicComplaints.length > 0 && (
                    <span className="nav-box-badge" style={{ background: '#3b82f6' }}>{publicComplaints.length}</span>
                )}
            </div>
        </div>
    );

    // Render Announcements detail view
    const renderAnnouncementsView = () => (
        <div className="detail-view">
            <button className="back-btn" onClick={handleBack}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Back
            </button>
            <div className="detail-header">
                <h2>📢 Announcements</h2>
            </div>
            <div className="detail-content">
                {loading ? <p>Loading...</p> : announcements.filter(a => a.type === 'general' || !a.type).length === 0 ? (
                    <div className="empty-state">
                        <p>No active general announcements.</p>
                    </div>
                ) : (
                    <div className="active-announcements-list">
                        {announcements.filter(a => a.type === 'general' || !a.type).map(a => (
                            <div key={a._id} className={`announcement-item ${a.priority}`}>
                                <div className="announcement-content-main">
                                    <div className="announcement-text">{a.text}</div>
                                    {a.deadlineDate && (
                                        <div className="announcement-date-badge">
                                            📅 Deadline: {new Date(a.deadlineDate).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                                <div className="announcement-meta">
                                    <span>Posted: {new Date(a.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="social-actions" style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                                    <button
                                        className={`social-btn ${a.upvotes?.includes(user?._id) ? 'active' : ''}`}
                                        onClick={() => handleUpvote(a._id, 'announcement')}
                                    >
                                        👍 {a.upvotes?.length || 0}
                                    </button>
                                    <button
                                        className="social-btn"
                                        onClick={() => setSelectedItem(selectedItem?.id === a._id ? null : { id: a._id, type: 'Announcement' })}
                                    >
                                        💬 {selectedItem?.id === a._id ? 'Close Discussion' : 'Join Discussion'}
                                    </button>
                                </div>
                                {selectedItem?.id === a._id && (
                                    <div className="nested-comments-area" style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
                                        <CommentSection entityId={a._id} entityType="Announcement" currentUser={{ id: user?._id }} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    // Render Report Issue form view
    const renderReportView = () => (
        <div className="detail-view">
            <button className="back-btn" onClick={handleBack}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Back
            </button>
            <div className="detail-header">
                <h2>📝 Report Issue</h2>
            </div>
            <div className="detail-content">
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
            </div>
        </div>
    );

    // Render My Issues view
    const renderMyIssuesView = () => (
        <div className="detail-view">
            <button className="back-btn" onClick={handleBack}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Back
            </button>
            <div className="detail-header">
                <h2>📋 My Issues</h2>
                <span className="issue-count">{complaints.length} Total</span>
            </div>
            <div className="detail-content">
                {loading ? <p>Loading...</p> : complaints.length === 0 ? (
                    <div className="empty-state">
                        <p>No complaints raised yet.</p>
                        <button className="submit-btn" onClick={() => setActiveSection('report')}>
                            Report Your First Issue
                        </button>
                    </div>
                ) : (
                    <div className="complaints-list">
                        {complaints.map(complaint => (
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

                                {complaint.status === 'merged' && (
                                    <div className="merged-notice" style={{ marginTop: '0.8rem', padding: '0.8rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                        <p style={{ fontSize: '0.85rem', color: '#60a5fa', margin: 0 }}>
                                            🔗 This issue has been merged into a primary community report to streamline resolution.
                                        </p>
                                        <button
                                            className="reply-btn"
                                            style={{ marginTop: '0.5rem', padding: 0 }}
                                            onClick={() => setActiveSection('community')}
                                        >
                                            View Primary Discussion →
                                        </button>
                                    </div>
                                )}

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
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    // Render Hostel Block News view
    const renderBlockNewsView = () => (
        <div className="detail-view">
            <button className="back-btn" onClick={handleBack}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Back
            </button>
            <div className="detail-header">
                <h2>🎯 Hostel Block News</h2>
            </div>
            <div className="detail-content">
                {loading ? <p>Loading...</p> : announcements.filter(a => a.type === 'block').length === 0 ? (
                    <div className="empty-state">
                        <div className="coming-soon-icon">🎯</div>
                        <p>No specific news for Block {user?.block} yet. Stay tuned!</p>
                    </div>
                ) : (
                    <div className="active-announcements-list">
                        {announcements.filter(a => a.type === 'block').map(a => (
                            <div key={a._id} className={`announcement-item ${a.priority}`}>
                                <div className="announcement-content-main">
                                    <div className="announcement-text">{a.text}</div>
                                    {a.deadlineDate && (
                                        <div className="announcement-date-badge">
                                            📅 Deadline: {new Date(a.deadlineDate).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                                <div className="announcement-meta">
                                    <span>Posted: {new Date(a.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="social-actions" style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                                    <button
                                        className={`social-btn ${a.upvotes?.includes(user?._id) ? 'active' : ''}`}
                                        onClick={() => handleUpvote(a._id, 'announcement')}
                                    >
                                        👍 {a.upvotes?.length || 0}
                                    </button>
                                    <button
                                        className="social-btn"
                                        onClick={() => setSelectedItem(selectedItem?.id === a._id ? null : { id: a._id, type: 'Announcement' })}
                                    >
                                        💬 {selectedItem?.id === a._id ? 'Close Discussion' : 'Join Discussion'}
                                    </button>
                                </div>
                                {selectedItem?.id === a._id && (
                                    <div className="nested-comments-area" style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
                                        <CommentSection entityId={a._id} entityType="Announcement" currentUser={{ id: user?._id }} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    // Render Lost & Found view
    const renderLostFoundView = () => (
        <div className="detail-view">
            <button className="back-btn" onClick={handleBack}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Back
            </button>
            <div className="detail-header">
                <h2>🔍 Lost & Found</h2>
                <div className="header-actions" style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        className={`tab-btn ${lfTab === 'browse' ? 'active' : ''}`}
                        onClick={() => setLfTab('browse')}
                    >
                        Browse
                    </button>
                    <button
                        className={`tab-btn ${lfTab === 'report' ? 'active' : ''}`}
                        onClick={() => setLfTab('report')}
                    >
                        Report Item
                    </button>
                </div>
            </div>

            <div className="detail-content">
                {lfTab === 'report' ? (
                    <div className="report-form-container">
                        <form onSubmit={handleLfSubmit} className="complaint-form">
                            <div className="form-group">
                                <label>Report Type</label>
                                <select
                                    value={lfFormData.type}
                                    onChange={(e) => setLfFormData({ ...lfFormData, type: e.target.value })}
                                >
                                    <option value="lost">Lost Item</option>
                                    <option value="found">Found Item</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Item Name</label>
                                <input
                                    type="text"
                                    value={lfFormData.title}
                                    onChange={(e) => setLfFormData({ ...lfFormData, title: e.target.value })}
                                    placeholder="Blue Wallet, iPhone Case, etc."
                                    required
                                    style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={lfFormData.description}
                                    onChange={(e) => setLfFormData({ ...lfFormData, description: e.target.value })}
                                    placeholder="Describe the item in detail..."
                                    required
                                    style={{ minHeight: '100px' }}
                                />
                            </div>
                            <div className="form-footer" style={{ gap: '1rem' }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Location</label>
                                    <input
                                        type="text"
                                        value={lfFormData.location}
                                        onChange={(e) => setLfFormData({ ...lfFormData, location: e.target.value })}
                                        placeholder="Where was it seen?"
                                        required
                                        style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                                    />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Date</label>
                                    <input
                                        type="date"
                                        value={lfFormData.date}
                                        onChange={(e) => setLfFormData({ ...lfFormData, date: e.target.value })}
                                        className="date-input"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Item Images (Optional)</label>
                                <div className="image-upload-area">
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        id="lf-image-input"
                                        hidden
                                    />
                                    <label htmlFor="lf-image-input" className="upload-placeholder">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                            <circle cx="8.5" cy="8.5" r="1.5" />
                                            <polyline points="21 15 16 10 5 21" />
                                        </svg>
                                        <span>Click to add photos</span>
                                    </label>
                                </div>
                                {lfFormData.media.length > 0 && (
                                    <div className="image-previews-grid">
                                        {lfFormData.media.map((base64, idx) => (
                                            <div key={idx} className="preview-container">
                                                <img src={base64} alt="preview" />
                                                <button type="button" onClick={() => removeImage(idx)} className="remove-preview">×</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button type="submit" className="submit-btn" style={{ marginTop: '1rem' }}>Post to Portal</button>
                        </form>
                    </div>
                ) : (
                    <div className="complaints-list">
                        {lostFoundItems.length === 0 ? (
                            <div className="empty-state">
                                <p>No items reported yet.</p>
                            </div>
                        ) : (
                            lostFoundItems.map(item => (
                                <div key={item._id} className={`complaint-card ${item.type === 'found' ? 'management-card' : ''}`}>
                                    <div className="card-header">
                                        <span className={`priority-badge ${item.type === 'found' ? 'low' : item.type === 'lost' ? 'high' : ''}`}>
                                            {item.type}
                                        </span>
                                        <span className="status-badge" style={{ color: item.status === 'open' ? '#34d399' : '#fbbf24' }}>
                                            {item.status}
                                        </span>
                                    </div>

                                    {item.media && item.media.length > 0 && (
                                        <div className="item-card-image">
                                            <img src={item.media[0]} alt={item.title} />
                                        </div>
                                    )}

                                    <h3 style={{ margin: '0.5rem 0' }}>{item.title}</h3>
                                    <p className="description-preview">{item.description}</p>
                                    <div className="caretaker-info" style={{ background: 'rgba(255,255,255,0.05)', fontSize: '0.8rem' }}>
                                        📍 {item.location} • 📅 {new Date(item.date).toLocaleDateString()}
                                    </div>
                                    <div className="card-footer" style={{ border: 'none', padding: '0', marginTop: '1rem' }}>
                                        {item.status === 'open' && item.type === 'found' && item.reportedBy?._id !== user.id && (
                                            <button
                                                className="approve-btn"
                                                onClick={() => setShowClaimModal(item._id)}
                                                style={{ width: '100%' }}
                                            >
                                                Claim Item
                                            </button>
                                        )}
                                        {item.status === 'claimed' && item.claimant?._id === user.id && (
                                            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                                                ⏳ Claim pending review
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    // Render Community Feed view
    const renderCommunityFeedView = () => (
        <div className="detail-view">
            <button className="back-btn" onClick={() => setActiveSection(null)}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Back
            </button>
            <div className="detail-header">
                <h2>🌎 Community Feed</h2>
                <p style={{ fontSize: '0.9rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                    Collaborate with others to highlight recurring issues.
                </p>
            </div>

            <div className="detail-content">
                {loading ? <p>Loading feed...</p> : publicComplaints.length === 0 ? (
                    <div className="empty-state">
                        <p>No public discussions yet.</p>
                    </div>
                ) : (
                    <div className="complaints-list">
                        {publicComplaints.map(item => (
                            <div key={item._id} className="complaint-card community-card" style={{ borderLeft: '4px solid #3b82f6' }}>
                                <div className="card-header">
                                    <span className={`priority-badge ${item.priority}`}>
                                        {item.category}
                                    </span>
                                    <span className="status-badge" style={{ color: item.status === 'resolved' ? '#10b981' : '#fbbf24' }}>
                                        {item.status?.toUpperCase() || 'REPORTED'}
                                    </span>
                                </div>
                                <h3 style={{ margin: '0.5rem 0' }}>{item.description}</h3>
                                <div className="caretaker-info" style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                                    👤 {item.student?.email} • 📍 Block {item.student?.block}
                                </div>

                                <div className="social-actions" style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                                    <button
                                        className={`social-btn ${item.upvotes?.includes(user?._id) ? 'active' : ''}`}
                                        onClick={() => handleUpvote(item._id, 'complaint')}
                                    >
                                        ☝️ Validate {item.upvotes?.length || 0}
                                    </button>
                                    <button
                                        className="social-btn"
                                        onClick={() => setSelectedItem(selectedItem?.id === item._id ? null : { id: item._id, type: 'Complaint' })}
                                    >
                                        💬 {selectedItem?.id === item._id ? 'Close Discussion' : 'Join Discussion'}
                                    </button>
                                </div>

                                {selectedItem?.id === item._id && (
                                    <div className="nested-comments-area" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                        <CommentSection entityId={item._id} entityType="Complaint" currentUser={{ id: user?._id }} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

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
                {/* Only show welcome card on main navigation screen */}
                {activeSection === null && (
                    <div className="welcome-card">
                        <div className="welcome-content">
                            <h2>Welcome back! 👋</h2>
                            <p>{user?.hostel} • Block {user?.block} • Room {user?.roomNumber}</p>
                        </div>
                    </div>
                )}

                {/* Conditional Rendering based on activeSection */}
                {activeSection === null && renderNavigationBoxes()}
                {activeSection === 'announcements' && renderAnnouncementsView()}
                {activeSection === 'report' && renderReportView()}
                {activeSection === 'block-news' && renderBlockNewsView()}
                {activeSection === 'lost-found' && renderLostFoundView()}
                {activeSection === 'my-issues' && renderMyIssuesView()}
                {activeSection === 'community' && renderCommunityFeedView()}

                {showClaimModal && (
                    <div className="modal-overlay">
                        <div className="report-form-container" style={{ maxWidth: '400px' }}>
                            <h3>Claim Item</h3>
                            <p style={{ fontSize: '0.9rem', color: '#9ca3af', marginBottom: '1rem' }}>
                                Please provide a detailed description or proof to verify this is your item.
                            </p>
                            <textarea
                                value={claimMessage}
                                onChange={(e) => setClaimMessage(e.target.value)}
                                placeholder="Describe the item in detail..."
                                style={{ width: '100%', minHeight: '100px', marginBottom: '1rem' }}
                                required
                            />
                            <div className="inline-btns">
                                <button
                                    onClick={() => handleClaimSubmit(showClaimModal)}
                                    className="save-btn"
                                    style={{ flex: 1, padding: '0.75rem' }}
                                >
                                    Submit Claim
                                </button>
                                <button
                                    onClick={() => setShowClaimModal(null)}
                                    className="cancel-btn"
                                    style={{ flex: 1, padding: '0.75rem' }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default StudentDashboard;
