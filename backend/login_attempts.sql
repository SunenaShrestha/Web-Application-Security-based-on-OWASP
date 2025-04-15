-- Login attempts table to track login activities and detect brute force attacks
CREATE TABLE IF NOT EXISTS login_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL, -- IPv6 compatibility
    email VARCHAR(255) NOT NULL, 
    attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_agent TEXT,
    success TINYINT(1) NOT NULL DEFAULT 0,
    INDEX (ip_address),
    INDEX (email),
    INDEX (attempt_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4; 