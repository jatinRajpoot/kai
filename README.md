# KAI Productivity Server

KAI is a lightweight PHP + MySQL workspace for single-user productivity. It exposes a public REST API plus a friendly dashboard UI for tracking Goals → Phases → Tasks, ideas, knowledge, important notes, habits, and daily logs. A single shared bearer token secures both the API and UI.

## Features

- Goal hierarchy (Goal → Phase → Task) with CRUD endpoints
- Auxiliary modules: Ideas, Knowledge, Important Notes
- Habit logging with streak analytics, daily journal, dashboard charts
- REST API backed by MySQL and PDO, lightweight PHP router
- Token-based authentication and login endpoint
- Responsive UI (vanilla JS + Chart.js) for manual use
- One-click JSON backup/export and import (API + UI)
- Dockerized deployment (PHP Apache + MySQL)

## Quickstart

1. Copy the environment template and adjust secrets as needed:

```bash
cp .env.example .env
```

2. Start the stack (requires Docker + Docker Compose):

```bash
docker compose up --build
```

3. Visit the dashboard at <http://localhost:8080/ui/>. Log in with the credentials from `.env` to fetch the shared API token.

4. Use the token for API calls:

```bash
curl -H "Authorization: Bearer <TOKEN>" http://localhost:8080/goals
```

## API Overview

| Endpoint | Method | Description |
| --- | --- | --- |
| `/auth/login` | POST | Retrieve the shared bearer token |
| `/goals` | GET/POST | List or create goals |
| `/goals/{id}` | GET/PATCH | View or update a goal |
| `/goals/{id}/phases` | GET/POST | List or create phases under a goal |
| `/phases/{id}` | PATCH | Update a phase |
| `/phases/{id}/tasks` | GET/POST | List or create tasks for a phase |
| `/tasks/{id}` | PATCH | Update a task |
| `/ideas`, `/knowledge`, `/important` | GET/POST | Manage note collections |
| `/habits/log` | POST | Log a habit status |
| `/habits/logs` | GET | Recent habit log entries |
| `/daily/log` | POST | Add/update a daily summary |
| `/daily/logs` | GET | Paginated daily logs |
| `/analytics` | GET | Summary stats + streak metrics |
| `/backup/export` | GET | Download a JSON snapshot of every table |
| `/backup/import` | POST | Restore tables from a previously exported snapshot |

All endpoints besides `/auth/login` require the bearer token: `Authorization: Bearer <token>`.

▶️ A richer, human-friendly reference (request/response samples, field notes, and error codes) lives at `/ui/api-docs.html` once the dev server is running.

### Backup & Restore

- **Export**: call `GET /backup/export` (with the bearer token) to receive `{ filename, backup }`. Persist `backup` to disk as JSON, or use the dashboard's "Create Backup" button which performs the same flow and downloads a `.json` file.
- **Import**: send `POST /backup/import` with a JSON body `{ "backup": <contents of the exported file> }`. The UI provides an upload form that reads the file client-side and posts it for you. Only tables present in the payload are truncated/re-seeded, so you can scope a backup if needed by editing the JSON manually.

## Database

`db/schema.sql` defines the MySQL schema and is auto-applied when `mysql` starts (via Docker volume bind). Use the `mysql_data` volume to persist data locally.

## Development Scripts

Composer scripts are available:

```bash
composer serve   # Run PHP dev server on :8000 (requires PHP locally)
composer lint    # Syntax check PHP files
```

## Testing & Verification

This repository currently relies on manual/API testing. You can extend with PHPUnit or Pest as needed. When running locally without Docker, ensure PHP 8.1+ with `pdo_mysql` is installed and create the `.env` file.

### Python API Smoke Test

There is a convenience script under `scripts/test_api.py` that logs in and exercises every public endpoint (goal/phase/task CRUD, note modules, habits, daily logs, analytics, and backup export). It requires Python 3.10+ and the `requests` package:

```bash
python3 -m pip install --user requests
python3 scripts/test_api.py --base-url http://localhost:8080 --email owner@kai.local --password secret123
```

Use `--with-backup-import` to POST the exported snapshot back into MySQL (this truncates the tables referenced in the backup payload, so keep it for dedicated test databases). Environment variables `KAI_BASE_URL`, `KAI_EMAIL`, and `KAI_PASSWORD` can override the defaults without passing CLI flags.
