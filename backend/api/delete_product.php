<?php
// Enable error logging to a file
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error.log');

// Enable display errors for debugging
ini_set('display_errors', 1);
error_reporting(E_ALL);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Log the request method and data
error_log("Request Method: " . $_SERVER['REQUEST_METHOD']);
error_log("Raw input: " . file_get_contents('php://input'));

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include database connection
require_once __DIR__ . '/../config/database.php';

// Ensure we're receiving a POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error_log("Invalid request method: " . $_SERVER['REQUEST_METHOD']);
    echo json_encode(['success' => false, 'error' => 'Invalid request method']);
    exit();
}

// Get and validate input
$input = json_decode(file_get_contents('php://input'), true);
error_log("Decoded input: " . print_r($input, true));

if (!$input || !isset($input['id'])) {
    error_log("Invalid input data");
    echo json_encode(['success' => false, 'error' => 'Invalid input data']);
    exit();
}

$id = $input['id'];
error_log("Product ID to delete: " . $id);

try {
    // Create database connection
    $db = new Database();
    $conn = $db->connect();

    // First get the image path to delete the file
    $stmt = $conn->prepare("SELECT image_url FROM products WHERE id = ?");
    if (!$stmt) {
        throw new Exception('Failed to prepare select statement');
    }
    
    $stmt->execute([$id]);
    $product = $stmt->fetch(PDO::FETCH_ASSOC);
    error_log("Found product: " . print_r($product, true));

    if (!$product) {
        echo json_encode(['success' => false, 'error' => 'Product not found']);
        exit();
    }

    // Delete the image file if it exists
    if ($product['image_url']) {
        $imagePath = $_SERVER['DOCUMENT_ROOT'] . '/backend/' . $product['image_url'];
        error_log("Attempting to delete image at: " . $imagePath);
        if (file_exists($imagePath)) {
            unlink($imagePath);
            error_log("Image deleted successfully");
        } else {
            error_log("Image file not found at: " . $imagePath);
        }
    }

    // Delete the product from database
    $stmt = $conn->prepare("DELETE FROM products WHERE id = ?");
    if (!$stmt) {
        throw new Exception('Failed to prepare delete statement');
    }

    $result = $stmt->execute([$id]);
    error_log("Delete query executed. Result: " . ($result ? 'true' : 'false'));

    if ($result) {
        $response = ['success' => true, 'message' => 'Product deleted successfully'];
        error_log("Sending success response: " . json_encode($response));
        echo json_encode($response);
    } else {
        throw new Exception('Failed to delete product');
    }

} catch (PDOException $e) {
    error_log('Database Error: ' . $e->getMessage());
    $response = ['success' => false, 'error' => 'Database error occurred'];
    error_log("Sending error response: " . json_encode($response));
    echo json_encode($response);
} catch (Exception $e) {
    error_log('General Error: ' . $e->getMessage());
    $response = ['success' => false, 'error' => $e->getMessage()];
    error_log("Sending error response: " . json_encode($response));
    echo json_encode($response);
}

// Log the end of the script
error_log("Script completed");
?> 