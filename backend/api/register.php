<?php
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/database.php';

try {
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validate input
    if (!isset($data['username']) || !isset($data['email']) || !isset($data['password'])) {
        throw new Exception('All fields are required');
    }

    if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Invalid email format');
    }

    $db = new Database();
    $conn = $db->connect();

    // Check if username or email already exists
    $stmt = $conn->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
    $stmt->execute([$data['username'], $data['email']]);
    if ($stmt->fetch()) {
        throw new Exception('Username or email already exists');
    }

    // Hash password
    $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);

    // Insert new user
    $stmt = $conn->prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)");
    $stmt->execute([$data['username'], $data['email'], $hashedPassword]);

    $userId = $conn->lastInsertId();

    // Start session and set user data
    session_start();
    $_SESSION['user_id'] = $userId;
    $_SESSION['username'] = $data['username'];
    $_SESSION['role'] = 'user';

    echo json_encode([
        'success' => true,
        'user' => [
            'id' => $userId,
            'username' => $data['username'],
            'email' => $data['email'],
            'role' => 'user'
        ]
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?> 