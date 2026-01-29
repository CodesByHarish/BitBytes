import './Leaves.css';

const DigitalPass = ({ request, onClose }) => {
    if (!request) return null;

    return (
        <div className="digital-pass-overlay" onClick={onClose}>
            <div className="digital-pass" onClick={(e) => e.stopPropagation()}>
                <div className="pass-header">
                    <h2>Gate Pass</h2>
                    <p>{request.type === 'outpass' ? 'Outpass' : 'Leave'}</p>
                </div>

                <div className="pass-details">
                    <h3>{request.destination}</h3>
                    <p><strong>Valid Until:</strong> {new Date(request.toDate).toLocaleString()}</p>

                    <div className="qr-placeholder">
                        {/* Placeholder for QR Code */}
                        QR Code
                    </div>

                    <div className="pass-status">
                        {request.status.toUpperCase()}
                    </div>

                    <p style={{ marginTop: '15px', fontSize: '0.8rem', color: '#666' }}>
                        Show this pass at the gate for scanning.
                    </p>
                </div>

                <div className="pass-actions" style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                    <button className="download-pass-btn" onClick={() => window.print()} style={{ flex: 1, padding: '10px', background: '#3f51b5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Download as PDF
                    </button>
                    <button className="close-pass-btn" onClick={onClose} style={{ flex: 1, padding: '10px', background: '#e0e0e0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DigitalPass;
