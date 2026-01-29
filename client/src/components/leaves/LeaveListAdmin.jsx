import { useState, useEffect } from 'react';
import { authAPI } from '../../services/api';
import './Leaves.css';

const LeaveListAdmin = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('');
    const [filterBlock, setFilterBlock] = useState('');
    const [processingId, setProcessingId] = useState(null);
    const [remarks, setRemarks] = useState('');
    const [actionId, setActionId] = useState(null);

    useEffect(() => {
        fetchLeaves();
    }, [filterStatus, filterBlock]);

    const fetchLeaves = async () => {
        try {
            const params = {};
            if (filterStatus) params.status = filterStatus;
            if (filterBlock) params.block = filterBlock;

            const { data } = await authAPI.getAllLeaves(params);
            setLeaves(data);
        } catch (error) {
            console.error('Error fetching leaves:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        setProcessingId(id);
        try {
            await authAPI.updateLeaveStatus(id, status, remarks);
            setRemarks('');
            setActionId(null);
            fetchLeaves();
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
        } finally {
            setProcessingId(null);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to PERMANENTLY delete this request? This action cannot be undone.')) return;
        try {
            await authAPI.deleteLeave(id);
            fetchLeaves();
        } catch (error) {
            console.error('Error deleting leave:', error);
            alert('Failed to delete request');
        }
    };

    if (loading) return <div>Loading requests...</div>;

    return (
        <div className="leave-admin-container">
            <div className="leave-filters" style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: '8px', borderRadius: '4px' }}>
                    <option value="">All Statuses</option>
                    <option value="submitted">Pending (Submitted)</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="cancelled">Cancelled</option>
                </select>

                <select value={filterBlock} onChange={(e) => setFilterBlock(e.target.value)} style={{ padding: '8px', borderRadius: '4px' }}>
                    <option value="">All Hostels/Blocks</option>
                    {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(block => (
                        <option key={block} value={block}>Block {block}</option>
                    ))}
                </select>

                <button onClick={fetchLeaves} style={{ padding: '8px', cursor: 'pointer' }}>Refresh</button>
            </div>

            <div className="leave-list-container">
                {leaves.length === 0 ? (
                    <p>No requests found matching criteria.</p>
                ) : (
                    leaves.map(request => (
                        <div key={request._id} className={`leave-card status-${request.status}`}>
                            <div className="leave-header">
                                <span className="leave-type">{request.type}</span>
                                <span className={`leave-status status-${request.status}`}>
                                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                </span>
                            </div>

                            <div className="student-info" style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>
                                <strong>{request.student?.name || request.student?.email}</strong>
                                <div style={{ fontSize: '0.9rem', color: '#666' }}>
                                    Hostel: {request.hostel}, Room: {request.roomNumber}
                                </div>
                            </div>

                            <div className="leave-dates">
                                <strong>From:</strong> {new Date(request.fromDate).toLocaleString()} <br />
                                <strong>To:</strong> {new Date(request.toDate).toLocaleString()}
                            </div>

                            <div className="leave-details">
                                <p><strong>To:</strong> {request.destination}</p>
                                <p><strong>Reason:</strong> {request.reason}</p>
                                <p><strong>Contact:</strong> {request.contactNumber}</p>
                            </div>

                            <div className="admin-actions" style={{ marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div className="status-actions">
                                    {request.status === 'submitted' && (
                                        <>
                                            {actionId === request._id ? (
                                                <div className="action-confirm">
                                                    <input
                                                        type="text"
                                                        placeholder="Add remarks (optional)"
                                                        value={remarks}
                                                        onChange={(e) => setRemarks(e.target.value)}
                                                        style={{ width: '100%', padding: '5px', marginBottom: '5px' }}
                                                    />
                                                    <div style={{ display: 'flex', gap: '5px' }}>
                                                        <button
                                                            onClick={() => handleStatusUpdate(request._id, 'approved')}
                                                            className="approve-btn"
                                                            style={{ background: '#4CAF50', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
                                                        >
                                                            Confirm Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusUpdate(request._id, 'rejected')}
                                                            className="reject-btn"
                                                            style={{ background: '#f44336', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
                                                        >
                                                            Confirm Reject
                                                        </button>
                                                        <button onClick={() => setActionId(null)} style={{ padding: '5px' }}>Cancel</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <button
                                                        className="approve-btn"
                                                        onClick={() => setActionId(request._id)}
                                                        style={{ background: '#e8f5e9', color: '#2e7d32', border: '1px solid #2e7d32', padding: '5px 15px', borderRadius: '4px', cursor: 'pointer' }}
                                                    >
                                                        Process Request
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                <button
                                    className="delete-btn"
                                    onClick={() => handleDelete(request._id)}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '5px' }}>
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    </svg>
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default LeaveListAdmin;
