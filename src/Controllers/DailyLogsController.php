<?php

namespace Kai\Controllers;

use Kai\Core\Request;
use Kai\Repositories\DailyLogsRepository;

class DailyLogsController
{
    private DailyLogsRepository $dailyLogs;

    public function __construct(DailyLogsRepository $dailyLogs)
    {
        $this->dailyLogs = $dailyLogs;
    }

    public function store(Request $request): array
    {
        return $this->dailyLogs->create($request->getJson());
    }

    public function index(Request $request): array
    {
        $limit = (int) ($request->getQuery('limit', 30));
        return $this->dailyLogs->all($limit);
    }
}
