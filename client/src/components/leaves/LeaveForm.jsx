import { useState } from 'react';
import { authAPI } from '../../services/api';
import './Leaves.css';

const LeaveForm = ({ onSuccess }) => {
    const [formData, setFormData] = useState({
        type: 'outpass',
        fromDate: '',
        toDate: '',
        reason: '',
        destination: '',
        contactNumber: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await authAPI.createLeave(formData);
            setFormData({
                type: 'outpass',
                fromDate: '',
                toDate: '',
                reason: '',
                destination: '',
                contactNumber: ''
            });
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error('Leave Submission Error:', err);
            const status = err.response?.status;
            const serverMsg = err.response?.data?.message;
            const serverError = err.response?.data?.error; // Sometimes auth middleware might send this

            let displayMsg = 'Failed to submit request';
            if (serverMsg) displayMsg = serverMsg;
            else if (serverError) displayMsg = serverError;
            else if (status) displayMsg = `Server error (${status}): Please check console/logs`;
            else if (err.message) displayMsg = err.message;

            setError(displayMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="leave-form-container">
            <h3>New Request</h3>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Type</label>
                    <select name="type" value={formData.type} onChange={handleChange}>
                        <option value="outpass">Outpass (Same Day)</option>
                        <option value="leave">Leave (Overnight)</option>
                    </select>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>From</label>
                        <input
                            type="datetime-local"
                            name="fromDate"
                            value={formData.fromDate}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>To</label>
                        <input
                            type="datetime-local"
                            name="toDate"
                            value={formData.toDate}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>Destination</label>
                    <input
                        type="text"
                        name="destination"
                        value={formData.destination}
                        onChange={handleChange}
                        placeholder="Where are you going?"
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Emergency Contact</label>
                    <input
                        type="tel"
                        name="contactNumber"
                        value={formData.contactNumber}
                        onChange={handleChange}
                        placeholder="10-digit number"
                        pattern="[0-9]{10}"
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Reason</label>
                    <textarea
                        name="reason"
                        value={formData.reason}
                        onChange={handleChange}
                        placeholder="Why are you leaving?"
                        required
                    ></textarea>
                </div>

                <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit Request'}
                </button>
            </form>
        </div>
    );
};

export default LeaveForm;
