import { useState } from 'react';
import LeaveForm from './LeaveForm';
import LeaveListStudent from './LeaveListStudent';
import './Leaves.css';

const LeavesLayout = ({ onBack }) => {
    const [leavesTab, setLeavesTab] = useState('list'); // 'list' or 'new'
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    return (
        <div className="detail-view">
            <button className="back-btn" onClick={onBack}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Back
            </button>
            <div className="detail-header">
                <h2>🚪 Leaves & Outpass</h2>
                <div className="header-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        className={`tab-btn ${leavesTab === 'list' ? 'active' : ''}`}
                        onClick={() => setLeavesTab('list')}
                    >
                        History
                    </button>
                    <button
                        className={`tab-btn ${leavesTab === 'new' ? 'active' : ''}`}
                        onClick={() => setLeavesTab('new')}
                    >
                        New Request
                    </button>
                </div>
            </div>

            <div className="detail-content">
                {leavesTab === 'new' ? (
                    <LeaveForm onSuccess={() => {
                        setLeavesTab('list');
                        setRefreshTrigger(prev => prev + 1);
                    }} />
                ) : (
                    <LeaveListStudent refreshTrigger={refreshTrigger} />
                )}
            </div>
        </div>
    );
};

export default LeavesLayout;
