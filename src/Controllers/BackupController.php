<?php

namespace Kai\Controllers;

use Kai\Core\Request;
use Kai\Exceptions\HttpException;
use Kai\Services\BackupService;

class BackupController
{
    private BackupService $backup;

    public function __construct(BackupService $backup)
    {
        $this->backup = $backup;
    }

    public function export(Request $request): array
    {
        $bundle = $this->backup->export();
        return [
            'filename' => sprintf('kai-backup-%s.json', gmdate('Ymd-His')),
            'backup' => $bundle,
        ];
    }

    public function import(Request $request): array
    {
        $payload = $request->getJson();
        if (!isset($payload['backup']) || !is_array($payload['backup'])) {
            throw new HttpException(422, 'Backup payload is required');
        }

        $result = $this->backup->import($payload['backup']);
        return [
            'restored' => $result,
        ];
    }
}
