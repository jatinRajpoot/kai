<?php

namespace Kai\Services;

use Kai\Core\Database;
use Kai\Exceptions\HttpException;
use PDO;
use Throwable;

class BackupService
{
    private PDO $pdo;

    /**
     * Ordered to keep parent tables ahead of dependents when importing.
     */
    private array $tableOrder = [
        'users',
        'goals',
        'phases',
        'tasks',
        'ideas',
        'knowledge',
        'important_notes',
        'habits',
        'habit_logs',
        'daily_logs',
    ];

    private array $columnCache = [];

    public function __construct(Database $database)
    {
        $this->pdo = $database->pdo();
    }

    public function export(): array
    {
        $tables = [];
        foreach ($this->tableOrder as $table) {
            $stmt = $this->pdo->query(sprintf('SELECT * FROM `%s`', $table));
            $tables[$table] = $stmt->fetchAll() ?: [];
        }

        return [
            'version' => 1,
            'generated_at' => gmdate('c'),
            'tables' => $tables,
        ];
    }

    public function import(array $backup): array
    {
        if (!isset($backup['tables']) || !is_array($backup['tables'])) {
            throw new HttpException(422, 'Backup payload missing tables');
        }

        $tables = $backup['tables'];
        $touched = [];

        $this->pdo->beginTransaction();
        $this->pdo->exec('SET FOREIGN_KEY_CHECKS=0');
        try {
            foreach ($this->tableOrder as $table) {
                if (!array_key_exists($table, $tables)) {
                    continue;
                }

                $rows = $tables[$table];
                if (!is_array($rows)) {
                    continue;
                }

                $this->clearTable($table);
                $this->insertRows($table, $rows);
                $touched[] = $table;
            }

            $this->pdo->commit();
        } catch (Throwable $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw new HttpException(500, 'Import failed: ' . $e->getMessage());
        } finally {
            $this->pdo->exec('SET FOREIGN_KEY_CHECKS=1');
        }

        return [
            'tables' => $touched,
            'counts' => $this->countsFor($touched),
        ];
    }

    private function clearTable(string $table): void
    {
        $this->pdo->exec(sprintf('DELETE FROM `%s`', $table));
        $this->pdo->exec(sprintf('ALTER TABLE `%s` AUTO_INCREMENT = 1', $table));
    }

    private function insertRows(string $table, array $rows): void
    {
        if (empty($rows)) {
            return;
        }

        foreach ($rows as $row) {
            if (!is_array($row)) {
                continue;
            }

            $payload = $this->filterColumns($table, $row);
            if (!$payload) {
                continue;
            }

            $columns = array_keys($payload);
            $placeholders = array_map(static fn($column) => ':' . $column, $columns);
            $columnList = array_map(static fn($column) => sprintf('`%s`', $column), $columns);
            $sql = sprintf(
                'INSERT INTO `%s` (%s) VALUES (%s)',
                $table,
                implode(', ', $columnList),
                implode(', ', $placeholders)
            );

            $stmt = $this->pdo->prepare($sql);
            foreach ($payload as $column => $value) {
                $stmt->bindValue(':' . $column, $value);
            }
            $stmt->execute();
        }
    }

    private function filterColumns(string $table, array $row): array
    {
        $columns = $this->columnsFor($table);
        $filtered = [];
        foreach ($columns as $column) {
            if (array_key_exists($column, $row)) {
                $filtered[$column] = $row[$column];
            }
        }
        return $filtered;
    }

    private function columnsFor(string $table): array
    {
        if (!isset($this->columnCache[$table])) {
            $stmt = $this->pdo->query(sprintf('DESCRIBE `%s`', $table));
            $this->columnCache[$table] = array_map(static fn($column) => $column['Field'], $stmt->fetchAll());
        }

        return $this->columnCache[$table];
    }

    private function countsFor(array $tables): array
    {
        $counts = [];
        foreach ($tables as $table) {
            $stmt = $this->pdo->query(sprintf('SELECT COUNT(*) AS total FROM `%s`', $table));
            $counts[$table] = (int) $stmt->fetchColumn();
        }
        return $counts;
    }
}
