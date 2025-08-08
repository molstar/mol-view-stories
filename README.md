## MolViewStories

A webapp to create beautiful, interactive molecular stories.

## Local Development (API + MinIO + Frontend)

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ and npm
- Free ports: 3000 (web), 5000 (API), 9000/9001 (MinIO)

### 1) Configure environment
- Copy the example config file and adjust if needed:
```bash
cp env.example .env.local
```

### 2) Start backend + MinIO
```bash
cd api
docker compose up -d --build
```
Verify:
- API health: `http://localhost:5000/ready`
- MinIO console: `http://localhost:9001` (user: `minioadmin`, pass: `minioadmin`)

Useful:
- Stop: `docker compose down`
- Reset data: `docker compose down -v`
- Logs: `docker compose logs -f api | cat`

### 3) Start the frontend
From the project root:
```bash
npm install
npm run dev
```
Open `http://localhost:3000`.

### Use Remote Dev/Prod Backend (no Docker needed)
- Edit `.env.local` and set one of the remote presets for `NEXT_PUBLIC_API_BASE_URL` (see `env.example`).
- Ensure `NEXT_PUBLIC_OIDC_AUTHORITY` and `NEXT_PUBLIC_OIDC_CLIENT_ID` are set.
- Start the frontend as usual (`npm run dev`).
- You do NOT need any `MINIO_*` or backend variables in this mode.

### Troubleshooting
- CORS issues: confirm `FRONTEND_URL=http://localhost:3000` in `.env.local`.
- Login does not work: make sure you're running on the `:3000` port, our 3rd party login page isn't accessible from any another port.


## Update MVS Types

To update `mvs-typing.ts` run

```bash
npm run mvs-types
```

## Switching Environments

Edit `.env.local` and set the API target:

```env
# Local backend (Docker Compose)
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000

# Dev backend
# NEXT_PUBLIC_API_BASE_URL=https://mol-view-stories-dev.dyn.cloud.e-infra.cz

# Prod backend
# NEXT_PUBLIC_API_BASE_URL=https://stories.molstar.org
```

## Pre-commit / PR Checks

Run these locally before pushing to ensure the PR pipeline passes.

### API (Python) – exact commands CI runs
- From repo root (use a virtual environment):

```bash
cd api
# Optional but recommended: create a virtual environment
python -m venv .venv
# macOS/Linux
source .venv/bin/activate
# Windows PowerShell
# .venv\\Scripts\\Activate.ps1

python -m pip install -r requirements.txt
python -m pip install flake8 black isort pytest

# flake8 (exclude your virtualenv)
python -m flake8 . --exclude .venv,venv --count --select=E9,F63,F7,F82 --show-source --statistics
python -m flake8 . --exclude .venv,venv --count --exit-zero --max-complexity=10 --max-line-length=127 --statistics

# black (check only)
python -m black --check --diff .

# isort (check only)
python -m isort --check-only --diff .

# tests + coverage (generates coverage.xml and htmlcov/)
python -m pytest tests/ -v --cov=. --cov-report=xml --cov-report=html
```

- To auto-fix formatting locally, optionally run:

```bash
python -m black .
python -m isort .
```

#### API endpoint tests (mocked)
- The API endpoint tests use the Flask test client and mock auth/storage, so MinIO or external OIDC are NOT required locally.

Run only the endpoint tests:

```bash
cd api
python -m pytest tests/test_api_endpoints.py -q
```

Run the full API test suite (unit + mocked API tests):

```bash
cd api
python -m pytest -q
```

Optional: use the helper script that also produces coverage reports:

```bash
cd api
python run_tests.py
```

### Frontend (optional, recommended locally)

If you changed the web app:

```bash
npm ci
npm run lint
# Optional: ensure a clean build
npm run build
```

Notes:
- The PR workflow `PR Validation` currently triggers on changes under `api/**` and runs the Python checks above.
- Use Python 3.11+ locally to match CI.
- The new mocked API endpoint tests (`api/tests/test_api_endpoints.py`) are already picked up by CI via `.github/workflows/pr-check.yml` (step: `python -m pytest tests/ ...`). No additional pipeline changes are required.
- If you want real end-to-end checks against a live stack, add a separate workflow or job that starts Docker Compose (or targets the dev cluster) and runs smoke tests. Keep the current mocked tests in PRs for speed and determinism.