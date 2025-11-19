<?php

namespace Kai\Core;

use Kai\Controllers\AnalyticsController;
use Kai\Controllers\BackupController;
use Kai\Controllers\AuthController;
use Kai\Controllers\DailyLogsController;
use Kai\Controllers\HabitsController;
use Kai\Controllers\IdeasController;
use Kai\Controllers\KnowledgeController;
use Kai\Controllers\ImportantNotesController;
use Kai\Controllers\PhasesController;
use Kai\Controllers\GoalsController;
use Kai\Controllers\TasksController;
use Kai\Repositories\DailyLogsRepository;
use Kai\Repositories\HabitsRepository;
use Kai\Repositories\HabitLogsRepository;
use Kai\Repositories\NotesRepository;
use Kai\Repositories\PhasesRepository;
use Kai\Repositories\GoalsRepository;
use Kai\Repositories\TasksRepository;
use Kai\Services\AnalyticsService;
use Kai\Services\BackupService;

class App
{
    private Router $router;

    public function __construct(Router $router)
    {
        $this->router = $router;
    }

    public static function make(): self
    {
        Env::load(dirname(__DIR__, 2) . '/.env');

        $database = new Database();
        $auth = new Auth();
        $router = new Router($auth);

        $goalsRepo = new GoalsRepository($database);
        $phasesRepo = new PhasesRepository($database);
        $tasksRepo = new TasksRepository($database);
        $ideasRepo = new NotesRepository($database, 'ideas');
        $knowledgeRepo = new NotesRepository($database, 'knowledge');
        $importantRepo = new NotesRepository($database, 'important_notes');
        $habitsRepo = new HabitsRepository($database);
        $habitLogsRepo = new HabitLogsRepository($database);
        $dailyLogsRepo = new DailyLogsRepository($database);
        $analyticsService = new AnalyticsService($goalsRepo, $tasksRepo, $habitLogsRepo, $dailyLogsRepo);
        $backupService = new BackupService($database);

        $app = new self($router);
        $app->registerRoutes(
            new AuthController($auth),
            new GoalsController($goalsRepo, $phasesRepo, $tasksRepo),
            new PhasesController($phasesRepo),
            new TasksController($tasksRepo),
            new IdeasController($ideasRepo),
            new KnowledgeController($knowledgeRepo),
            new ImportantNotesController($importantRepo),
            new HabitsController($habitsRepo, $habitLogsRepo),
            new DailyLogsController($dailyLogsRepo),
            new AnalyticsController($analyticsService),
            new BackupController($backupService)
        );

        return $app;
    }

    private function registerRoutes(
        AuthController $authController,
        GoalsController $goalsController,
        PhasesController $phasesController,
        TasksController $tasksController,
        IdeasController $ideasController,
        KnowledgeController $knowledgeController,
        ImportantNotesController $importantNotesController,
        HabitsController $habitsController,
        DailyLogsController $dailyLogsController,
        AnalyticsController $analyticsController,
        BackupController $backupController
    ): void {
        $router = $this->router;

        $router->add('POST', '/auth/login', [$authController, 'login'], false);

        $router->add('GET', '/goals', [$goalsController, 'index']);
        $router->add('POST', '/goals', [$goalsController, 'store']);
        $router->add('GET', '/goals/{id}', [$goalsController, 'show']);
        $router->add('PATCH', '/goals/{id}', [$goalsController, 'update']);
        $router->add('DELETE', '/goals/{id}', [$goalsController, 'destroy']);

        $router->add('GET', '/goals/{id}/phases', [$goalsController, 'phases']);
        $router->add('POST', '/goals/{id}/phases', [$goalsController, 'storePhase']);

        $router->add('PATCH', '/phases/{id}', [$phasesController, 'update']);
        $router->add('DELETE', '/phases/{id}', [$phasesController, 'destroy']);

        $router->add('GET', '/phases/{id}/tasks', [$tasksController, 'forPhase']);
        $router->add('POST', '/phases/{id}/tasks', [$tasksController, 'store']);
        $router->add('PATCH', '/tasks/{id}', [$tasksController, 'update']);
        $router->add('DELETE', '/tasks/{id}', [$tasksController, 'destroy']);

        $router->add('GET', '/ideas', [$ideasController, 'index']);
        $router->add('POST', '/ideas', [$ideasController, 'store']);

        $router->add('GET', '/knowledge', [$knowledgeController, 'index']);
        $router->add('POST', '/knowledge', [$knowledgeController, 'store']);

        $router->add('GET', '/important', [$importantNotesController, 'index']);
        $router->add('POST', '/important', [$importantNotesController, 'store']);

        $router->add('GET', '/habits', [$habitsController, 'index']);
        $router->add('POST', '/habits', [$habitsController, 'store']);
        $router->add('POST', '/habits/log', [$habitsController, 'log']);
        $router->add('GET', '/habits/logs', [$habitsController, 'logs']);

        $router->add('POST', '/daily/log', [$dailyLogsController, 'store']);
        $router->add('GET', '/daily/logs', [$dailyLogsController, 'index']);

        $router->add('GET', '/analytics', [$analyticsController, 'summary']);

        $router->add('GET', '/backup/export', [$backupController, 'export']);
        $router->add('POST', '/backup/import', [$backupController, 'import']);
    }

    public function handle(Request $request, Response $response): void
    {
        $this->router->dispatch($request, $response);
    }
}
