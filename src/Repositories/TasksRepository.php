<?php

namespace Kai\Repositories;

use DateInterval;
use DateTimeImmutable;
use Kai\Exceptions\HttpException;

class TasksRepository extends BaseRepository
{
    public function forPhase(int $phaseId): array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM tasks WHERE phase_id = :phase ORDER BY created_at DESC');
        $stmt->execute(['phase' => $phaseId]);
        return $stmt->fetchAll();
    }

    public function forGoal(int $goalId): array
    {
        $stmt = $this->pdo->prepare('SELECT t.* FROM tasks t JOIN phases ph ON t.phase_id = ph.id WHERE ph.goal_id = :goal ORDER BY t.created_at DESC');
        $stmt->execute(['goal' => $goalId]);
        return $stmt->fetchAll();
    }

    public function create(int $phaseId, array $data): array
    {
        $sql = 'INSERT INTO tasks (phase_id, title, description, status, due_date, priority, created_at, updated_at)
            VALUES (:phase_id, :title, :description, :status, :due_date, :priority, :created_at, :updated_at)';
        $now = (new DateTimeImmutable())->format('Y-m-d H:i:s');
        $this->pdo->prepare($sql)->execute([
            'phase_id' => $phaseId,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'status' => $data['status'] ?? 'pending',
            'due_date' => $data['due_date'] ?? null,
            'priority' => $data['priority'] ?? 'normal',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        return $this->find((int) $this->pdo->lastInsertId());
    }

    public function update(int $taskId, array $data): array
    {
        $task = $this->find($taskId);
        $fields = [];
        $params = ['id' => $taskId];

        foreach (['title', 'description', 'status', 'due_date', 'priority'] as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = $field . ' = :' . $field;
                $params[$field] = $data[$field];
            }
        }

        if (array_key_exists('status', $data)) {
            if ($data['status'] === 'done') {
                $fields[] = 'completed_at = :completed_at';
                $params['completed_at'] = (new DateTimeImmutable())->format('Y-m-d H:i:s');
            } else {
                $fields[] = 'completed_at = NULL';
            }
        }

        if ($fields) {
            $fields[] = 'updated_at = :updated_at';
            $params['updated_at'] = (new DateTimeImmutable())->format('Y-m-d H:i:s');
            $sql = 'UPDATE tasks SET ' . implode(', ', $fields) . ' WHERE id = :id';
            $this->pdo->prepare($sql)->execute($params);
        }

        return $this->find($taskId);
    }

    public function find(int $id): array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM tasks WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $task = $stmt->fetch();
        if (!$task) {
            throw new HttpException(404, 'Task not found');
        }
        return $task;
    }

    public function completedCountsByDate(int $days): array
    {
        $threshold = (new DateTimeImmutable('today'))->sub(new DateInterval('P' . $days . 'D'))->format('Y-m-d 00:00:00');
        $stmt = $this->pdo->prepare('SELECT DATE(completed_at) as completion_date, COUNT(*) as total
            FROM tasks WHERE completed_at IS NOT NULL AND completed_at >= :threshold
            GROUP BY DATE(completed_at) ORDER BY completion_date ASC');
        $stmt->execute(['threshold' => $threshold]);
        return $stmt->fetchAll();
    }

    public function delete(int $id): void
    {
        $this->find($id);
        $stmt = $this->pdo->prepare('DELETE FROM tasks WHERE id = :id');
        $stmt->execute(['id' => $id]);
    }
}
