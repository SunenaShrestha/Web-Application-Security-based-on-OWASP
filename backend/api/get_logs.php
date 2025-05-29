<?php
    session_start();
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: http://localhost:3000');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }

    require_once '../config/database.php';

    try {
        $db = new Database();
        $conn = $db->connect();
        
        // In a production app, add authentication check for admin here
        
        // Get all login attempts
        $stmt = $conn->prepare("
            SELECT 
                id, 
                ip_address, 
                email, 
                attempt_time, 
                user_agent, 
                success
            FROM login_attempts 
            ORDER BY attempt_time DESC
            LIMIT 100
        ");
        
        $stmt->execute();
        $attempts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Count failed attempts in the last 10 minutes for brute force detection
        $stmt = $conn->prepare("
            SELECT 
                COUNT(*) as failed_count,
                MAX(attempt_time) as last_attempt,
                MIN(attempt_time) as first_attempt,
                GROUP_CONCAT(id) as attempt_ids
            FROM login_attempts
            WHERE success = 0
            AND attempt_time > DATE_SUB(NOW(), INTERVAL 10 MINUTE)
        ");
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $failedCount = $result['failed_count'];
        $lastAttempt = strtotime($result['last_attempt']);
        $firstAttempt = strtotime($result['first_attempt']);
        
        // Calculate time difference between first and last attempt
        $timeDiff = $lastAttempt - $firstAttempt;
        
        // Consider it a new attack session if:
        // 1. There are 5 or more failed attempts AND
        // 2. The attempts occurred within a 5-minute window
        $isBruteForceAttack = $failedCount >= 5 && $timeDiff <= 300; // 300 seconds = 5 minutes

        // Debug logging for brute force detection
        error_log("Brute Force Check - Failed attempts: " . $failedCount);
        error_log("Brute Force Check - Time difference: " . $timeDiff . " seconds");
        error_log("Brute Force Check - Is attack: " . ($isBruteForceAttack ? "yes" : "no"));

        // Generate a unique session ID for this attack
        $bruteForceSessionId = null;
        if ($isBruteForceAttack) {
            $bruteForceSessionId = md5($result['attempt_ids'] . $result['first_attempt'] . $result['last_attempt']);
            error_log("Brute Force Attack Session ID: " . $bruteForceSessionId);
        }
        
        // Debug log the input before checking
        if ($attempts[0] ?? null) {
            error_log("Checking for SQL injection in email: '" . $attempts[0]['email'] . "'");
        }

        // SQL injection patterns to detect
        $sqlInjectionPatterns = array(
            // DROP TABLE patterns - put these first and make them very explicit
            '/^DROP\s+TABLE/i',                    // Starts with DROP TABLE
            '/^DROP\s+TABLE\s+users/i',           // Exact match for users table
            '/DROP\s+TABLE\s+users;\s*--/i',      // With semicolon and comment
            '/DROP\s+TABLE\s+users\s*--/i',       // Without semicolon, with comment
            
            // Other common patterns
            '/[\'"](?:\s*OR\s+[\'"]?[^\'"]*[\'"]?\s*=\s*[\'"]?[^\'"]*[\'"]?|\s*UNION\s+SELECT)/i',
            '/[\'"]?\s*;\s*(?:DROP|DELETE|UPDATE|INSERT|SELECT)/i',
            '/--\s*$/i',
            '/[\'"]\/\*.*\*\/\s*[\'"]/',
            '/[\'"]WAITFOR\s+DELAY/i',
            '/[\'"]EXEC\s*\(/i',
            '/[\'"]sp_/i',
            '/[\'"]xp_/i',
            '/\s+OR\s+[\'"]?\d+[\'"]?\s*=\s*[\'"]?\d+[\'"]?/i',
            '/\s+OR\s+[\'"]?[a-z0-9]+=\s*[\'"]?[a-z0-9]+[\'"]?/i'
        );

        // Check for SQL injection in the most recent attempt
        $latestAttempt = $attempts[0] ?? null;
        $isSqlInjection = false;
        $sqlInjectionAttemptId = null;
        $sqlInjectionDetails = null;

        if ($latestAttempt) {
            // First try direct string match for DROP TABLE
            if (stripos($latestAttempt['email'], 'DROP TABLE') !== false) {
                error_log("Found DROP TABLE via direct string match");
                $isSqlInjection = true;
                $sqlInjectionAttemptId = $latestAttempt['id'];
                $sqlInjectionDetails = array(
                    'type' => 'email',
                    'pattern' => 'direct_match',
                    'matched_text' => $latestAttempt['email'],
                    'full_content' => $latestAttempt['email'],
                    'timestamp' => $latestAttempt['attempt_time'],
                    'attack_id' => md5($latestAttempt['email'] . $latestAttempt['attempt_time'])
                );
            }

            // If no direct match, try patterns
            if (!$isSqlInjection) {
                foreach ($sqlInjectionPatterns as $pattern) {
                    // Check email field
                    if (preg_match($pattern, $latestAttempt['email'], $matches)) {
                        error_log("SQL Injection detected in email with pattern: " . $pattern);
                        error_log("Matched text in email: " . $matches[0]);
                        $isSqlInjection = true;
                        $sqlInjectionAttemptId = $latestAttempt['id'];
                        $sqlInjectionDetails = array(
                            'type' => 'email',
                            'pattern' => $pattern,
                            'matched_text' => $matches[0],
                            'full_content' => $latestAttempt['email'],
                            'timestamp' => $latestAttempt['attempt_time'],
                            'attack_id' => md5($matches[0] . $latestAttempt['attempt_time'])
                        );
                        break;
                    }
                    // Check user agent field
                    if (preg_match($pattern, $latestAttempt['user_agent'], $matches)) {
                        error_log("SQL Injection detected in user agent with pattern: " . $pattern);
                        error_log("Matched text in user agent: " . $matches[0]);
                        $isSqlInjection = true;
                        $sqlInjectionAttemptId = $latestAttempt['id'];
                        $sqlInjectionDetails = array(
                            'type' => 'user_agent',
                            'pattern' => $pattern,
                            'matched_text' => $matches[0],
                            'full_content' => $latestAttempt['user_agent'],
                            'timestamp' => $latestAttempt['attempt_time'],
                            'attack_id' => md5($matches[0] . $latestAttempt['attempt_time'])
                        );
                        break;
                    }
                }
            }
        }
        
        // Debug log
        error_log("Failed attempts in last 10 minutes: " . $failedCount);
        error_log("Time difference between attempts: " . $timeDiff . " seconds");
        error_log("Is brute force attack: " . ($isBruteForceAttack ? "yes" : "no"));
        error_log("Last attempt time: " . $result['last_attempt']);
        
        echo json_encode([
            'success' => true,
            'attempts' => $attempts,
            'brute_force_alert' => $isBruteForceAttack,
            'attack_info' => [
                'failed_count' => $failedCount,
                'last_attempt_time' => $result['last_attempt'],
                'first_attempt_time' => $result['first_attempt'],
                'attack_session_id' => $bruteForceSessionId
            ],
            'sql_injection_alert' => $isSqlInjection,
            'sql_injection_info' => $sqlInjectionDetails
        ]);
        
    } catch (Exception $e) {
        error_log('Get logs error: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Failed to fetch login attempts: ' . $e->getMessage()
        ]);
    }
    ?> 