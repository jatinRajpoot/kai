<?php

namespace Kai\Repositories;

use DateTimeImmutable;
use Kai\Exceptions\HttpException;

class PhasesRepository extends BaseRepository
{
    public function forGoal(int $goalId): array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM phases WHERE goal_id = :goal ORDER BY created_at DESC');
        $stmt->execute(['goal' => $goalId]);
        return $stmt->fetchAll();
    }

    public function create(int $goalId, array $data): array
    {
        $stmt = $this->pdo->prepare('INSERT INTO phases (goal_id, name, status, start_date, end_date, created_at, updated_at)
            VALUES (:goal_id, :name, :status, :start_date, :end_date, :created_at, :updated_at)');
        $now = (new DateTimeImmutable())->format('Y-m-d H:i:s');
        $stmt->execute([
            'goal_id' => $goalId,
            'name' => $data['name'],
            'status' => $data['status'] ?? 'planned',
            'start_date' => $data['start_date'] ?? null,
            'end_date' => $data['end_date'] ?? null,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        return $this->find((int) $this->pdo->lastInsertId());
    }

    public function update(int $id, array $data): array
    {
        $this->find($id);
        $fields = [];
        $params = ['id' => $id];

        foreach (['name', 'status', 'start_date', 'end_date'] as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = $field . ' = :' . $field;
                $params[$field] = $data[$field];
            }
        }

        if ($fields) {
            $fields[] = 'updated_at = :updated_at';
            $params['updated_at'] = (new DateTimeImmutable())->format('Y-m-d H:i:s');
            $sql = 'UPDATE phases SET ' . implode(', ', $fields) . ' WHERE id = :id';
            $this->pdo->prepare($sql)->execute($params);
        }

        return $this->find($id);
    }

    public function find(int $id): array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM phases WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $phase = $stmt->fetch();
        if (!$phase) {
            throw new HttpException(404, 'Phase not found');
        }
        return $phase;
    }

    public function delete(int $id): void
    {
        $this->find($id);
        $stmt = $this->pdo->prepare('DELETE FROM phases WHERE id = :id');
        $stmt->execute(['id' => $id]);
    }
}
