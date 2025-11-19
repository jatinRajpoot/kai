<?php

namespace Kai\Core;

use PDO;
use PDOException;

class Database
{
    private PDO $connection;

    public function __construct()
    {
        $host = Env::get('DB_HOST', '127.0.0.1');
        $port = Env::get('DB_PORT', '3306');
        $db = Env::get('DB_DATABASE', 'kai');
        $username = Env::get('DB_USERNAME', 'root');
        $password = Env::get('DB_PASSWORD', '');

        $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $host, $port, $db);

        try {
            $this->connection = new PDO($dsn, $username, $password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]);
        } catch (PDOException $e) {
            throw new PDOException('Could not connect to database: ' . $e->getMessage(), (int) $e->getCode(), $e);
        }
    }

    public function pdo(): PDO
    {
        return $this->connection;
    }
}
