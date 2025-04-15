<?php
Header set Access-Control-Allow-Origin "http://192.168.1.14:3000/"

Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
Header set Access-Control-Allow-Headers "Content-Type, Authorization"

// Start session
session_start();

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

class LoginProtection {
    private $conn;
    private $ip;
    private $email;
    private $userAgent;
    
    public function __construct($conn, $email) {
        $this->conn = $conn;
        $this->ip = $_SERVER['REMOTE_ADDR'];
        $this->email = $email;
        $this->userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
    }
    
    public function checkBruteForce() {
        // Check for multiple failed attempts
        $stmt = $this->conn->prepare("
            SELECT COUNT(*) as attempts 
            FROM login_attempts 
            WHERE ip_address = ? 
            AND success = 0 
            AND attempt_time > DATE_SUB(NOW(), INTERVAL 10 MINUTE)
        ");
        $stmt->execute([$this->ip]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        error_log("Failed attempts in last 10 minutes: " . $result['attempts']);
        
        if ($result['attempts'] >= 5) {
            throw new Exception('Too many failed attempts. Please try again after 10 minutes.');
        }
        
        // Check for rapid requests
        $stmt = $this->conn->prepare("
            SELECT COUNT(*) as rapid_attempts 
            FROM login_attempts 
            WHERE ip_address = ? 
            AND attempt_time > DATE_SUB(NOW(), INTERVAL 10 SECOND)
        ");
        $stmt->execute([$this->ip]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        error_log("Rapid attempts in last 10 seconds: " . $result['rapid_attempts']);
        
        if ($result['rapid_attempts'] >= 5) {
            throw new Exception('Too many requests. Please slow down.');
        }
    }
    
    public function logAttempt($success) {
        try {
            $stmt = $this->conn->prepare("
                INSERT INTO login_attempts (ip_address, email, user_agent, success) 
                VALUES (?, ?, ?, ?)
            ");
            $stmt->execute([$this->ip, $this->email, $this->userAgent, $success]);
            
            error_log("Login attempt logged - IP: {$this->ip}, Email: {$this->email}, Success: " . ($success ? 'true' : 'false'));
        } catch (Exception $e) {
            error_log("Error logging attempt: " . $e->getMessage());
        }
    }
}

try {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['email']) || !isset($data['password'])) {
        throw new Exception('Email and password are required');
    }

    $db = new Database();
    $conn = $db->connect();
    
    // Initialize login protection
    $protection = new LoginProtection($conn, $data['email']);
    
    // Check for brute force attempts
    $protection->checkBruteForce();

    // Get user
    $stmt = $conn->prepare("SELECT id, username, email, password, role FROM users WHERE email = ?");
    $stmt->execute([$data['email']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !password_verify($data['password'], $user['password'])) {
        // Log failed attempt
        $protection->logAttempt(false);
        
        // Sleep to prevent timing attacks
        sleep(1);
        
        throw new Exception('Invalid email or password');
    }

    // Log successful attempt
    $protection->logAttempt(true);

    // Regenerate session ID for security
    session_regenerate_id(true);

    // Set session data
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['username'] = $user['username'];
    $_SESSION['role'] = $user['role'];
    $_SESSION['last_activity'] = time();

    // Remove password before sending
    unset($user['password']);

    echo json_encode([
        'success' => true,
        'user' => $user
    ]);

} catch (Exception $e) {
    error_log('Login error: ' . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?> 