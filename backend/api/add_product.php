<?php
// Start output buffering to catch any unwanted output
ob_start();

// Enable error reporting
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/debug.log');
error_reporting(E_ALL);
ini_set('display_errors', 0);

require_once '../config/database.php';

// Set headers
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

// Start session to check authentication
session_start();

// Function to send JSON response
function sendJsonResponse($data) {
    if (ob_get_length()) ob_clean();
    echo json_encode($data);
    exit();
}

try {
    // Check if user is authenticated and is admin
    if (!isset($_SESSION['user_id']) || !isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
        throw new Exception('Unauthorized access');
    }

    // Debug incoming request
    error_log("Request received: " . $_SERVER['REQUEST_METHOD']);
    error_log("POST data: " . print_r($_POST, true));
    error_log("FILES data: " . print_r($_FILES, true));

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        sendJsonResponse(['status' => 'ok']);
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Invalid request method');
    }

    // Validate incoming data
    $required_fields = ['name', 'description', 'dimensions', 'price', 'style'];
    $product_data = [];

    foreach ($required_fields as $field) {
        if (!isset($_POST[$field]) || trim($_POST[$field]) === '') {
            error_log("Missing or empty field: $field");
            throw new Exception("Missing required field: $field");
        }
        $product_data[$field] = trim($_POST[$field]);
    }

    // Validate price
    if (!is_numeric($_POST['price']) || floatval($_POST['price']) <= 0) {
        throw new Exception('Invalid price value');
    }
    $product_data['price'] = floatval($_POST['price']);

    // Validate style
    $allowed_styles = ['Matte', 'Glossy', 'Holographic'];
    if (!in_array($product_data['style'], $allowed_styles)) {
        throw new Exception('Invalid style value');
    }

    // Handle file upload
    $image_url = null;
    if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('Product image is required');
    }

    $upload_dir = __DIR__ . "/../uploads/";
    if (!file_exists($upload_dir)) {
        if (!mkdir($upload_dir, 0777, true)) {
            error_log("Failed to create upload directory");
            throw new Exception("Failed to create upload directory");
        }
    }

    // Ensure directory is writable
    if (!is_writable($upload_dir)) {
        error_log("Upload directory is not writable: " . $upload_dir);
        throw new Exception("Upload directory is not writable");
    }

    // Validate file type
    $allowed_types = ['image/jpeg', 'image/png', 'image/gif'];
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime_type = finfo_file($finfo, $_FILES['image']['tmp_name']);
    finfo_close($finfo);

    if (!in_array($mime_type, $allowed_types)) {
        throw new Exception('Invalid file type. Only JPG, PNG and GIF are allowed.');
    }

    $file_extension = strtolower(pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION));
    $file_name = uniqid() . '.' . $file_extension;
    $target_file = $upload_dir . $file_name;

    if (!move_uploaded_file($_FILES['image']['tmp_name'], $target_file)) {
        $upload_error = error_get_last();
        error_log("Failed to move uploaded file. Error: " . print_r($upload_error, true));
        throw new Exception("Failed to upload image");
    }

    $image_url = 'uploads/' . $file_name;

    // Connect to database
    $db = new Database();
    $conn = $db->connect();

    // Prepare database insert
    $sql = "INSERT INTO products (name, description, dimensions, price, style, image_url) 
            VALUES (:name, :description, :dimensions, :price, :style, :image_url)";
    
    $stmt = $conn->prepare($sql);
    
    $params = [
        ':name' => $product_data['name'],
        ':description' => $product_data['description'],
        ':dimensions' => $product_data['dimensions'],
        ':price' => $product_data['price'],
        ':style' => $product_data['style'],
        ':image_url' => $image_url
    ];

    error_log("SQL Parameters: " . print_r($params, true));

    if (!$stmt->execute($params)) {
        $error = $stmt->errorInfo();
        error_log("Database error: " . print_r($error, true));
        throw new Exception("Failed to insert into database");
    }

    // After successfully inserting the product and getting its ID
    $product_id = $conn->lastInsertId();

    // Add the main image to product_images
    $stmt = $conn->prepare("
        INSERT INTO product_images (product_id, image_url, is_primary) 
        VALUES (?, ?, true)
    ");
    $stmt->execute([$product_id, $image_url]);

    sendJsonResponse([
        'success' => true,
        'message' => 'Product added successfully',
        'product_id' => $conn->lastInsertId()
    ]);

} catch (Exception $e) {
    error_log("Error occurred: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    
    sendJsonResponse([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?> 