<?php

namespace Kai\Controllers;

use Kai\Core\Request;
use Kai\Repositories\PhasesRepository;

class PhasesController
{
    private PhasesRepository $phases;

    public function __construct(PhasesRepository $phases)
    {
        $this->phases = $phases;
    }

    public function update(Request $request): array
    {
        $id = (int) $request->getPathParam('id');
        return $this->phases->update($id, $request->getJson());
    }

    public function destroy(Request $request): array
    {
        $id = (int) $request->getPathParam('id');
        $this->phases->delete($id);
        return ['deleted' => true];
    }
}
