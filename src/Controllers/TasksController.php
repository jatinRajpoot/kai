<?php

namespace Kai\Controllers;

use Kai\Core\Request;
use Kai\Exceptions\HttpException;
use Kai\Repositories\TasksRepository;

class TasksController
{
    private TasksRepository $tasks;

    public function __construct(TasksRepository $tasks)
    {
        $this->tasks = $tasks;
    }

    public function forPhase(Request $request): array
    {
        $phaseId = (int) $request->getPathParam('id');
        return $this->tasks->forPhase($phaseId);
    }

    public function store(Request $request): array
    {
        $phaseId = (int) $request->getPathParam('id');
        $payload = $request->getJson();
        if (empty($payload['title'])) {
            throw new HttpException(422, 'Task title is required');
        }

        return $this->tasks->create($phaseId, $payload);
    }

    public function update(Request $request): array
    {
        $taskId = (int) $request->getPathParam('id');
        return $this->tasks->update($taskId, $request->getJson());
    }

    public function destroy(Request $request): array
    {
        $taskId = (int) $request->getPathParam('id');
        $this->tasks->delete($taskId);
        return ['deleted' => true];
    }
}
