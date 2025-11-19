<?php

declare(strict_types=1);

use Kai\Core\App;
use Kai\Core\Request;
use Kai\Core\Response;

require dirname(__DIR__) . '/vendor/autoload.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PATCH, OPTIONS');

$request = Request::fromGlobals();

if ($request->getMethod() === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$response = new Response();

$app = App::make();
$app->handle($request, $response);
