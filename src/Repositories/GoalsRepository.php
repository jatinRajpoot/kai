<?php

namespace Kai\Repositories;

use DateTimeImmutable;
use Kai\Exceptions\HttpException;

class GoalsRepository extends BaseRepository
{
    public function all(): array
    {
        $sql = 'SELECT g.*, 
            (SELECT COUNT(*) FROM phases ph WHERE ph.goal_id = g.id) AS phase_count,
            (SELECT COUNT(*) FROM tasks t JOIN phases ph2 ON t.phase_id = ph2.id WHERE ph2.goal_id = g.id) AS task_count,
            (SELECT COUNT(*) FROM tasks t2 JOIN phases ph3 ON t2.phase_id = ph3.id WHERE ph3.goal_id = g.id AND t2.status = \'done\') AS done_count
            FROM goals g ORDER BY g.created_at DESC';
        return $this->pdo->query($sql)->fetchAll();
    }

    public function find(int $id): array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM goals WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $goal = $stmt->fetch();
        if (!$goal) {
            throw new HttpException(404, 'Goal not found');
        }
        return $goal;
    }

    public function create(array $data): array
    {
        $stmt = $this->pdo->prepare('INSERT INTO goals (name, description, status, created_at, updated_at) VALUES (:name, :description, :status, :created_at, :updated_at)');
        $now = (new DateTimeImmutable())->format('Y-m-d H:i:s');
        $stmt->execute([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'status' => $data['status'] ?? 'planned',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        return $this->find((int) $this->pdo->lastInsertId());
    }

    public function update(int $id, array $data): array
    {
        $fields = [];
        $params = ['id' => $id];
        foreach (['name', 'description', 'status'] as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = $field . ' = :' . $field;
                $params[$field] = $data[$field];
            }
        }

        if (!$fields) {
            return $this->find($id);
        }

        $fields[] = 'updated_at = :updated_at';
        $params['updated_at'] = (new DateTimeImmutable())->format('Y-m-d H:i:s');

        $sql = 'UPDATE goals SET ' . implode(', ', $fields) . ' WHERE id = :id';
        $this->pdo->prepare($sql)->execute($params);

        return $this->find($id);
    }

    public function delete(int $id): void
    {
        $this->find($id);
        $stmt = $this->pdo->prepare('DELETE FROM goals WHERE id = :id');
        $stmt->execute(['id' => $id]);
    }
}
