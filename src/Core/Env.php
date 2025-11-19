<?php

namespace Kai\Core;

class Env
{
    private static array $values = [];

    public static function load(string $path): void
    {
        if (!file_exists($path)) {
            return;
        }

        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines === false) {
            return;
        }

        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#')) {
                continue;
            }

            [$key, $value] = array_map('trim', explode('=', $line, 2) + [1 => '']);
            $value = trim($value, "\"'");
            self::$values[$key] = $value;
            putenv($key . '=' . $value);
            $_ENV[$key] = $value;
        }
    }

    public static function get(string $key, ?string $default = null): ?string
    {
        if (array_key_exists($key, self::$values)) {
            return self::$values[$key];
        }

        $value = getenv($key);
        if ($value === false) {
            return $default;
        }

        return $value;
    }
}
