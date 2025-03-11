<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Enable error reporting for debugging
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include database connection - use absolute path
$databasePath = __DIR__ . '/../config/database.php';
if (!file_exists($databasePath)) {
    error_log("Database file not found at: " . $databasePath);
    echo json_encode(['success' => false, 'error' => 'Database configuration not found']);
    exit();
}

require_once $databasePath;

try {
    // Validate request method
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Invalid request method');
    }

    // Debug POST data
    error_log("POST data: " . print_r($_POST, true));
    error_log("FILES data: " . print_r($_FILES, true));

    // Get POST data
    $id = $_POST['id'] ?? null;
    $name = $_POST['name'] ?? null;
    $description = $_POST['description'] ?? null;
    $dimensions = $_POST['dimensions'] ?? null;
    $price = $_POST['price'] ?? null;
    $style = $_POST['style'] ?? null;

    // Validate required fields
    if (!$id || !$name || !$description || !$dimensions || !$price || !$style) {
        throw new Exception('Missing required fields');
    }

    // Create database connection
    $db = new Database();
    $conn = $db->connect();

    // Start building update query
    $updateFields = [
        "name = ?",
        "description = ?",
        "dimensions = ?",
        "price = ?",
        "style = ?"
    ];
    $params = [$name, $description, $dimensions, $price, $style];

    // Handle image upload if provided
    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $file = $_FILES['image'];
        $fileName = uniqid() . '_' . basename($file['name']);
        $uploadDir = $_SERVER['DOCUMENT_ROOT'] . '/backend/uploads/';
        $uploadPath = $uploadDir . $fileName;

        // Create uploads directory if it doesn't exist
        if (!file_exists($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        // Get old image to delete
        $stmt = $conn->prepare("SELECT image_url FROM products WHERE id = ?");
        $stmt->execute([$id]);
        $product = $stmt->fetch(PDO::FETCH_ASSOC);

        if (move_uploaded_file($file['tmp_name'], $uploadPath)) {
            // Delete old image if exists
            if ($product && $product['image_url']) {
                $oldImagePath = $_SERVER['DOCUMENT_ROOT'] . '/backend/' . $product['image_url'];
                if (file_exists($oldImagePath)) {
                    unlink($oldImagePath);
                }
            }

            $updateFields[] = "image_url = ?";
            $params[] = 'uploads/' . $fileName;
        }
    }

    // Add id to params array for WHERE clause
    $params[] = $id;

    // Construct and execute update query
    $sql = "UPDATE products SET " . implode(", ", $updateFields) . " WHERE id = ?";
    error_log("SQL Query: " . $sql);
    error_log("Params: " . print_r($params, true));

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception('Failed to prepare update statement');
    }

    $result = $stmt->execute($params);

    if ($result) {
        echo json_encode([
            'success' => true, 
            'message' => 'Product updated successfully'
        ]);
    } else {
        throw new Exception('Failed to update product');
    }

} catch (Exception $e) {
    error_log('Update Error: ' . $e->getMessage());
    echo json_encode([
        'success' => false, 
        'error' => $e->getMessage()
    ]);
}
?> 