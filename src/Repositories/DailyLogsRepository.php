<?php

namespace Kai\Repositories;

use DateTimeImmutable;
use PDO;

class DailyLogsRepository extends BaseRepository
{
    public function create(array $data): array
    {
        $sql = 'INSERT INTO daily_logs (log_date, summary, mood, energy, created_at, updated_at)
            VALUES (:log_date, :summary, :mood, :energy, :created_at, :updated_at)
            ON DUPLICATE KEY UPDATE summary = VALUES(summary), mood = VALUES(mood), energy = VALUES(energy), updated_at = VALUES(updated_at)';
        $now = (new DateTimeImmutable())->format('Y-m-d H:i:s');
        $date = $data['log_date'] ?? (new DateTimeImmutable())->format('Y-m-d');
        $this->pdo->prepare($sql)->execute([
            'log_date' => $date,
            'summary' => $data['summary'] ?? null,
            'mood' => $data['mood'] ?? null,
            'energy' => $data['energy'] ?? null,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        return $this->findByDate($date);
    }

    public function all(int $limit = 30): array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM daily_logs ORDER BY log_date DESC LIMIT :limit');
        $stmt->bindValue('limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function findByDate(string $date): array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM daily_logs WHERE log_date = :date');
        $stmt->execute(['date' => $date]);
        return $stmt->fetch() ?: [];
    }
}
