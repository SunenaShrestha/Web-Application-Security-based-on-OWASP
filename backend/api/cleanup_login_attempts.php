<?php
require_once '../config/database.php';

try {
    $db = new Database();
    $conn = $db->connect();
    
    // Remove attempts older than 24 hours
    $stmt = $conn->prepare("
        DELETE FROM login_attempts 
        WHERE attempt_time < DATE_SUB(NOW(), INTERVAL 24 HOUR)
    ");
    $stmt->execute();
    
    echo "Cleanup completed successfully\n";
} catch (Exception $e) {
    echo "Cleanup error: " . $e->getMessage() . "\n";
}
?> 