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

## Deployments

### Environments

- **Production version**: Stable deployment (UI: GitHub Pages, API: Kubernetes) updated via manual GitHub workflow, available at `https://molstar.org/mol-view-stories/`
- **Development version**: Auto-deployed on merge to main branch (UI/API: Kubernetes) at `https://mol-view-stories-ui-dev.dyn.cloud.e-infra.cz/mol-view-stories/`

### CI/CD Pipeline

- **Branch pushes**: No pipeline triggered
- **PR creation**: Lint, build, tests, Docker image builds (no deployment)
- **Push/merge to main**: Auto-deploy to dev environment
- **Release tags** (`v*` or `release-*`): Automatic production deployment
- **Manual action**: Production deployment via [GitHub workflow](https://github.com/molstar/mol-view-stories/actions/workflows/deploy-web.yml)

**Release Process:**
1. Create and push a release tag: `git tag v1.2.3 && git push origin v1.2.3`
2. Both UI (GitHub Pages) and API (Kubernetes) automatically deploy
3. Version automatically appears in the UI based on the tag

### Storage

- Dev environment has separate MinIO storage
- Production storage is unaffected by deployments (data persists)

## Development Guide

### Quick Setup

```bash
# Frontend
npm install

# API (Python 3.11+)
cd api
python -m venv .venv
source .venv/bin/activate  # macOS/Linux
# .venv\Scripts\Activate.ps1  # Windows
pip install -r requirements.txt
pip install flake8 black isort pytest
cd ..
```

### Before Committing

**Always run these checks:**

```bash
# API checks
cd api && source .venv/bin/activate
flake8 . --exclude .venv,venv --count --select=E9,F63,F7,F82 --show-source --statistics
flake8 . --exclude .venv,venv --count --exit-zero --max-complexity=10 --max-line-length=127 --statistics
black --check --diff .
isort --check-only --diff .
python -m pytest tests/ -v
cd ..

# Frontend checks
npm run lint
npm run prettier:check
npm run build
```

**Auto-fix formatting:**
```bash
# API
cd api && source .venv/bin/activate
black . && isort .
cd ..
```

### Testing

```bash
# API tests (mocked - no external services needed)
cd api && source .venv/bin/activate
python -m pytest tests/ -v
cd ..

# Frontend
npm run lint
```

### Common Issues

- **API import errors**: Ensure virtual environment is activated
- **Frontend build errors**: `rm -rf node_modules package-lock.json && npm install`
- **Port conflicts**: Check `lsof -i :3000` (frontend), `lsof -i :5000` (API)
