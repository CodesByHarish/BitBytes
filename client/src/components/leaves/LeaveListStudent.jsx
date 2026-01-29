import { useState, useEffect } from 'react';
import { authAPI } from '../../services/api';
import DigitalPass from './DigitalPass';
import './Leaves.css';

const LeaveListStudent = ({ refreshTrigger }) => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPass, setSelectedPass] = useState(null);

    useEffect(() => {
        fetchLeaves();
    }, [refreshTrigger]);

    const fetchLeaves = async () => {
        try {
            const { data } = await authAPI.getMyLeaves();
            setLeaves(data);
        } catch (error) {
            console.error('Error fetching leaves:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this request?')) return;
        try {
            await authAPI.cancelLeave(id);
            fetchLeaves();
        } catch (error) {
            console.error('Error cancelling leave:', error);
            alert('Failed to cancel request');
        }
    };

    if (loading) return <div>Loading requests...</div>;

    return (
        <div className="leave-list-container">
            {leaves.length === 0 ? (
                <p>No requests history found.</p>
            ) : (
                leaves.map(request => (
                    <div key={request._id} className={`leave-card status-${request.status}`}>
                        <div className="leave-header">
                            <span className="leave-type">{request.type}</span>
                            <span className={`leave-status status-${request.status}`}>
                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </span>
                        </div>

                        <div className="leave-dates">
                            <strong>From:</strong> {new Date(request.fromDate).toLocaleString()} <br />
                            <strong>To:</strong> {new Date(request.toDate).toLocaleString()}
                        </div>

                        <div className="leave-details">
                            <p><strong>To:</strong> {request.destination}</p>
                            <p><strong>Reason:</strong> {request.reason}</p>
                            {request.remarks && <p style={{ color: '#d32f2f' }}><strong>Admin Remarks:</strong> {request.remarks}</p>}
                        </div>

                        <div className="leave-actions">
                            {(request.status === 'submitted' || request.status === 'draft') && (
                                <button className="delete-card-btn" onClick={() => handleCancel(request._id)} title="Cancel Request">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                        <line x1="10" y1="11" x2="10" y2="17"></line>
                                        <line x1="14" y1="11" x2="14" y2="17"></line>
                                    </svg>
                                </button>
                            )}

                            {(request.status === 'approved' || request.status === 'checkedOut') && (
                                <button className="view-pass-btn" onClick={() => setSelectedPass(request)}>
                                    View Gate Pass
                                </button>
                            )}
                        </div>
                    </div>
                ))
            )}

            {selectedPass && (
                <DigitalPass
                    request={selectedPass}
                    onClose={() => setSelectedPass(null)}
                />
            )}
        </div>
    );
};

export default LeaveListStudent;
