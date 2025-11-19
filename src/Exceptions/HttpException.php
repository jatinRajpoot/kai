<?php

namespace Kai\Exceptions;

use Exception;

class HttpException extends Exception
{
    private int $status;

    public function __construct(int $status, string $message)
    {
        parent::__construct($message, $status);
        $this->status = $status;
    }

    public function getStatus(): int
    {
        return $this->status;
    }
}
