<?php

namespace Kai\Repositories;

use DateInterval;
use DateTimeImmutable;

class HabitLogsRepository extends BaseRepository
{
    public function log(int $habitId, int $status, ?string $date = null): array
    {
        $status = $status > 0 ? 1 : 0;
        $date = $date ?: (new DateTimeImmutable())->format('Y-m-d');
        $sql = 'INSERT INTO habit_logs (habit_id, `date`, status)
            VALUES (:habit_id, :date, :status)
            ON DUPLICATE KEY UPDATE status = VALUES(status)';
        $this->pdo->prepare($sql)->execute([
            'habit_id' => $habitId,
            'date' => $date,
            'status' => $status,
        ]);

        return $this->findByDate($habitId, $date);
    }

    public function findByDate(int $habitId, string $date): array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM habit_logs WHERE habit_id = :habit AND `date` = :log_date');
        $stmt->execute(['habit' => $habitId, 'log_date' => $date]);
        $row = $stmt->fetch() ?: [];
        return $this->normalizeLogRow($row);
    }

    public function recent(int $days = 30): array
    {
        $threshold = (new DateTimeImmutable('today'))->sub(new DateInterval('P' . $days . 'D'))->format('Y-m-d');
        $stmt = $this->pdo->prepare('SELECT hl.id, hl.habit_id, hl.`date`, hl.status, h.name FROM habit_logs hl JOIN habits h ON hl.habit_id = h.id
            WHERE hl.`date` >= :threshold ORDER BY hl.`date` DESC');
        $stmt->execute(['threshold' => $threshold]);
        return array_map(fn ($row) => $this->normalizeLogRow($row), $stmt->fetchAll());
    }

    public function streaks(): array
    {
        $sql = <<<'SQL'
SELECT h.id, h.name,
       GROUP_CONCAT(CONCAT(hl.`date`, ':', hl.status) ORDER BY hl.`date` DESC SEPARATOR ',') as logs
FROM habits h
LEFT JOIN habit_logs hl ON hl.habit_id = h.id
GROUP BY h.id, h.name
SQL;
        return $this->pdo->query($sql)->fetchAll();
    }

    private function normalizeLogRow(array $row): array
    {
        if (!$row) {
            return $row;
        }

        if (isset($row['date']) && !isset($row['log_date'])) {
            $row['log_date'] = $row['date'];
        }

        return $row;
    }
}
