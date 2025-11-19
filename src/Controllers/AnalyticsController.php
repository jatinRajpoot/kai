<?php

namespace Kai\Controllers;

use Kai\Core\Request;
use Kai\Services\AnalyticsService;

class AnalyticsController
{
    private AnalyticsService $service;

    public function __construct(AnalyticsService $service)
    {
        $this->service = $service;
    }

    public function summary(Request $request): array
    {
        return $this->service->summary();
    }
}
