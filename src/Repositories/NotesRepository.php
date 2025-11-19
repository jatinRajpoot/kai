<?php

namespace Kai\Repositories;

use DateTimeImmutable;
use Kai\Core\Database;
use Kai\Exceptions\HttpException;

class NotesRepository extends BaseRepository
{
    private string $table;

    public function __construct(Database $database, string $table)
    {
        parent::__construct($database);
        $this->table = $table;
    }

    public function all(): array
    {
        $stmt = $this->pdo->query('SELECT * FROM ' . $this->table . ' ORDER BY created_at DESC');
        return $stmt->fetchAll();
    }

    public function create(array $data): array
    {
        $sql = sprintf('INSERT INTO %s (title, content, link, priority, created_at) VALUES (:title, :content, :link, :priority, :created_at)', $this->table);
        $now = (new DateTimeImmutable())->format('Y-m-d H:i:s');
        $this->pdo->prepare($sql)->execute([
            'title' => $data['title'],
            'content' => $data['content'] ?? null,
            'link' => $data['link'] ?? null,
            'priority' => $data['priority'] ?? 'normal',
            'created_at' => $now,
        ]);

        return $this->find((int) $this->pdo->lastInsertId());
    }

    public function find(int $id): array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM ' . $this->table . ' WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $note = $stmt->fetch();
        if (!$note) {
            throw new HttpException(404, 'Record not found');
        }
        return $note;
    }
}
