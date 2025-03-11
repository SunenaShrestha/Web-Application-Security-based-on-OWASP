<?php
session_start();
header('Content-Type: application/json');

require_once '../config/database.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Not authenticated']);
    exit();
}

try {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['esewaNumber'])) {
        throw new Exception('eSewa number is required');
    }

    // Validate eSewa number format (assuming 10 digits)
    if (!preg_match('/^[0-9]{10}$/', $data['esewaNumber'])) {
        throw new Exception('Invalid eSewa number format');
    }

    // Generate OTP
    $otp = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
    
    // Store OTP in session for verification
    $_SESSION['esewa_otp'] = [
        'code' => $otp,
        'number' => $data['esewaNumber'],
        'expires' => time() + 300 // 5 minutes expiry
    ];

    // In a real application, you would send this OTP via SMS
    // For demo purposes, we'll just return it
    echo json_encode([
        'success' => true,
        'message' => 'OTP sent successfully',
        'demo_otp' => $otp // Remove this in production
    ]);

} catch (Exception $e) {
    error_log('Request eSewa OTP error: ' . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?> 