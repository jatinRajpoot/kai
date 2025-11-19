<?php

namespace Kai\Controllers;

use Kai\Core\Request;
use Kai\Exceptions\HttpException;
use Kai\Repositories\HabitLogsRepository;
use Kai\Repositories\HabitsRepository;

class HabitsController
{
    private HabitsRepository $habits;
    private HabitLogsRepository $logs;

    public function __construct(HabitsRepository $habits, HabitLogsRepository $logs)
    {
        $this->habits = $habits;
        $this->logs = $logs;
    }

    public function index(Request $request): array
    {
        return $this->habits->all();
    }

    public function store(Request $request): array
    {
        $payload = $request->getJson();
        $name = $payload['name'] ?? null;
        if (!is_string($name) || trim($name) === '') {
            throw new HttpException(422, 'Habit name is required');
        }

        $habit = $this->habits->create(trim($name));

        return ['habit' => $habit];
    }

    public function log(Request $request): array
    {
        $payload = $request->getJson();
        $name = $payload['habit'] ?? $payload['name'] ?? null;
        if (!$name) {
            throw new HttpException(422, 'Habit name is required');
        }
        $status = $this->parseStatus($payload['status'] ?? null);
        $date = $payload['date'] ?? $payload['log_date'] ?? null;

        $habit = $this->habits->findByName($name);
        if (!$habit) {
            throw new HttpException(404, 'Habit must be created before logging');
        }
        $entry = $this->logs->log((int) $habit['id'], $status, $date);

        return [
            'habit' => $habit,
            'log' => $entry,
        ];
    }

    public function logs(Request $request): array
    {
        $days = (int) ($request->getQuery('days', 30));
        return $this->logs->recent($days);
    }

    private function parseStatus(mixed $value): int
    {
        if (is_bool($value)) {
            return $value ? 1 : 0;
        }

        if (is_numeric($value)) {
            return (int) (((int) $value) > 0);
        }

        if (!is_string($value)) {
            return 0;
        }

        $normalized = strtolower(trim($value));
        $positive = ['done', 'complete', 'completed', 'true', 'yes', 'y', '1'];

        return in_array($normalized, $positive, true) ? 1 : 0;
    }
}
