<?php

namespace Kai\Controllers;

use Kai\Core\Request;
use Kai\Exceptions\HttpException;
use Kai\Repositories\NotesRepository;

class ImportantNotesController
{
    private NotesRepository $repository;

    public function __construct(NotesRepository $repository)
    {
        $this->repository = $repository;
    }

    public function index(Request $request): array
    {
        return $this->repository->all();
    }

    public function store(Request $request): array
    {
        $payload = $request->getJson();
        if (empty($payload['title'])) {
            throw new HttpException(422, 'Title is required');
        }

        return $this->repository->create($payload);
    }
}
