import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import ProfileDropdown from '../components/common/ProfileDropdown';
import CommentSection from '../components/common/CommentSection';
import LeaveListAdmin from '../components/leaves/LeaveListAdmin';
import './Dashboard.css';

const ManagementDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('issues');
    const [complaints, setComplaints] = useState([]);
    const [pendingUsers, setPendingUsers] = useState([]);
    const [staff, setStaff] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [lostFoundItems, setLostFoundItems] = useState([]);
    const [newAnnouncement, setNewAnnouncement] = useState({
        text: '',
        priority: 'medium',
        category: 'general',
        deadlineDate: '',
        type: 'general',
        targetBlocks: [],
        targetRoles: []
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
    const [actionId2, setActionId2] = useState(''); // Used for caretakerId
    const [actionComment, setActionComment] = useState('');
    const [publicFilter, setPublicFilter] = useState(false); // For analytics tab
    const [selectedItem, setSelectedItem] = useState(null); // { id, type }
    const [selectedIssues, setSelectedIssues] = useState([]); // Array of IDs
    const [showMergeModal, setShowMergeModal] = useState(false);

    const [pendingRoleData, setPendingRoleData] = useState({}); // { userId: { managementRole, staffSpecialization } }

    const analyticsData = useMemo(() => {
        if (!complaints.length) return null;

        const filtered = publicFilter ? complaints.filter(c => c.isPublic) : complaints;

        // 1. Status Ratio
        const total = filtered.length;
        const resolvedCount = filtered.filter(c => c.status === 'resolved' || c.status === 'closed').length;
        const pendingCount = total - resolvedCount;

        // 2. Categories
        const categories = filtered.reduce((acc, c) => {
            acc[c.category] = (acc[c.category] || 0) + 1;
            return acc;
        }, {});

        // 3. Location Density (Hostel/Block)
        const density = filtered.reduce((acc, c) => {
            const key = `${c.hostel} - ${c.block}`;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});

        // 4. Response/Resolution Times
        let totalResponseTime = 0;
        let totalResolutionTime = 0;
        let respondedCount = 0;
        let resolvedTimeCount = 0;

        filtered.forEach(c => {
            const reportedEvent = c.timeline.find(t => t.status === 'reported');
            const assignedEvent = c.timeline.find(t => t.status === 'assigned');
            const resolvedEvent = c.timeline.find(t => t.status === 'resolved' || t.status === 'closed');

            if (reportedEvent) {
                const startTime = new Date(reportedEvent.timestamp);

                if (assignedEvent) {
                    totalResponseTime += (new Date(assignedEvent.timestamp) - startTime);
                    respondedCount++;
                }

                if (resolvedEvent) {
                    totalResolutionTime += (new Date(resolvedEvent.timestamp) - startTime);
                    resolvedTimeCount++;
                }
            }
        });

        const formatTime = (ms) => {
            if (ms === 0) return 'N/A';
            const hours = ms / (1000 * 60 * 60);
            if (hours < 24) return `${hours.toFixed(1)}h`;
            return `${(hours / 24).toFixed(1)}d`;
        };

        return {
            total,
            resolvedCount,
            pendingCount,
            ratio: total === 0 ? 0 : Math.round((resolvedCount / total) * 100),
            categories: Object.entries(categories).sort((a, b) => b[1] - a[1]),
            density: Object.entries(density).sort((a, b) => b[1] - a[1]),
            avgResponse: respondedCount === 0 ? 'N/A' : formatTime(totalResponseTime / respondedCount),
            avgResolution: resolvedTimeCount === 0 ? 'N/A' : formatTime(totalResolutionTime / resolvedTimeCount)
        };
    }, [complaints, publicFilter]);

    const handleAcceptIssue = async (complaintId) => {
        try {
            // Assign to current user as caretaker
            await authAPI.assignCaretaker(complaintId, user.email, user._id);
            alert('Issue accepted! You can now track it in your assigned issues.');
            fetchData();
        } catch (error) {
            console.error('Error accepting issue:', error);
            alert('Failed to accept issue');
        }
    };

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [activeTab, user]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch staff for any management user (used for assignment dropdowns)
            if (user?.role === 'management') {
                const { data } = await authAPI.getStaff();
                setStaff(data);
            }

            if (activeTab === 'issues' || activeTab === 'resolved') {
                const { data } = await authAPI.getAllComplaints(activeTab);

                // Sort complaints: active first, resolved/closed at bottom
                const sortedData = [...data].sort((a, b) => {
                    const statusOrder = { 'reported': 0, 'assigned': 1, 'in-progress': 2, 'resolved': 3, 'closed': 4 };
                    return (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
                });

                setComplaints(sortedData);
                // Calculate stats from data
                const pending = data.filter(c => c.status !== 'resolved' && c.status !== 'closed').length;
                const resolved = data.filter(c => c.status === 'resolved' || c.status === 'closed').length;
                setStats(s => ({ ...s, pending, resolved }));
            } else if (activeTab === 'users' && user?.isAdmin) {
                const { data } = await authAPI.getPendingUsers();
                setPendingUsers(data);
                // Initialize role data for pending users
                const initialRoleData = {};
                data.forEach(u => {
                    initialRoleData[u._id] = { managementRole: 'admin', staffSpecialization: 'other' };
                });
                setPendingRoleData(initialRoleData);
            } else if (activeTab === 'staff' && user?.isAdmin) {
                const { data } = await authAPI.getStaff();
                setStaff(data);
            } else if (activeTab === 'announcements') {
                const { data } = await authAPI.getAnnouncements();
                setAnnouncements(data);
            } else if (activeTab === 'lost-found') {
                const { data } = await authAPI.getLostFoundItems();
                setLostFoundItems(data);
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
            console.log('Posting Announcement - State:', newAnnouncement);
            await authAPI.createAnnouncement({
                text: newAnnouncement.text,
                priority: newAnnouncement.priority,
                category: newAnnouncement.category,
                deadlineDate: newAnnouncement.deadlineDate,
                type: newAnnouncement.type,
                targetBlocks: newAnnouncement.targetBlocks,
                targetRoles: newAnnouncement.targetRoles
            });
            setNewAnnouncement({
                text: '',
                priority: 'medium',
                category: 'general',
                deadlineDate: '',
                type: 'general',
                targetBlocks: [],
                targetRoles: []
            });
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
                await authAPI.assignCaretaker(actionId, actionValue, actionId2);
            } else if (actionType === 'status') {
                await authAPI.updateComplaintStatus(actionId, actionValue, actionComment);
            } else if (actionType === 'priority') {
                await authAPI.updateComplaintPriority(actionId, actionValue, actionComment);
            }

            setActionId(null);
            setActionType(null);
            setActionValue('');
            setActionId2('');
            setActionComment('');
            fetchData(); // Refresh list
            alert('Updated successfully!');
        } catch (error) {
            console.error('Error performing action:', error);
            alert('Action failed');
        }
    };

    const handleApprove = async (userId) => {
        try {
            const roleData = pendingRoleData[userId] || { managementRole: 'admin', staffSpecialization: 'other' };
            await authAPI.approveUser(userId, roleData);
            setPendingUsers(pendingUsers.filter(u => u._id !== userId));
            alert('User approved and role assigned!');
        } catch (error) {
            console.error('Error approving user:', error);
            alert('Failed to approve user');
        }
    };

    const handleUpdateStaffRole = async (id, data) => {
        try {
            await authAPI.updateStaffRole(id, data);
            fetchData();
            alert('Staff role updated!');
        } catch (error) {
            console.error('Error updating staff role:', error);
            alert('Failed to update staff role');
        }
    };

    const handleModerateLF = async (id, action) => {
        try {
            await authAPI.moderateClaim(id, action);
            if (action === 'approve_post') alert('Post approved and live!');
            else if (action === 'reject_post') alert('Post rejected and removed.');
            else if (action === 'approve_claim') alert('Claim finalized!');
            else alert('Claim rejected, item back to open.');
            fetchData();
        } catch (error) {
            console.error('Error moderating:', error);
            alert('Moderation failed');
        }
    };

    const handleDeleteLFItem = async (id) => {
        if (!window.confirm('Delete this listing permanently?')) return;
        try {
            await authAPI.deleteLostFoundItem(id);
            fetchData();
        } catch (error) {
            console.error('Error deleting:', error);
            alert('Delete failed');
        }
    };

    const handleDeleteComplaint = async (id) => {
        if (!window.confirm('Are you sure you want to delete this complaint permanently?')) return;
        try {
            await authAPI.deleteComplaint(id);
            setComplaints(prev => prev.filter(c => c._id !== id));
            fetchData();
        } catch (error) {
            console.error('Error deleting complaint:', error);
            const msg = error.response?.data?.message || error.message || 'Failed to delete complaint';
            alert(`Error: ${msg}`);
        }
    };

    const handleBulkDelete = async (ids) => {
        if (!ids || ids.length === 0) return;
        if (!window.confirm(`Permanently delete ${ids.length} selected issues?`)) return;

        try {
            await authAPI.bulkDeleteComplaints(ids);
            setComplaints(prev => prev.filter(c => !ids.includes(c._id)));
            setSelectedIssues([]);
            fetchData();
        } catch (error) {
            console.error('Error in bulk delete:', error);
            const msg = error.response?.data?.message || error.message || 'Bulk delete failed';
            alert(`Error: ${msg}`);
        }
    };

    const handleCleanupResolved = async () => {
        const count = complaints.filter(c => ['resolved', 'closed'].includes(c.status?.toLowerCase())).length;

        if (count === 0) {
            alert('No resolved or closed issues to clean up.');
            return;
        }

        if (!window.confirm(`Clean up all ${count} resolved and closed issues permanently?`)) return;

        try {
            const { data } = await authAPI.cleanupComplaints();
            setComplaints(prev => prev.filter(c => !['resolved', 'closed', 'merged'].includes(c.status?.toLowerCase())));
            alert(data.message || 'Cleanup successful');
            fetchData();
        } catch (error) {
            console.error('Error in cleanup:', error);
            const msg = error.response?.data?.message || error.message || 'Cleanup failed';
            alert(`Error: ${msg}`);
        }
    };

    const handleUpvote = async (id, type) => {
        try {
            if (type === 'announcement') {
                const { data } = await authAPI.upvoteAnnouncement(id);
                setAnnouncements(announcements.map(a => a._id === id ? { ...a, upvotes: data.upvotes } : a));
            } else {
                const { data } = await authAPI.upvoteComplaint(id);
                setComplaints(complaints.map(c => c._id === id ? { ...c, upvotes: data.upvotes } : c));
            }
        } catch (error) {
            console.error('Error upvoting:', error);
        }
    };

    const toggleIssueSelection = (id) => {
        setSelectedIssues(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleMerge = async (primaryId) => {
        try {
            const duplicateIds = selectedIssues.filter(id => id !== primaryId);
            await authAPI.mergeComplaints(primaryId, duplicateIds);
            alert('Issues merged successfully');
            setSelectedIssues([]);
            setShowMergeModal(false);
            fetchData();
        } catch (error) {
            console.error('Error merging:', error);
            alert('Failed to merge issues');
        }
    };

    const handleBack = () => {
        setActiveTab('issues');
    };

    // Render Management Profile View
    const renderProfileView = () => (
        <div className="detail-view">
            <button className="back-btn" onClick={handleBack}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Back
            </button>
            <div className="detail-header">
                <h2>👤 Management Profile</h2>
            </div>
            <div className="detail-content">
                <div className="profile-container">
                    <div className="profile-header-card">
                        <div className="profile-avatar-large">
                            {user?.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="profile-main-info">
                            <h3>{user?.email}</h3>
                            <span className="profile-badge management">{user?.managementRole || 'Staff'}</span>
                        </div>
                    </div>

                    <div className="profile-details-grid">
                        <div className="detail-item">
                            <label>Designation</label>
                            <p>{user?.managementRole ? (user.managementRole.charAt(0).toUpperCase() + user.managementRole.slice(1)) : 'Management Staff'}</p>
                        </div>
                        {user?.managementRole === 'caretaker' && (
                            <div className="detail-item">
                                <label>Specialization</label>
                                <p>{user?.staffSpecialization || 'General'}</p>
                            </div>
                        )}
                        <div className="detail-item">
                            <label>Account Status</label>
                            <p className="status-active">Verified Staff</p>
                        </div>
                        <div className="detail-item">
                            <label>Permissions</label>
                            <p>{user?.isAdmin ? 'Full Admin Access' : 'Staff Access'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // Render Help & Support View (Same contacts for consistency)
    const renderHelpView = () => (
        <div className="detail-view">
            <button className="back-btn" onClick={handleBack}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Back
            </button>
            <div className="detail-header">
                <h2>❓ Help & Support</h2>
            </div>
            <div className="detail-content">
                <div className="help-container">
                    <section className="help-section">
                        <h3>Administration Contact Information</h3>
                        <p className="help-intro">For technical support or administrative queries, please contact the system administrators:</p>

                        <div className="contact-cards">
                            <div className="contact-card">
                                <div className="contact-icon admin">A</div>
                                <div className="contact-info">
                                    <h4>System Administrator</h4>
                                    <p>📧 admin@hostelease.com</p>
                                    <p>📞 +91 9876543210</p>
                                </div>
                            </div>

                            <div className="contact-card">
                                <div className="contact-icon subadmin">S</div>
                                <div className="contact-info">
                                    <h4>Management Support</h4>
                                    <p>📧 support@hostelease.com</p>
                                    <p>📞 +91 8765432109</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );

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
                    <span className="admin-badge">
                        {user?.managementRole || 'Management'}
                    </span>
                </div>
                <div className="header-right">
                    <ProfileDropdown onAction={(action) => setActiveTab(action)} />
                </div>
            </header>

            <main className="dashboard-main">
                <div className="welcome-card management-welcome">
                    <div className="welcome-content">
                        <h2>Management Portal 🏢</h2>
                        {user?.managementRole === 'caretaker' ? (
                            <p>Specialized Staff: <strong>{user.staffSpecialization}</strong></p>
                        ) : (
                            <p>Overseeing hostel operations and student wellbeing.</p>
                        )}
                        {user?.isAdmin && <span className="admin-tag">Super Admin Access</span>}
                        {user?.managementRole === 'subadmin' && <span className="admin-tag subadmin">Sub-Admin Portal</span>}
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
                    {user?.managementRole === 'caretaker' ? (
                        <>
                            <button
                                className={`tab-btn ${activeTab === 'issues' ? 'active' : ''}`}
                                onClick={() => setActiveTab('issues')}
                            >
                                Available Issues
                            </button>
                            <button
                                className={`tab-btn ${activeTab === 'resolved' ? 'active' : ''}`}
                                onClick={() => setActiveTab('resolved')}
                            >
                                Resolved by Me
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                className={`tab-btn ${activeTab === 'issues' ? 'active' : ''}`}
                                onClick={() => setActiveTab('issues')}
                            >
                                Active Issues
                            </button>
                            {user?.isAdmin && (
                                <>
                                    <button
                                        className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('users')}
                                    >
                                        Pending Users
                                    </button>
                                    <button
                                        className={`tab-btn ${activeTab === 'staff' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('staff')}
                                    >
                                        Staff Accounts
                                    </button>
                                </>
                            )}
                            <button
                                className={`tab-btn ${activeTab === 'announcements' ? 'active' : ''}`}
                                onClick={() => setActiveTab('announcements')}
                            >
                                Announcements
                            </button>
                            <button
                                className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
                                onClick={() => setActiveTab('analytics')}
                            >
                                Analytics
                            </button>
                            <button
                                className={`tab-btn ${activeTab === 'lost-found' ? 'active' : ''}`}
                                onClick={() => setActiveTab('lost-found')}
                            >
                                Lost & Found
                            </button>
                            <button
                                className={`tab-btn ${activeTab === 'leaves' ? 'active' : ''}`}
                                onClick={() => setActiveTab('leaves')}
                            >
                                Leaves & Outpass
                            </button>
                        </>
                    )}
                </div>

                <div className="tab-content">
                    {(activeTab === 'issues' || activeTab === 'resolved') && (
                        <div className="management-issues-list">
                            {(activeTab === 'issues' || activeTab === 'resolved') && (
                                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                                    {selectedIssues.length > 0 && (
                                        <div className="bulk-actions-toolbar" style={{ margin: 0, flex: 1 }}>
                                            <span>{selectedIssues.length} issues selected</span>
                                            <div className="toolbar-btns">
                                                <button
                                                    className="merge-action-btn"
                                                    onClick={() => setShowMergeModal(true)}
                                                    disabled={selectedIssues.length < 2}
                                                >
                                                    🔗 Merge
                                                </button>
                                                <button
                                                    className="delete-selected-btn"
                                                    onClick={() => handleBulkDelete(selectedIssues)}
                                                    style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.85rem' }}
                                                >
                                                    🗑️ Delete Selected
                                                </button>
                                                <button
                                                    className="clear-selection-btn"
                                                    onClick={() => setSelectedIssues([])}
                                                >
                                                    Clear
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    {(user?.isAdmin || user?.managementRole === 'subadmin') && (
                                        <button
                                            className="cleanup-btn"
                                            onClick={handleCleanupResolved}
                                            style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '0.6rem 1.2rem', borderRadius: '10px', fontSize: '0.9rem', fontWeight: '500', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                        >
                                            🧹 Cleanup Resolved/Closed
                                        </button>
                                    )}
                                </div>
                            )}

                            {loading ? <p>Loading...</p> : complaints.length === 0 ? (
                                <p className="no-pending">No complaints reported yet.</p>
                            ) : (
                                <div className="issues-grid">
                                    {complaints.map(complaint => (
                                        <div
                                            key={complaint._id}
                                            className={`complaint-card management-card ${['resolved', 'closed', 'merged'].includes(complaint.status?.toLowerCase()) ? 'strikethrough-resolved' : ''} ${selectedIssues.includes(complaint._id) ? 'selected' : ''}`}
                                        >
                                            <div className="issue-selection-checkbox">
                                                {(activeTab === 'issues' || activeTab === 'resolved') && (
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIssues.includes(complaint._id)}
                                                        onChange={() => toggleIssueSelection(complaint._id)}
                                                        aria-label="Select issue"
                                                    />
                                                )}
                                            </div>
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

                                                {complaint.isPublic && (
                                                    <div className="social-actions" style={{ marginBottom: '1rem' }}>
                                                        <button
                                                            className={`social-btn ${complaint.upvotes?.includes(user?._id) ? 'active' : ''}`}
                                                            onClick={() => handleUpvote(complaint._id, 'complaint')}
                                                        >
                                                            👍 {complaint.upvotes?.length || 0}
                                                        </button>
                                                        <button
                                                            className="social-btn"
                                                            onClick={() => setSelectedItem(selectedItem?.id === complaint._id ? null : { id: complaint._id, type: 'Complaint' })}
                                                        >
                                                            💬 {selectedItem?.id === complaint._id ? 'Close Discussion' : 'Join Discussion'}
                                                        </button>
                                                    </div>
                                                )}

                                                {selectedItem?.id === complaint._id && (
                                                    <div className="nested-comments-area" style={{ marginBottom: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
                                                        <CommentSection entityId={complaint._id} entityType="Complaint" currentUser={{ id: user?._id }} />
                                                    </div>
                                                )}

                                                {complaint.caretaker && (
                                                    <div className="caretaker-info">
                                                        👷 Caretaker: <strong>{complaint.caretaker}</strong>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="complaint-actions">
                                                {user?.managementRole === 'caretaker' && complaint.status === 'reported' ? (
                                                    <button
                                                        className="action-btn accept-btn"
                                                        onClick={() => handleAcceptIssue(complaint._id)}
                                                    >
                                                        Accept Issue
                                                    </button>
                                                ) : (
                                                    <>
                                                        {actionId === complaint._id ? (
                                                            <form onSubmit={handleActionSubmit} className="action-inline-form">
                                                                {actionType === 'assign' && (
                                                                    <select
                                                                        value={actionId2}
                                                                        onChange={(e) => {
                                                                            const selectedId = e.target.value;
                                                                            const staffMember = staff.find(s => s._id === selectedId);
                                                                            setActionValue(staffMember?.email || '');
                                                                            setActionId2(selectedId);
                                                                        }}
                                                                        required
                                                                    >
                                                                        <option value="">Select Caretaker</option>
                                                                        {/* Group caretakers by specialization */}
                                                                        <optgroup label="Recommended specialists">
                                                                            {staff.filter(s => s.managementRole?.toLowerCase() === 'caretaker' && s.staffSpecialization?.toLowerCase() === complaint.category?.toLowerCase()).length > 0 ? (
                                                                                staff
                                                                                    .filter(s => s.managementRole?.toLowerCase() === 'caretaker' && s.staffSpecialization?.toLowerCase() === complaint.category?.toLowerCase())
                                                                                    .map(s => (
                                                                                        <option key={s._id} value={s._id}>
                                                                                            {s.email} (Specialist)
                                                                                        </option>
                                                                                    ))
                                                                            ) : (
                                                                                <option disabled>No exact specialists found</option>
                                                                            )}
                                                                        </optgroup>
                                                                        <optgroup label="Other Staff">
                                                                            {staff
                                                                                .filter(s => s.managementRole?.toLowerCase() === 'caretaker' && s.staffSpecialization?.toLowerCase() !== complaint.category?.toLowerCase())
                                                                                .map(s => (
                                                                                    <option key={s._id} value={s._id}>
                                                                                        {s.email} ({s.staffSpecialization || 'General'})
                                                                                    </option>
                                                                                ))}
                                                                        </optgroup>
                                                                        {staff.length === 0 && <option disabled>Waiting for staff list...</option>}
                                                                    </select>
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
                                                            <div className="action-btns">
                                                                {/* Caretakers cannot re-assign or change priority */}
                                                                {user?.managementRole !== 'caretaker' && (
                                                                    <>
                                                                        <button
                                                                            onClick={() => { setActionId(complaint._id); setActionType('assign'); }}
                                                                            className="action-btn assign"
                                                                            disabled={['resolved', 'closed'].includes(complaint.status)}
                                                                        >
                                                                            Assign
                                                                        </button>
                                                                        <button
                                                                            onClick={() => { setActionId(complaint._id); setActionType('priority'); }}
                                                                            className="action-btn priority-btn"
                                                                            disabled={['resolved', 'closed'].includes(complaint.status)}
                                                                        >
                                                                            Priority
                                                                        </button>
                                                                    </>
                                                                )}
                                                                <button
                                                                    onClick={() => { setActionId(complaint._id); setActionType('status'); }}
                                                                    className="action-btn status-btn"
                                                                    disabled={['resolved', 'closed'].includes(complaint.status)}
                                                                >
                                                                    Status
                                                                </button>
                                                                {(user?.isAdmin || user?.managementRole === 'subadmin') && ['resolved', 'closed'].includes(complaint.status) && (
                                                                    <button
                                                                        onClick={() => handleDeleteComplaint(complaint._id)}
                                                                        className="action-btn delete-btn"
                                                                        style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                                                                    >
                                                                        🗑️ Delete
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
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
                                        <div key={u._id} className="pending-user-card admin-special-card">
                                            <div className="pending-info">
                                                <span className="pending-email">{u.email}</span>
                                                <span className="pending-date">Registered on {new Date(u.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <div className="approval-controls">
                                                <div className="control-group">
                                                    <label>Assign Role</label>
                                                    <select
                                                        value={pendingRoleData[u._id]?.managementRole || 'admin'}
                                                        onChange={(e) => setPendingRoleData({
                                                            ...pendingRoleData,
                                                            [u._id]: { ...pendingRoleData[u._id], managementRole: e.target.value }
                                                        })}
                                                    >
                                                        <option value="admin">Super Admin</option>
                                                        <option value="subadmin">Sub Admin</option>
                                                        <option value="caretaker">Caretaker</option>
                                                    </select>
                                                </div>
                                                {pendingRoleData[u._id]?.managementRole === 'caretaker' && (
                                                    <div className="control-group">
                                                        <label>Specialization</label>
                                                        <select
                                                            value={pendingRoleData[u._id]?.staffSpecialization || 'other'}
                                                            onChange={(e) => setPendingRoleData({
                                                                ...pendingRoleData,
                                                                [u._id]: { ...pendingRoleData[u._id], staffSpecialization: e.target.value }
                                                            })}
                                                        >
                                                            <option value="plumbing">Plumbing</option>
                                                            <option value="electrical">Electrical</option>
                                                            <option value="cleanliness">Cleanliness</option>
                                                            <option value="internet">Wi-Fi / Internet</option>
                                                            <option value="furniture">Furniture</option>
                                                            <option value="other">Other</option>
                                                        </select>
                                                    </div>
                                                )}
                                                <button onClick={() => handleApprove(u._id)} className="approve-btn">
                                                    Approve & Assign
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'staff' && user?.isAdmin && (
                        <div className="staff-management">
                            <h3>Approved Management Staff</h3>
                            {staff.length === 0 ? (
                                <p className="no-pending">No approved staff members yet.</p>
                            ) : (
                                <div className="staff-list">
                                    {staff.map(member => (
                                        <div key={member._id} className="staff-card admin-special-card">
                                            <div className="staff-info">
                                                <span className="staff-email">
                                                    {member.email} {member._id === user.id && "(You)"}
                                                </span>
                                                <div className="staff-role-tags">
                                                    <span className={`role-badge ${member.managementRole}`}>
                                                        {member.managementRole}
                                                    </span>
                                                    {member.staffSpecialization && (
                                                        <span className="spec-badge">
                                                            {member.staffSpecialization}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="staff-actions">
                                                <select
                                                    defaultValue={member.managementRole}
                                                    onChange={(e) => handleUpdateStaffRole(member._id, { managementRole: e.target.value })}
                                                    disabled={member._id === user.id}
                                                >
                                                    <option value="admin">Super Admin</option>
                                                    <option value="subadmin">Sub Admin</option>
                                                    <option value="caretaker">Caretaker</option>
                                                </select>
                                                {member.managementRole === 'caretaker' && (
                                                    <select
                                                        defaultValue={member.staffSpecialization}
                                                        onChange={(e) => handleUpdateStaffRole(member._id, { staffSpecialization: e.target.value })}
                                                    >
                                                        <option value="plumbing">Plumbing</option>
                                                        <option value="electrical">Electrical</option>
                                                        <option value="cleanliness">Cleanliness</option>
                                                        <option value="internet">Wi-Fi / Internet</option>
                                                        <option value="furniture">Furniture</option>
                                                        <option value="other">Other</option>
                                                    </select>
                                                )}
                                            </div>
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
                                        <div className="date-input-wrapper">
                                            <label>
                                                {['fees', 'general'].includes(newAnnouncement.category) ? '📅 Deadline Date' : '📅 Notice/Event Date'}
                                            </label>
                                            <input
                                                type="date"
                                                value={newAnnouncement.deadlineDate}
                                                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, deadlineDate: e.target.value })}
                                                className="date-input"
                                            />
                                        </div>
                                        <select
                                            value={newAnnouncement.priority}
                                            onChange={(e) => setNewAnnouncement({ ...newAnnouncement, priority: e.target.value })}
                                            className="priority-select"
                                        >
                                            <option value="low">Low Priority</option>
                                            <option value="medium">Medium Priority</option>
                                            <option value="high">High Priority</option>
                                            <option value="urgent">Urgent Priority</option>
                                        </select>

                                        <select
                                            value={newAnnouncement.category}
                                            onChange={(e) => setNewAnnouncement({ ...newAnnouncement, category: e.target.value })}
                                            className="type-select"
                                        >
                                            <option value="general">General Category</option>
                                            <option value="fees">Hostel Fees</option>
                                            <option value="cleaning">Cleaning Schedules</option>
                                            <option value="pest-control">Pest Control Drive</option>
                                            <option value="utility-downtime">Water/Power Downtime</option>
                                            <option value="maintenance">Maintenance Notice</option>
                                        </select>

                                        <select
                                            value={newAnnouncement.type}
                                            onChange={(e) => setNewAnnouncement({ ...newAnnouncement, type: e.target.value })}
                                            className="type-select"
                                        >
                                            <option value="general">📢 Global Announcement</option>
                                            <option value="block">🏗️ Target by Block</option>
                                            <option value="role">👥 Target by Role</option>
                                        </select>
                                    </div>

                                    {/* Conditional targeting inputs */}
                                    {newAnnouncement.type === 'block' && (
                                        <div className="targeting-options-container">
                                            <label>Select Blocks (A-H)</label>
                                            <div className="targeting-checkbox-grid">
                                                {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(block => (
                                                    <label key={block} className="targeting-checkbox-item">
                                                        <input
                                                            type="checkbox"
                                                            checked={newAnnouncement.targetBlocks.includes(block)}
                                                            onChange={(e) => {
                                                                const checked = e.target.checked;
                                                                setNewAnnouncement(prev => ({
                                                                    ...prev,
                                                                    targetBlocks: checked
                                                                        ? [...prev.targetBlocks, block]
                                                                        : prev.targetBlocks.filter(b => b !== block)
                                                                }));
                                                            }}
                                                        />
                                                        {block}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {newAnnouncement.type === 'role' && (
                                        <div className="targeting-options-container">
                                            <label>Select Target Roles</label>
                                            <div className="targeting-checkbox-grid">
                                                {[
                                                    { id: 'subadmin', label: 'Sub-Admin' },
                                                    { id: 'caretaker', label: 'Caretaker' }
                                                ].map(role => (
                                                    <label key={role.id} className="targeting-checkbox-item">
                                                        <input
                                                            type="checkbox"
                                                            checked={newAnnouncement.targetRoles.includes(role.id)}
                                                            onChange={(e) => {
                                                                const checked = e.target.checked;
                                                                setNewAnnouncement(prev => ({
                                                                    ...prev,
                                                                    targetRoles: checked
                                                                        ? [...prev.targetRoles, role.id]
                                                                        : prev.targetRoles.filter(r => r !== role.id)
                                                                }));
                                                            }}
                                                        />
                                                        {role.label}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="form-footer" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
                                        {(newAnnouncement.type === 'block' && newAnnouncement.targetBlocks.length === 0) ||
                                            (newAnnouncement.type === 'role' && newAnnouncement.targetRoles.length === 0) ? (
                                            <span style={{ color: '#ef4444', fontSize: '0.8rem', marginRight: '1rem' }}>
                                                Select at least one target!
                                            </span>
                                        ) : null}
                                        <button
                                            type="submit"
                                            className="post-btn"
                                            disabled={
                                                (newAnnouncement.type === 'block' && newAnnouncement.targetBlocks.length === 0) ||
                                                (newAnnouncement.type === 'role' && newAnnouncement.targetRoles.length === 0)
                                            }
                                        >
                                            Post Announcement
                                        </button>
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
                                            <div className="announcement-content-main">
                                                <div className="announcement-header-meta">
                                                    <span className="category-meta-badge">
                                                        {a.category === 'fees' ? '💰 Fees' :
                                                            a.category === 'cleaning' ? '🧹 Cleaning' :
                                                                a.category === 'pest-control' ? '🕷️ Pest' :
                                                                    a.category === 'utility-downtime' ? '⚡ Utility' :
                                                                        a.category === 'maintenance' ? '🔧 Maint' : '📢 General'}
                                                    </span>
                                                    <span className="target-meta-badge">
                                                        {a.type === 'general' ? 'Global' :
                                                            a.type === 'block' ? `Blocks: ${Array.isArray(a.targetBlocks) && a.targetBlocks.length > 0 ? a.targetBlocks.join(', ') : (a.block || 'None')}` :
                                                                a.type === 'role' ? `Roles: ${Array.isArray(a.targetRoles) && a.targetRoles.length > 0 ? a.targetRoles.join(', ') : 'None'}` :
                                                                    a.type === 'hostel' ? `Hostel: ${a.hostel || 'All'}` : 'Global'}
                                                    </span>
                                                </div>
                                                <div className="announcement-text">{a.text}</div>
                                                {a.deadlineDate && (
                                                    <div className="announcement-date-badge">
                                                        <span>
                                                            {['fees', 'general'].includes(a.category) ? '📅 Deadline: ' : '📅 Date: '}
                                                            {new Date(a.deadlineDate).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="social-actions" style={{ marginTop: '1rem' }}>
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
                                                    💬 {selectedItem?.id === a._id ? 'Close' : 'Discuss'}
                                                </button>
                                            </div>
                                            {selectedItem?.id === a._id && (
                                                <div className="nested-comments-area" style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
                                                    <CommentSection entityId={a._id} entityType="Announcement" currentUser={{ id: user?._id }} />
                                                </div>
                                            )}
                                            <div className="announcement-meta">
                                                <span>Posted: {new Date(a.createdAt).toLocaleDateString()}</span>
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

                    {
                        activeTab === 'analytics' && analyticsData && (
                            <div className="analytics-view">
                                <div className="analytics-header">
                                    <h3>Operational Analytics</h3>
                                    <button
                                        className={`filter-toggle ${publicFilter ? 'active' : ''}`}
                                        onClick={() => setPublicFilter(!publicFilter)}
                                    >
                                        {publicFilter ? 'Showing: Public Only' : 'Showing: All Issues'}
                                    </button>
                                </div>

                                <div className="stats-grid">
                                    <div className="stat-card">
                                        <div className="stat-value">{analyticsData.avgResponse}</div>
                                        <div className="stat-label">Avg. Response Time</div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-value">{analyticsData.avgResolution}</div>
                                        <div className="stat-label">Avg. Resolution Time</div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-value">{analyticsData.ratio}%</div>
                                        <div className="stat-label">Resolution Rate</div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-value">{analyticsData.total}</div>
                                        <div className="stat-label">Total Reports</div>
                                    </div>
                                </div>

                                <div className="analytics-charts">
                                    <div className="chart-container">
                                        <h4>Most Frequent Categories</h4>
                                        <div className="bar-chart">
                                            {analyticsData.categories.map(([category, count]) => (
                                                <div key={category} className="bar-item">
                                                    <div className="bar-info">
                                                        <span className="bar-label">{category}</span>
                                                        <span className="bar-count">{count}</span>
                                                    </div>
                                                    <div className="bar-bg">
                                                        <div
                                                            className="bar-fill"
                                                            style={{ width: `${(count / analyticsData.total) * 100}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="chart-container">
                                        <h4>Hostel/Block Density</h4>
                                        <div className="density-list">
                                            {analyticsData.density.map(([location, count]) => (
                                                <div key={location} className="density-item">
                                                    <span className="density-label">{location}</span>
                                                    <span className={`density-badge ${count > 5 ? 'high' : count > 2 ? 'medium' : 'low'}`}>
                                                        {count} issues
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    }
                    {
                        activeTab === 'lost-found' && (
                            <div className="lost-found-management">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <h3>Moderate Lost & Found</h3>
                                    <div className="status-counts" style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem' }}>
                                        <span style={{ color: '#fbbf24' }}>⌛ {lostFoundItems.filter(i => !i.isApproved).length} Pending Posts</span>
                                        <span style={{ color: '#6366f1' }}>🔍 {lostFoundItems.filter(i => i.status === 'claimed').length} Claims</span>
                                    </div>
                                </div>

                                {lostFoundItems.length === 0 ? (
                                    <p className="no-pending">No reports or claims to review.</p>
                                ) : (
                                    <div className="complaints-list">
                                        {lostFoundItems.map(item => (
                                            <div key={item._id} className={`complaint-card ${!item.isApproved ? 'urgent' : item.status === 'claimed' ? 'management-card' : ''}`} style={!item.isApproved ? { borderLeft: '4px solid #f59e0b' } : {}}>
                                                <div className="card-header">
                                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                        <span className={`priority-badge ${item.type === 'found' ? 'low' : 'high'}`}>
                                                            {item.type.toUpperCase()}
                                                        </span>
                                                        {!item.isApproved && (
                                                            <span className="priority-badge urgent" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid currentColor' }}>
                                                                PENDING APPROVAL
                                                            </span>
                                                        )}
                                                        {item.isResolutionRequested && item.status !== 'resolved' && (
                                                            <span className="priority-badge urgent" style={{ background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', border: '1px solid currentColor' }}>
                                                                RESOLUTION REQUESTED
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="status-badge" style={{ color: item.status === 'open' ? '#34d399' : item.status === 'resolved' ? '#10b981' : '#fbbf24' }}>
                                                        {item.status.toUpperCase()}
                                                    </span>
                                                </div>

                                                {item.media && item.media.length > 0 && (
                                                    <div className="item-card-image">
                                                        <img src={item.media[0]} alt={item.title} />
                                                    </div>
                                                )}

                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <div>
                                                        <span style={{ fontSize: '0.7rem', color: '#a78bfa', fontWeight: 'bold' }}>#{item.category}</span>
                                                        <h3 style={{ margin: '0.25rem 0' }}>{item.title}</h3>
                                                        <p className="description-preview" style={{ marginBottom: '1rem' }}>{item.description}</p>
                                                    </div>
                                                    <button onClick={() => handleDeleteLFItem(item._id)} className="delete-icon-btn" title="Delete Permanent">🗑️</button>
                                                </div>

                                                <div className="caretaker-info" style={{ background: 'rgba(255,255,255,0.05)', fontSize: '0.8rem', padding: '0.75rem', borderRadius: '6px' }}>
                                                    👤 <strong>Posted by:</strong> {item.reportedBy?.email}<br />
                                                    📍 {item.location} • 📅 {new Date(item.date).toLocaleString()}
                                                </div>

                                                {item.isApproved && (
                                                    (user.isAdmin || user.managementRole === 'subadmin') ||
                                                    (item.reportedBy?._id || item.reportedBy) === user._id ||
                                                    (item.claimant?._id === user._id || item.claimant === user._id)
                                                ) && (
                                                        <div className="discussion-toggle" style={{ marginTop: '1rem' }}>
                                                            <button
                                                                className="social-btn"
                                                                style={{ width: '100%', background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', borderColor: 'rgba(99, 102, 241, 0.2)' }}
                                                                onClick={() => setSelectedItem(selectedItem?.id === item._id ? null : { id: item._id, type: 'LostFound' })}
                                                            >
                                                                💬 {selectedItem?.id === item._id ? 'Close Discussion' : 'Join Discussion'}
                                                            </button>
                                                            {selectedItem?.id === item._id && (
                                                                <div className="nested-comments-area" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                                                    <CommentSection entityId={item._id} entityType="LostFound" currentUser={{ id: user?._id }} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                {!item.isApproved ? (
                                                    <div className="moderation-panel" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                                                        <button onClick={() => handleModerateLF(item._id, 'approve_post')} className="approve-btn" style={{ flex: 1 }}>Approve Post</button>
                                                        <button onClick={() => handleModerateLF(item._id, 'reject_post')} className="reject-btn" style={{ flex: 1 }}>Reject Post</button>
                                                    </div>
                                                ) : (item.status === 'claimed' || item.isResolutionRequested) ? (
                                                    <div className="moderation-panel" style={{ marginTop: '1rem', padding: '1rem', background: item.isResolutionRequested ? 'rgba(52, 211, 153, 0.05)' : 'rgba(99, 102, 241, 0.05)', borderRadius: '8px', border: `1px solid ${item.isResolutionRequested ? 'rgba(52, 211, 153, 0.2)' : 'rgba(99, 102, 241, 0.2)'}` }}>
                                                        <h4 style={{ color: item.isResolutionRequested ? '#34d399' : '#818cf8', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                                            {item.isResolutionRequested ? '🏁 Resolution Requested' : '🤝 Item Claimed / Handover Coordination'}
                                                        </h4>
                                                        <p style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>
                                                            <strong>Claimant:</strong> {item.claimant?.email || 'Student'}
                                                        </p>
                                                        <div className="inline-btns" style={{ display: 'flex', gap: '0.5rem' }}>
                                                            <button onClick={() => handleModerateLF(item._id, 'approve_claim')} className="approve-btn" style={{ flex: 1 }}>Accept & Resolve</button>
                                                            <button onClick={() => handleModerateLF(item._id, 'reject_claim')} className="reject-btn" style={{ flex: 1 }}>Reject Claim</button>
                                                        </div>
                                                    </div>
                                                ) : null}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    }
                    {activeTab === 'profile' && renderProfileView()}
                    {activeTab === 'help' && renderHelpView()}

                    {activeTab === 'leaves' && (
                        <div className="leaves-management-section">
                            <div className="section-header">
                                <h3>Manage Gate Passes & Leaves</h3>
                            </div>
                            <LeaveListAdmin />
                        </div>
                    )}

                </div >
            </main >

            {showMergeModal && (
                <div className="modal-overlay">
                    <div className="merge-modal-container">
                        <h3>Select Primary Issue</h3>
                        <p>All other selected issues will be merged into this one. The primary issue will be the one caretakers work on.</p>

                        <div className="selected-issues-preview">
                            {complaints
                                .filter(c => selectedIssues.includes(c._id))
                                .map(c => (
                                    <div
                                        key={c._id}
                                        className="merge-option-card"
                                        onClick={() => handleMerge(c._id)}
                                    >
                                        <div className="option-header">
                                            <span className={`priority-badge ${c.priority}`}>{c.category}</span>
                                            <span className="reporter-email">{c.student?.email}</span>
                                        </div>
                                        <p className="option-desc">{c.description}</p>
                                        <div className="select-hint">Click to make Primary →</div>
                                    </div>
                                ))
                            }
                        </div>

                        <div className="modal-footer">
                            <button
                                className="cancel-btn"
                                onClick={() => setShowMergeModal(false)}
                            >
                                Cancel Merge
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default ManagementDashboard;
