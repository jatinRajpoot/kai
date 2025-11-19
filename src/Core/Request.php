<?php

namespace Kai\Core;

class Request
{
    private array $server;
    private array $query;
    private array $headers;
    private array $body;
    private array $pathParams = [];

    public static function fromGlobals(): self
    {
        $instance = new self();
        $instance->server = $_SERVER;
        $instance->query = $_GET;
        $instance->headers = function_exists('getallheaders') ? getallheaders() : [];

        $content = file_get_contents('php://input') ?: '';
        $decoded = json_decode($content, true);
        $instance->body = is_array($decoded) ? $decoded : [];

        return $instance;
    }

    public function getMethod(): string
    {
        return strtoupper($this->server['REQUEST_METHOD'] ?? 'GET');
    }

    public function getPath(): string
    {
        $uri = $this->server['REQUEST_URI'] ?? '/';
        $path = parse_url($uri, PHP_URL_PATH) ?? '/';
        return rtrim($path, '/') ?: '/';
    }

    public function getQuery(string $key, $default = null)
    {
        return $this->query[$key] ?? $default;
    }

    public function getJson(): array
    {
        return $this->body;
    }

    public function setPathParams(array $params): void
    {
        $this->pathParams = $params;
    }

    public function getPathParam(string $key, $default = null)
    {
        return $this->pathParams[$key] ?? $default;
    }

    public function getBearerToken(): ?string
    {
        $header = $this->headers['Authorization']
            ?? $this->headers['authorization']
            ?? ($this->server['HTTP_AUTHORIZATION'] ?? null);
        if (!$header || !str_starts_with($header, 'Bearer ')) {
            return null;
        }

        return substr($header, 7);
    }
}
