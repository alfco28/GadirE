<?php
header('Content-Type: application/json');

// Ruta al archivo JSON con la contraseña
$configFile = '/home/alfco28/Desktop/ollama_config.json';

// Leer el archivo JSON
$config = json_decode(file_get_contents($configFile), true);
$correctPassword = $config['password'] ?? '';

// Obtener la contraseña enviada por el cliente
$input = json_decode(file_get_contents('php://input'), true);
$userPassword = $input['password'] ?? '';

// Validar
if ($userPassword === $correctPassword) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false]);
}
?>