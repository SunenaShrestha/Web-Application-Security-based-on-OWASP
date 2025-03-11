<?php
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

session_start();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    if (!isset($_SESSION['user_id'])) {
        throw new Exception('Please login to update cart');
    }

    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['item_id']) || !isset($data['quantity'])) {
        throw new Exception('Invalid request data');
    }

    if ($data['quantity'] <= 0) {
        throw new Exception('Invalid quantity');
    }

    require_once '../config/database.php';
    $db = new Database();
    $conn = $db->connect();

    $stmt = $conn->prepare("
        UPDATE cart_items 
        SET quantity = ? 
        WHERE id = ? AND cart_id IN (SELECT id FROM carts WHERE user_id = ?)
    ");
    
    if (!$stmt->execute([$data['quantity'], $data['item_id'], $_SESSION['user_id']])) {
        throw new Exception('Failed to update cart');
    }

    echo json_encode([
        'success' => true,
        'message' => 'Cart updated successfully'
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?> 