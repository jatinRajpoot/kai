<?php

namespace Kai\Repositories;

use Kai\Core\Database;
use PDO;

abstract class BaseRepository
{
    protected PDO $pdo;

    public function __construct(Database $database)
    {
        $this->pdo = $database->pdo();
    }
}
