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
    
    if (!isset($data['addressId']) || !isset($data['paymentMethod']) || !isset($data['amount'])) {
        throw new Exception('Missing required fields');
    }

    $db = new Database();
    $conn = $db->connect();
    
    // Start transaction
    $conn->beginTransaction();

    // First verify if the address exists and belongs to the user
    $stmt = $conn->prepare("
        SELECT id FROM addresses 
        WHERE id = ? AND user_id = ?
    ");
    $stmt->execute([$data['addressId'], $_SESSION['user_id']]);
    if (!$stmt->fetch()) {
        throw new Exception('Invalid delivery address');
    }

    // Create order
    $stmt = $conn->prepare("
        INSERT INTO orders (user_id, address_id, payment_method, esewa_number, total_amount)
        VALUES (?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $_SESSION['user_id'],
        $data['addressId'],
        $data['paymentMethod'],
        $data['paymentMethod'] === 'esewa' ? $data['esewaNumber'] : null,
        $data['amount']
    ]);
    
    $orderId = $conn->lastInsertId();

    // Get cart items
    $stmt = $conn->prepare("
        SELECT ci.*, p.price, p.name 
        FROM cart_items ci
        JOIN carts c ON ci.cart_id = c.id
        JOIN products p ON ci.product_id = p.id 
        WHERE c.user_id = ?
    ");
    $stmt->execute([$_SESSION['user_id']]);
    $cartItems = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($cartItems)) {
        throw new Exception('Cart is empty');
    }

    // Add order items
    $stmt = $conn->prepare("
        INSERT INTO order_items (order_id, product_id, quantity, price)
        VALUES (?, ?, ?, ?)
    ");

    foreach ($cartItems as $item) {
        $stmt->execute([
            $orderId,
            $item['product_id'],
            $item['quantity'],
            $item['price']
        ]);
    }

    // Clear cart items
    $stmt = $conn->prepare("
        DELETE ci FROM cart_items ci 
        JOIN carts c ON ci.cart_id = c.id 
        WHERE c.user_id = ?
    ");
    $stmt->execute([$_SESSION['user_id']]);

    // Commit transaction
    $conn->commit();
    
    echo json_encode([
        'success' => true,
        'orderId' => $orderId,
        'message' => 'Order created successfully'
    ]);

} catch (Exception $e) {
    // Rollback transaction on error
    if (isset($conn)) {
        $conn->rollBack();
    }
    
    error_log('Create order error: ' . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?> 