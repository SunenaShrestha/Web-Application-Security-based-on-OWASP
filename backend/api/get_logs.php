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
            MIN(attempt_time) as first_attempt
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
    
    // Debug log
    error_log("Failed attempts in last 10 minutes: " . $failedCount);
    error_log("Time difference between attempts: " . $timeDiff . " seconds");
    error_log("Is brute force attack: " . ($isBruteForceAttack ? "yes" : "no"));
    
    echo json_encode([
        'success' => true,
        'attempts' => $attempts,
        'brute_force_alert' => $isBruteForceAttack
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