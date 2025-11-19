<?php

namespace Kai\Core;

use Kai\Exceptions\HttpException;

class Auth
{
    private string $email;
    private string $password;
    private string $token;

    public function __construct()
    {
        $this->email = Env::get('AUTH_EMAIL', 'owner@kai.local');
        $this->password = Env::get('AUTH_PASSWORD', 'secret123');
        $this->token = Env::get('API_SHARED_TOKEN', 'changeme-token');
    }

    public function verifyRequest(Request $request): void
    {
        $incoming = $request->getBearerToken();
        if (!$incoming || !hash_equals($this->token, $incoming)) {
            throw new HttpException(401, 'Invalid or missing token');
        }
    }

    public function login(string $email, string $password): string
    {
        if ($email !== $this->email || !hash_equals($this->password, $password)) {
            throw new HttpException(401, 'Invalid credentials');
        }

        return $this->token;
    }
}
