<?php
// Prevent PHP from outputting errors as HTML
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Set headers
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

// Start output buffering to catch any unwanted output
ob_start();

session_start();

// Debug logging
error_log("Session data: " . print_r($_SESSION, true));

// Function to send JSON response
function sendJsonResponse($success, $data, $statusCode = 200) {
    // Clear any output buffered
    if (ob_get_length()) ob_clean();
    
    http_response_code($statusCode);
    echo json_encode([
        'success' => $success,
        'error' => isset($data['error']) ? $data['error'] : null,
        'items' => isset($data['items']) ? $data['items'] : null
    ]);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    sendJsonResponse(true, [], 200);
}

try {
    // Check if user is logged in
    if (!isset($_SESSION['user_id'])) {
        throw new Exception('Please login to view cart');
    }

    require_once '../config/database.php';
    $db = new Database();
    $conn = $db->connect();

    // First, check if user has a cart
    $stmt = $conn->prepare("
        SELECT c.id 
        FROM carts c 
        WHERE c.user_id = ? 
        LIMIT 1
    ");

    if (!$stmt->execute([$_SESSION['user_id']])) {
        $error = $stmt->errorInfo();
        error_log("Database error: " . print_r($error, true));
        throw new Exception('Database error: Failed to check cart');
    }

    $cart = $stmt->fetch(PDO::FETCH_ASSOC);
    error_log("Cart data: " . print_r($cart, true));

    // If no cart exists, return empty items array
    if (!$cart) {
        ob_clean();
        echo json_encode([
            'success' => true,
            'items' => []
        ]);
        exit();
    }

    // Get cart items with product details
    $stmt = $conn->prepare("
        SELECT 
            ci.id as id,
            ci.quantity,
            p.id as product_id,
            p.name,
            p.description,
            p.price,
            p.style,
            p.image_url,
            p.dimensions
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.cart_id = ?
        ORDER BY ci.created_at DESC
    ");

    if (!$stmt->execute([$cart['id']])) {
        throw new Exception('Database error: Failed to fetch cart items');
    }

    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format items
    foreach ($items as &$item) {
        $item['price'] = number_format((float)$item['price'], 2, '.', '');
        $item['image_url'] = 'http://localhost/backend/' . $item['image_url'];
        $item['total'] = number_format((float)$item['price'] * $item['quantity'], 2, '.', '');
    }

    sendJsonResponse(true, ['items' => $items]);

} catch (Exception $e) {
    error_log("Cart error: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    
    ob_clean();
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?> 