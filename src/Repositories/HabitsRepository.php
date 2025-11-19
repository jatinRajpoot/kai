<?php

namespace Kai\Repositories;

use DateTimeImmutable;
use Kai\Exceptions\HttpException;

class HabitsRepository extends BaseRepository
{
    public function findOrCreate(string $name): array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM habits WHERE name = :name');
        $stmt->execute(['name' => $name]);
        $habit = $stmt->fetch();
        if ($habit) {
            return $habit;
        }

        $now = (new DateTimeImmutable())->format('Y-m-d H:i:s');
        $this->pdo->prepare('INSERT INTO habits (name, created_at, is_active) VALUES (:name, :created_at, :is_active)')
            ->execute([
                'name' => $name,
                'created_at' => $now,
                'is_active' => 1,
            ]);

        return $this->find((int) $this->pdo->lastInsertId());
    }

    public function findByName(string $name): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM habits WHERE name = :name');
        $stmt->execute(['name' => $name]);

        return $stmt->fetch() ?: null;
    }

    public function create(string $name): array
    {
        $name = trim($name);
        if ($name === '') {
            throw new HttpException(422, 'Habit name is required');
        }

        if ($this->findByName($name)) {
            throw new HttpException(422, 'Habit already exists');
        }

        $now = (new DateTimeImmutable())->format('Y-m-d H:i:s');
        $this->pdo->prepare('INSERT INTO habits (name, created_at, is_active) VALUES (:name, :created_at, :is_active)')
            ->execute([
                'name' => $name,
                'created_at' => $now,
                'is_active' => 1,
            ]);

        return $this->find((int) $this->pdo->lastInsertId());
    }

    public function find(int $id): array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM habits WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $habit = $stmt->fetch();
        if (!$habit) {
            throw new HttpException(404, 'Habit not found');
        }

        return $habit;
    }

    public function all(): array
    {
        return $this->pdo->query('SELECT * FROM habits ORDER BY name ASC')->fetchAll();
    }
}
