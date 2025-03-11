<?php
require_once __DIR__ . '/../config/database.php';

try {
    $db = new Database();
    $conn = $db->connect();

    // Check if admin already exists
    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute(['admin@tysnp.com']);
    
    if ($stmt->fetch()) {
        echo "Admin user already exists\n";
        exit();
    }

    // Create admin user
    $stmt = $conn->prepare(
        "INSERT INTO users (username, email, password, role, created_at) 
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)"
    );

    $password = password_hash('Admin@123', PASSWORD_DEFAULT);
    
    $stmt->execute([
        'Admin',
        'admin@tysnp.com',
        $password,
        'admin'
    ]);

    echo "Admin user created successfully\n";

} catch (Exception $e) {
    echo "Error creating admin user: " . $e->getMessage() . "\n";
}
?> 