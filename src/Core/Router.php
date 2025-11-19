<?php

namespace Kai\Core;

use Kai\Exceptions\HttpException;

class Router
{
    private array $routes = [];
    private Auth $auth;

    public function __construct(Auth $auth)
    {
        $this->auth = $auth;
    }

    public function add(string $method, string $pattern, callable $handler, bool $requiresAuth = true): void
    {
        $method = strtoupper($method);
        $pattern = rtrim($pattern, '/') ?: '/';
        $regex = preg_replace('#\{([a-zA-Z0-9_]+)\}#', '(?P<$1>[^/]+)', $pattern);
        $regex = '#^' . $regex . '$#';

        $this->routes[] = [
            'method' => $method,
            'pattern' => $pattern,
            'regex' => $regex,
            'handler' => $handler,
            'auth' => $requiresAuth,
        ];
    }

    public function dispatch(Request $request, Response $response): void
    {
        foreach ($this->routes as $route) {
            if ($route['method'] !== $request->getMethod()) {
                continue;
            }

            if (preg_match($route['regex'], $request->getPath(), $matches)) {
                $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
                $request->setPathParams($params);

                try {
                    if ($route['auth']) {
                        $this->auth->verifyRequest($request);
                    }

                    $payload = call_user_func($route['handler'], $request);
                    $response->json($payload);
                } catch (HttpException $e) {
                    $response->error($e->getMessage(), $e->getStatus());
                } catch (\Throwable $e) {
                    $status = $e->getCode() >= 400 ? $e->getCode() : 500;
                    $message = $status === 500 && Env::get('APP_DEBUG', 'false') !== 'true'
                        ? 'Server error'
                        : $e->getMessage();
                    $response->error($message, $status);
                }

                return;
            }
        }

        $response->error('Route not found', 404);
    }
}
