<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'ok' => false,
        'message' => 'Method Not Allowed'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw ?: '', true);

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode([
        'ok' => false,
        'message' => 'Invalid JSON body'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$storageDir = __DIR__ . '/../storage';
if (!is_dir($storageDir) && !mkdir($storageDir, 0775, true) && !is_dir($storageDir)) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'message' => 'Failed to create storage directory'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$logFile = $storageDir . '/scan-events.ndjson';
$line = json_encode([
    'serverTime' => date('c'),
    'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
    'userAgent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
    'eventType' => $data['eventType'] ?? 'unknown',
    'payload' => $data['payload'] ?? null,
    'clientTime' => $data['clientTime'] ?? null
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

if ($line === false) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'message' => 'Failed to encode log line'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$fp = fopen($logFile, 'ab');
if ($fp === false) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'message' => 'Failed to open log file'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    if (!flock($fp, LOCK_EX)) {
        throw new RuntimeException('Failed to lock log file');
    }
    fwrite($fp, $line . PHP_EOL);
    fflush($fp);
    flock($fp, LOCK_UN);
} catch (Throwable $e) {
    fclose($fp);
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

fclose($fp);

echo json_encode([
    'ok' => true
], JSON_UNESCAPED_UNICODE);
