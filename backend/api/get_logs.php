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
    
    // Count failed attempts in the last hour for brute force detection
    $stmt = $conn->prepare("
        SELECT COUNT(*) as failed_count
        FROM login_attempts
        WHERE success = 0
        AND attempt_time > DATE_SUB(NOW(), INTERVAL 1 HOUR)
    ");
    $stmt->execute();
    $failedCount = $stmt->fetch(PDO::FETCH_ASSOC)['failed_count'];
    
    echo json_encode([
        'success' => true,
        'attempts' => $attempts,
        'brute_force_alert' => ($failedCount > 5) // Alert if more than 5 failed attempts in the last hour
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