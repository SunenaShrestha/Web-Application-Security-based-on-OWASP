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
        throw new Exception('Please login to add items to cart');
    }

    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['product_id']) || !isset($data['quantity'])) {
        throw new Exception('Invalid request data');
    }

    $product_id = intval($data['product_id']);
    $quantity = intval($data['quantity']);

    if ($quantity <= 0) {
        throw new Exception('Invalid quantity');
    }

    require_once '../config/database.php';
    $db = new Database();
    $conn = $db->connect();

    // Check if product exists
    $stmt = $conn->prepare("SELECT id, price FROM products WHERE id = ?");
    $stmt->execute([$product_id]);
    $product = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$product) {
        throw new Exception('Product not found');
    }

    // Begin transaction
    $conn->beginTransaction();

    try {
        // Get or create cart for user
        $stmt = $conn->prepare("SELECT id FROM carts WHERE user_id = ?");
        $stmt->execute([$_SESSION['user_id']]);
        $cart = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$cart) {
            // Create new cart
            $stmt = $conn->prepare("INSERT INTO carts (user_id) VALUES (?)");
            $stmt->execute([$_SESSION['user_id']]);
            $cart_id = $conn->lastInsertId();
        } else {
            $cart_id = $cart['id'];
        }

        // Check if product already in cart
        $stmt = $conn->prepare("
            SELECT id, quantity 
            FROM cart_items 
            WHERE cart_id = ? AND product_id = ?
        ");
        $stmt->execute([$cart_id, $product_id]);
        $cart_item = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($cart_item) {
            // Update existing cart item
            $stmt = $conn->prepare("
                UPDATE cart_items 
                SET quantity = quantity + ? 
                WHERE id = ?
            ");
            $stmt->execute([$quantity, $cart_item['id']]);
        } else {
            // Add new cart item
            $stmt = $conn->prepare("
                INSERT INTO cart_items (cart_id, product_id, quantity) 
                VALUES (?, ?, ?)
            ");
            $stmt->execute([$cart_id, $product_id, $quantity]);
        }

        $conn->commit();

        echo json_encode([
            'success' => true,
            'message' => 'Product added to cart successfully'
        ]);

    } catch (Exception $e) {
        $conn->rollBack();
        throw $e;
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?> 