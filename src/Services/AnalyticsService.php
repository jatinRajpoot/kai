<?php

namespace Kai\Services;

use DateInterval;
use DateTimeImmutable;
use Kai\Repositories\DailyLogsRepository;
use Kai\Repositories\HabitLogsRepository;
use Kai\Repositories\GoalsRepository;
use Kai\Repositories\TasksRepository;

class AnalyticsService
{
    private GoalsRepository $goals;
    private TasksRepository $tasks;
    private HabitLogsRepository $habitLogs;
    private DailyLogsRepository $dailyLogs;

    public function __construct(
        GoalsRepository $goals,
        TasksRepository $tasks,
        HabitLogsRepository $habitLogs,
        DailyLogsRepository $dailyLogs
    ) {
        $this->goals = $goals;
        $this->tasks = $tasks;
        $this->habitLogs = $habitLogs;
        $this->dailyLogs = $dailyLogs;
    }

    public function summary(): array
    {
        $goals = $this->goals->all();
        $taskTrend = $this->tasks->completedCountsByDate(30);
        $today = (new DateTimeImmutable())->format('Y-m-d');

        $totalTasks = 0;
        $doneTasks = 0;
        foreach ($goals as $goal) {
            $totalTasks += (int) $goal['task_count'];
            $doneTasks += (int) $goal['done_count'];
        }

        return [
            'goals' => count($goals),
            'tasks_total' => $totalTasks,
            'tasks_done' => $doneTasks,
            'tasks_completion_rate' => $totalTasks > 0 ? round(($doneTasks / max($totalTasks, 1)) * 100, 1) : 0,
            'tasks_completed_today' => $this->completedCountForDate($taskTrend, $today),
            'task_streak_days' => $this->taskStreakLength($taskTrend),
            'task_trend' => $this->fillTrend($taskTrend, 14),
            'habit_streaks' => $this->habitStreaks(),
            'daily_logs' => $this->dailyLogs->all(7),
        ];
    }

    private function completedCountForDate(array $trend, string $date): int
    {
        foreach ($trend as $row) {
            if ($row['completion_date'] === $date) {
                return (int) $row['total'];
            }
        }
        return 0;
    }

    private function taskStreakLength(array $trend): int
    {
        $today = new DateTimeImmutable('today');
        $streak = 0;

        for ($i = 0; $i < 30; $i++) {
            $date = $today->sub(new DateInterval('P' . $i . 'D'))->format('Y-m-d');
            $count = $this->completedCountForDate($trend, $date);
            if ($count > 0) {
                $streak++;
            } else {
                break;
            }
        }

        return $streak;
    }

    private function fillTrend(array $trend, int $days): array
    {
        $map = [];
        foreach ($trend as $row) {
            $map[$row['completion_date']] = (int) $row['total'];
        }

        $series = [];
        $today = new DateTimeImmutable('today');
        for ($i = $days - 1; $i >= 0; $i--) {
            $date = $today->sub(new DateInterval('P' . $i . 'D'))->format('Y-m-d');
            $series[] = [
                'date' => $date,
                'count' => $map[$date] ?? 0,
            ];
        }

        return $series;
    }

    private function habitStreaks(): array
    {
        $raw = $this->habitLogs->streaks();
        $result = [];
        foreach ($raw as $row) {
            if (!$row['logs']) {
                $result[] = [
                    'habit' => $row['name'],
                    'current_streak' => 0,
                ];
                continue;
            }

            $logs = explode(',', $row['logs']);
            $streak = 0;
            $today = new DateTimeImmutable('today');

            for ($i = 0; $i < 30; $i++) {
                $date = $today->sub(new DateInterval('P' . $i . 'D'))->format('Y-m-d');
                $status = $this->statusForDate($logs, $date);
                if ($status === 1) {
                    $streak++;
                } else {
                    break;
                }
            }

            $result[] = [
                'habit' => $row['name'],
                'current_streak' => $streak,
            ];
        }

        return $result;
    }

    private function statusForDate(array $logs, string $date): ?int
    {
        foreach ($logs as $entry) {
            [$logDate, $status] = explode(':', $entry);
            if ($logDate === $date) {
                return (int) $status;
            }
        }
        return null;
    }
}
