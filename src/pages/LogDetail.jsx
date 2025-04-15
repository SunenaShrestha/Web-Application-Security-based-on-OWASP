import { useEffect, useState } from 'react';
import { fetchLoginAttempts } from './Admin.jsx';
import './LogDetail.css';

const LogDetail = ({ isOpen, onClose, logId }) => {
    const [loginAttempts, setLoginAttempts] = useState([]);
    const [selectedLog, setSelectedLog] = useState(null);
    const [isBruteForce, setIsBruteForce] = useState(false);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await fetch('http://localhost/backend/api/get_logs.php');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                if (data.success) {
                    setLoginAttempts(data.attempts);
    
                    // Find selected log
                    const log = data.attempts.find(attempt => attempt.id == logId);
                    if (log) {
                        setSelectedLog(log);
    
                        // Brute Force Detection
                        const recentFailedAttempts = data.attempts.filter(
                            attempt =>
                                attempt.ip_address === log.ip_address &&
                                parseInt(attempt.success) === 0 &&
                                new Date(attempt.attempt_time) > new Date(Date.now() - 30 * 60 * 1000)
                        );
                        setIsBruteForce(recentFailedAttempts.length >= 5);
                    }
                }
            } catch (error) {
                console.error('Error fetching logs:', error);
            }
        };
    
        if (isOpen && logId) {
            fetchLogs();
        }
    }, [isOpen, logId]);
    

    if (!isOpen || !selectedLog) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Log Details</h2>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>
                <div className="modal-body">
                    {isBruteForce && (
                        <div className="brute-force-warning">
                            ⚠️ Warning: Multiple failed login attempts detected from this IP address. 
                            This may indicate a brute force attack.
                        </div>
                    )}
                    <div className="log-details">
                        <div className="detail-row">
                            <span className="detail-label">ID:</span>
                            <span className="detail-value">{selectedLog.id}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">IP Address:</span>
                            <span className="detail-value">{selectedLog.ip_address}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Email:</span>
                            <span className="detail-value">{selectedLog.email}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Attempt Time:</span>
                            <span className="detail-value">{selectedLog.attempt_time}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">User Agent:</span>
                            <span className="detail-value">{selectedLog.user_agent}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Status:</span>
                            <span className={`status ${selectedLog.success === 1 ? 'success' : 'failure'}`}>
                                {selectedLog.success === 1 ? 'Success' : 'Failed'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LogDetail; 