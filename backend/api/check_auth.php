<?php
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

// Enable error logging
error_log("Check Auth endpoint called");

// Set execution time limit
set_time_limit(30);

// Start session
session_start();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Check if session exists
    if (!isset($_SESSION['user_id'])) {
        throw new Exception('Not authenticated');
    }

    // Check for 30 minutes of inactivity
    $inactive = 1800; // 30 minutes
    if (isset($_SESSION['last_activity']) && (time() - $_SESSION['last_activity'] > $inactive)) {
        session_destroy();
        throw new Exception('Session expired due to inactivity');
    }

    // Update last activity time
    $_SESSION['last_activity'] = time();

    require_once '../config/database.php';
    
    $db = new Database();
    $conn = $db->connect();

    // Get user data
    $stmt = $conn->prepare("
        SELECT id, username, email, role 
        FROM users 
        WHERE id = ?
    ");
    
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        session_destroy();
        throw new Exception('User not found');
    }

    // CRITICAL: Verify we have username
    if (empty($user['username'])) {
        error_log("Username missing for user: " . print_r($user, true));
        throw new Exception('Invalid user data');
    }

    // Log the user data being sent
    error_log("Sending user data from check_auth: " . print_r($user, true));

    // Verify role matches session
    if ($user['role'] !== $_SESSION['role']) {
        session_destroy();
        throw new Exception('Session mismatch');
    }

    echo json_encode([
        'success' => true,
        'user' => $user
    ]);

} catch (Exception $e) {
    error_log("Check Auth Error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?> 