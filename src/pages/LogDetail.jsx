import { useEffect, useState } from 'react';
import { fetchLoginAttempts } from './Admin.jsx';
import './LogDetail.css';

const LogDetail = ({ isOpen, onClose, logId }) => {
    const [loginAttempts, setLoginAttempts] = useState([]);
    const [selectedLog, setSelectedLog] = useState(null);
    const [isBruteForce, setIsBruteForce] = useState(false);
    const [isSqlInjection, setIsSqlInjection] = useState(false);

    // SQL injection patterns to detect
    const sqlInjectionPatterns = [
        /['"](?:\s*OR\s+['"]?[^'"]*['"]?\s*=\s*['"]?[^'"]*['"]?|\s*UNION\s+SELECT)/i,
        /['"]\s*;\s*(?:DROP|DELETE|UPDATE|INSERT|SELECT)/i,
        /['"]\s*--\s*$/,
        /['"]\s*\/\*.*\*\/\s*['"]/,
        /['"]\s*WAITFOR\s+DELAY/i,
        /['"]\s*EXEC\s*\(/i,
        /['"]\s*sp_/i,
        /['"]\s*xp_/i
    ];

    const checkForSqlInjection = (input) => {
        if (!input) return false;
        return sqlInjectionPatterns.some(pattern => pattern.test(input));
    };

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
                        const recentFailedAttempts = data.attempts.filter(attempt => {
                            // Convert success to number for comparison
                            const success = parseInt(attempt.success);
                            return (
                                attempt.ip_address === log.ip_address &&
                                success === 0 && // Failed attempt
                                new Date(attempt.attempt_time) > new Date(Date.now() - 30 * 60 * 1000) // Last 30 minutes
                            );
                        });

                        console.log('Recent failed attempts:', recentFailedAttempts.length);
                        setIsBruteForce(recentFailedAttempts.length >= 5);
    
                        // SQL Injection Detection
                        const isEmailSqlInjection = checkForSqlInjection(log.email);
                        const isUserAgentSqlInjection = checkForSqlInjection(log.user_agent);
                        setIsSqlInjection(isEmailSqlInjection || isUserAgentSqlInjection);
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
                    {(isBruteForce || isSqlInjection) && (
                        <div className="security-warnings">
                            {isBruteForce && (
                                <div className="brute-force-warning">
                                    ⚠️ Warning: Multiple failed login attempts detected from this IP address. 
                                    This may indicate a brute force attack.
                                </div>
                            )}
                            {isSqlInjection && (
                                <div className="sql-injection-warning">
                                    ⚠️ Warning: SQL injection attempt detected in the login attempt.
                                    This is a potential security threat.
                                </div>
                            )}
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
                            <span className={`status ${parseInt(selectedLog.success) === 1 ? 'success' : 'failure'}`}>
                                {parseInt(selectedLog.success) === 1 ? 'Success' : 'Failed'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LogDetail; 