<?php
require_once __DIR__ . '/../config/database.php';

try {
    $db = new Database();
    $conn = $db->connect();

    $password = 'Admin@123';
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $conn->prepare("UPDATE users SET password = ? WHERE email = ?");
    $result = $stmt->execute([$hashedPassword, 'admin@tysnp.com']);

    if ($result) {
        echo "Admin password reset successfully\n";
        echo "New password hash: " . $hashedPassword . "\n";
    } else {
        echo "Failed to reset admin password\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?> 