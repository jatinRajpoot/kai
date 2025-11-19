<?php

namespace Kai\Core;

class Response
{
    public function json($data, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json');
        echo json_encode([
            'data' => $data,
            'meta' => [
                'timestamp' => gmdate('c'),
            ],
        ]);
    }

    public function error(string $message, int $status): void
    {
        http_response_code($status);
        header('Content-Type: application/json');
        echo json_encode([
            'error' => $message,
            'meta' => [
                'timestamp' => gmdate('c'),
            ],
        ]);
    }
}
