<?php
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    if (!isset($_GET['id'])) {
        throw new Exception('Product ID is required');
    }

    $product_id = intval($_GET['id']);
    if ($product_id <= 0) {
        throw new Exception('Invalid product ID');
    }

    $db = new Database();
    $conn = $db->connect();

    // Get product details
    $stmt = $conn->prepare("
        SELECT id, name, description, dimensions, price, style, image_url 
        FROM products 
        WHERE id = ?
    ");
    
    $stmt->execute([$product_id]);
    $product = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$product) {
        throw new Exception('Product not found');
    }

    // Format price to 2 decimal places
    $product['price'] = number_format((float)$product['price'], 2, '.', '');

    // Add full URL for main image
    $product['image_url'] = 'http://localhost/backend/' . $product['image_url'];

    // Initialize empty images array
    $product['images'] = [];

    // Try to get additional images if the table exists
    try {
        $stmt = $conn->prepare("
            SELECT id, image_url, is_primary 
            FROM product_images 
            WHERE product_id = ?
            ORDER BY is_primary DESC, id ASC
        ");
        
        $stmt->execute([$product_id]);
        $images = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Add full URLs to images
        foreach ($images as &$image) {
            $image['image_url'] = 'http://localhost/backend/' . $image['image_url'];
        }

        $product['images'] = $images;
    } catch (Exception $e) {
        // If table doesn't exist or other error, just continue with empty images array
        error_log('Error fetching product images: ' . $e->getMessage());
    }

    // If no additional images, add the main image to the images array
    if (empty($product['images'])) {
        $product['images'] = [[
            'id' => 0,
            'image_url' => $product['image_url'],
            'is_primary' => true
        ]];
    }

    echo json_encode([
        'success' => true,
        'product' => $product
    ]);

} catch (Exception $e) {
    error_log('Product fetch error: ' . $e->getMessage());
    http_response_code($e->getMessage() === 'Product not found' ? 404 : 400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?> 