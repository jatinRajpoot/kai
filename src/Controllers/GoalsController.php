<?php

namespace Kai\Controllers;

use Kai\Core\Request;
use Kai\Exceptions\HttpException;
use Kai\Repositories\PhasesRepository;
use Kai\Repositories\GoalsRepository;
use Kai\Repositories\TasksRepository;

class GoalsController
{
    private GoalsRepository $goals;
    private PhasesRepository $phases;
    private TasksRepository $tasks;

    public function __construct(
        GoalsRepository $goals,
        PhasesRepository $phases,
        TasksRepository $tasks
    ) {
        $this->goals = $goals;
        $this->phases = $phases;
        $this->tasks = $tasks;
    }

    public function index(Request $request): array
    {
        return $this->goals->all();
    }

    public function store(Request $request): array
    {
        $payload = $request->getJson();
        if (empty($payload['name'])) {
            throw new HttpException(422, 'Goal name is required');
        }

        return $this->goals->create($payload);
    }

    public function show(Request $request): array
    {
        $id = (int) $request->getPathParam('id');
        $goal = $this->goals->find($id);
        $goal['phases'] = $this->phases->forGoal($id);
        $goal['tasks'] = $this->tasks->forGoal($id);

        return $goal;
    }

    public function update(Request $request): array
    {
        $id = (int) $request->getPathParam('id');
        $payload = $request->getJson();
        return $this->goals->update($id, $payload);
    }

    public function phases(Request $request): array
    {
        $goalId = (int) $request->getPathParam('id');
        return $this->phases->forGoal($goalId);
    }

    public function storePhase(Request $request): array
    {
        $goalId = (int) $request->getPathParam('id');
        $payload = $request->getJson();
        if (empty($payload['name'])) {
            throw new HttpException(422, 'Phase name is required');
        }

        return $this->phases->create($goalId, $payload);
    }

    public function destroy(Request $request): array
    {
        $id = (int) $request->getPathParam('id');
        $this->goals->delete($id);
        return ['deleted' => true];
    }
}
