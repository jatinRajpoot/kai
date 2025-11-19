<?php

namespace Kai\Controllers;

use Kai\Core\Auth;
use Kai\Core\Request;

class AuthController
{
    private Auth $auth;

    public function __construct(Auth $auth)
    {
        $this->auth = $auth;
    }

    public function login(Request $request): array
    {
        $payload = $request->getJson();
        $token = $this->auth->login($payload['email'] ?? '', $payload['password'] ?? '');

        return ['token' => $token];
    }
}
