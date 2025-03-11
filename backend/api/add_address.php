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

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Not authenticated']);
    exit();
}

try {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['fullName']) || !isset($data['phone']) || !isset($data['street']) || 
        !isset($data['city']) || !isset($data['province'])) {
        throw new Exception('Missing required fields');
    }

    $db = new Database();
    $conn = $db->connect();
    
    $stmt = $conn->prepare("
        INSERT INTO addresses (user_id, full_name, phone, street, city, province, landmark)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    
    $result = $stmt->execute([
        $_SESSION['user_id'],
        $data['fullName'],
        $data['phone'],
        $data['street'],
        $data['city'],
        $data['province'],
        $data['landmark'] ?? null
    ]);
    
    if (!$result) {
        throw new Exception('Failed to save address');
    }
    
    $addressId = $conn->lastInsertId();
    
    echo json_encode([
        'success' => true,
        'addressId' => $addressId,
        'message' => 'Address saved successfully'
    ]);

} catch (Exception $e) {
    error_log('Add address error: ' . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?> 