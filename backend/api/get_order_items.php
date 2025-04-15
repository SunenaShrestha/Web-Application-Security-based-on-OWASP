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
    
    $orderId = isset($_GET['order_id']) ? intval($_GET['order_id']) : null;
    
    $sql = "
        SELECT 
            id, 
            order_id, 
            product_id, 
            quantity, 
            price
        FROM order_items
    ";
    
    // If order_id is provided, filter by it
    if ($orderId) {
        $sql .= " WHERE order_id = :order_id";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':order_id', $orderId, PDO::PARAM_INT);
    } else {
        $stmt = $conn->prepare($sql);
    }
    
    $stmt->execute();
    $orderItems = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'orderItems' => $orderItems
    ]);
    
} catch (Exception $e) {
    error_log('Get order items error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to fetch order items: ' . $e->getMessage()
    ]);
}
?> 