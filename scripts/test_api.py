#!/usr/bin/env python3
"""Comprehensive API smoke test runner for the KAI backend."""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
from dataclasses import dataclass
from datetime import date, datetime
from typing import Any, Callable, Dict, List, Optional, Tuple

import requests


@dataclass
class TestResult:
    name: str
    success: bool
    message: str
    duration: float


class KaiApiTester:
    def __init__(
        self,
        base_url: str,
        email: str,
        password: str,
        timeout: float = 10.0,
        include_backup_import: bool = False,
    ) -> None:
        self.base_url = base_url.rstrip('/')
        self.email = email
        self.password = password
        self.timeout = timeout
        self.include_backup_import = include_backup_import
        self.session = requests.Session()
        self.token: Optional[str] = None
        self.state: Dict[str, Any] = {}
        self.results: List[TestResult] = []
        self.run_id = datetime.utcnow().strftime('%Y%m%d%H%M%S')

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------
    def execute(self) -> int:
        tests: List[Tuple[str, Callable[[], None]]] = [
            ('Authenticate user', self.test_login),
            ('Goals CRUD', self.test_goals_flow),
            ('Phases CRUD', self.test_phases_flow),
            ('Tasks CRUD', self.test_tasks_flow),
            ('Ideas/Knowledge/Important notes', self.test_notes_modules),
            ('Habits and logs', self.test_habits_flow),
            ('Daily logs', self.test_daily_logs),
            ('Analytics summary', self.test_analytics),
            ('Habit log listing', self.test_habit_logs_listing),
            ('Backup export', self.test_backup_export),
        ]

        if self.include_backup_import:
            tests.append(('Backup import', self.test_backup_import))

        exit_code = 0
        try:
            for name, fn in tests:
                self._run_test(name, fn)
        finally:
            self.cleanup()

        for result in self.results:
            status = 'PASS' if result.success else 'FAIL'
            print(f"[{status:4}] {result.name} ({result.duration:.2f}s) - {result.message}")

        if not all(result.success for result in self.results):
            exit_code = 1

        return exit_code

    # ------------------------------------------------------------------
    # Test implementations
    # ------------------------------------------------------------------
    def test_login(self) -> None:
        payload = {'email': self.email, 'password': self.password}
        data = self.api('POST', '/auth/login', auth=False, json=payload)
        token = data.get('token')
        if not token:
            raise RuntimeError('Login response missing token')
        self.token = token

    def test_goals_flow(self) -> None:
        goal_name = f"API Smoke Goal {self.run_id}"
        created = self.api('POST', '/goals', json={'name': goal_name, 'description': 'Created via test harness'})
        goal_id = created.get('id')
        if not goal_id:
            raise RuntimeError('Goal creation did not return an id')
        self.state['goal_id'] = goal_id

        collection = self.api('GET', '/goals')
        if not any(goal.get('id') == goal_id for goal in collection):
            raise RuntimeError('New goal not found in goal listing')

        detail = self.api('GET', f'/goals/{goal_id}')
        if detail.get('id') != goal_id:
            raise RuntimeError('Goal detail response mismatch')

    def test_phases_flow(self) -> None:
        goal_id = self._require_state('goal_id')
        payload = {'name': f'Phase for {goal_id}', 'status': 'planned'}
        created = self.api('POST', f'/goals/{goal_id}/phases', json=payload)
        phase_id = created.get('id')
        if not phase_id:
            raise RuntimeError('Phase creation failed')
        self.state['phase_id'] = phase_id

        updated = self.api('PATCH', f'/phases/{phase_id}', json={'status': 'in_progress'})
        if updated.get('status') != 'in_progress':
            raise RuntimeError('Phase status update did not persist')

        listing = self.api('GET', f'/goals/{goal_id}/phases')
        if not any(phase.get('id') == phase_id for phase in listing):
            raise RuntimeError('Phase missing from goal phases listing')

    def test_tasks_flow(self) -> None:
        phase_id = self._require_state('phase_id')
        payload = {
            'title': f'Task for phase {phase_id}',
            'description': 'Created via automated API test',
            'priority': 'high',
        }
        task = self.api('POST', f'/phases/{phase_id}/tasks', json=payload)
        task_id = task.get('id')
        if not task_id:
            raise RuntimeError('Task creation failed')
        self.state['task_id'] = task_id

        updated = self.api('PATCH', f'/tasks/{task_id}', json={'status': 'done'})
        if updated.get('status') != 'done':
            raise RuntimeError('Task status did not update to done')

        tasks = self.api('GET', f'/phases/{phase_id}/tasks')
        if not any(entry.get('id') == task_id for entry in tasks):
            raise RuntimeError('Task missing from phase listing')

        self.api('DELETE', f'/tasks/{task_id}')
        self.state.pop('task_id', None)

    def test_notes_modules(self) -> None:
        sample_payloads = [
            ('ideas', 'Idea'),
            ('knowledge', 'Knowledge'),
            ('important', 'Important Note'),
        ]
        for endpoint, label in sample_payloads:
            created = self.api(
                'POST',
                f'/{endpoint}',
                json={
                    'title': f'{label} Smoke {self.run_id}',
                    'content': 'Generated via automated smoke test.',
                    'priority': 'normal',
                },
            )
            note_id = created.get('id')
            listing = self.api('GET', f'/{endpoint}')
            if note_id and not any(item.get('id') == note_id for item in listing):
                raise RuntimeError(f'{endpoint} entry missing from listing')

    def test_habits_flow(self) -> None:
        habit_name = f'API Habit {self.run_id}'
        created = self.api('POST', '/habits', json={'name': habit_name})
        habit = created.get('habit') or {}
        habit_id = habit.get('id')
        if not habit_id:
            raise RuntimeError('Habit creation did not return an id')
        self.state['habit_name'] = habit_name

        log = self.api(
            'POST',
            '/habits/log',
            json={'name': habit_name, 'status': 1, 'date': date.today().isoformat()},
        )
        entry = log.get('log') or {}
        if entry.get('status') != 1:
            raise RuntimeError('Habit log status mismatch')

        habits = self.api('GET', '/habits')
        if not any(item.get('id') == habit_id for item in habits):
            raise RuntimeError('Habit missing from habit listing')

    def test_habit_logs_listing(self) -> None:
        logs = self.api('GET', '/habits/logs?days=7')
        if not isinstance(logs, list):
            raise RuntimeError('Habit logs endpoint did not return a list')

    def test_daily_logs(self) -> None:
        payload = {
            'log_date': date.today().isoformat(),
            'summary': 'Automated test entry',
            'mood': 'focused',
            'energy': 'high',
        }
        upserted = self.api('POST', '/daily/log', json=payload)
        if upserted.get('log_date') != payload['log_date']:
            raise RuntimeError('Daily log upsert failed')

        recent = self.api('GET', '/daily/logs?limit=5')
        if not any(entry.get('log_date') == payload['log_date'] for entry in recent):
            raise RuntimeError('Daily log entry missing from listing')

    def test_analytics(self) -> None:
        summary = self.api('GET', '/analytics')
        expected_keys = ['goals', 'tasks_total', 'tasks_done', 'task_trend', 'habit_streaks']
        if not all(key in summary for key in expected_keys):
            raise RuntimeError('Analytics response missing expected fields')

    def test_backup_export(self) -> None:
        export = self.api('GET', '/backup/export')
        backup = export.get('backup')
        if not isinstance(backup, dict) or 'tables' not in backup:
            raise RuntimeError('Backup export response malformed')
        self.state['backup_payload'] = backup

    def test_backup_import(self) -> None:
        backup = self.state.get('backup_payload')
        if not backup:
            raise RuntimeError('Backup payload missing. Run export first.')
        result = self.api('POST', '/backup/import', json={'backup': backup})
        if not isinstance(result.get('restored'), dict):
            raise RuntimeError('Backup import response missing restored stats')

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    def api(self, method: str, path: str, *, auth: bool = True, **kwargs: Any) -> Dict[str, Any]:
        url = f"{self.base_url}{path}"
        headers = kwargs.pop('headers', {})
        if auth:
            if not self.token:
                raise RuntimeError('Request requires auth but token is missing')
            headers.setdefault('Authorization', f'Bearer {self.token}')
        if 'json' in kwargs:
            headers.setdefault('Content-Type', 'application/json')
        response = self.session.request(method, url, headers=headers, timeout=self.timeout, **kwargs)
        try:
            payload = response.json()
        except ValueError:
            payload = {}
        if not response.ok:
            error = payload.get('error') if isinstance(payload, dict) else None
            raise RuntimeError(f"{method} {path} -> {response.status_code}: {error or response.text}")
        if isinstance(payload, dict) and 'data' in payload:
            return payload['data']
        return payload

    def cleanup(self) -> None:
        # Best-effort cleanup for entities created during the run.
        def safe_delete(path: str) -> None:
            try:
                self.api('DELETE', path)
            except Exception as exc:  # noqa: BLE001
                print(f"Cleanup warning: {exc}", file=sys.stderr)

        task_id = self.state.get('task_id')
        if task_id:
            safe_delete(f'/tasks/{task_id}')

        phase_id = self.state.get('phase_id')
        if phase_id:
            safe_delete(f'/phases/{phase_id}')

        goal_id = self.state.get('goal_id')
        if goal_id:
            safe_delete(f'/goals/{goal_id}')

    def _run_test(self, name: str, fn: Callable[[], None]) -> None:
        started = time.time()
        try:
            fn()
            duration = time.time() - started
            self.results.append(TestResult(name, True, 'ok', duration))
        except Exception as exc:  # noqa: BLE001
            duration = time.time() - started
            self.results.append(TestResult(name, False, str(exc), duration))

    def _require_state(self, key: str) -> Any:
        if key not in self.state:
            raise RuntimeError(f'Missing state value: {key}')
        return self.state[key]


def parse_args(argv: Optional[List[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='Run end-to-end smoke tests against the KAI API.')
    parser.add_argument(
        '--base-url',
        default=os.getenv('KAI_BASE_URL', 'http://localhost:8080'),
        help='Root URL of the running KAI server (default: http://localhost:8080)',
    )
    parser.add_argument(
        '--email',
        default=os.getenv('KAI_EMAIL', 'owner@kai.local'),
        help='Auth email (default: owner@kai.local)',
    )
    parser.add_argument(
        '--password',
        default=os.getenv('KAI_PASSWORD', 'secret123'),
        help='Auth password (default: secret123)',
    )
    parser.add_argument(
        '--timeout',
        type=float,
        default=float(os.getenv('KAI_TIMEOUT', '10')),
        help='HTTP timeout per request in seconds (default: 10)',
    )
    parser.add_argument(
        '--with-backup-import',
        action='store_true',
        help='Also POST the exported backup back into the database (destructive).',
    )
    return parser.parse_args(argv)


def main(argv: Optional[List[str]] = None) -> int:
    args = parse_args(argv)
    tester = KaiApiTester(
        base_url=args.base_url,
        email=args.email,
        password=args.password,
        timeout=args.timeout,
        include_backup_import=args.with_backup_import,
    )
    return tester.execute()


if __name__ == '__main__':
    sys.exit(main())
