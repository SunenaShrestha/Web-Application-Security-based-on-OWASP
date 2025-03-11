<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Enable error reporting
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Log request details
error_log('GET Products Request received');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Log file path for debugging
error_log('Current file path: ' . __FILE__);
error_log('Document root: ' . $_SERVER['DOCUMENT_ROOT']);

// Check if database.php exists
$dbPath = __DIR__ . '/../config/database.php';
if (!file_exists($dbPath)) {
    error_log('Database file not found at: ' . $dbPath);
    echo json_encode([
        'success' => false,
        'error' => 'Database configuration not found'
    ]);
    exit();
}

require_once $dbPath;

try {
    $db = new Database();
    $conn = $db->connect();

    $stmt = $conn->prepare("SELECT * FROM products ORDER BY id DESC");
    $stmt->execute();
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'products' => $products
    ]);
} catch (Exception $e) {
    error_log('Error fetching products: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'error' => 'Failed to fetch products'
    ]);
}
?> 