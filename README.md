# MolViewStories

A framework for building beautiful molecular stories.

Online at https://molstar.org/mol-view-stories.

## Local Development (Quick Start)

### Requirements
- Node.js 20+ (Corepack recommended) for the web app
- Docker (with Docker Compose) for hosting backend locally
- Deno for CLI

### Frontend-only Setup

```bash
pnpm i
pnpm dev:web
```

### Frontend + Backend Setup
```bash
./setup-local-dev.sh
```

What the script does:
- Installs/activates pnpm via Corepack
- Creates `.env` from `env.example`
- Installs dependencies and builds the project
- Starts the API and MinIO via Docker Compose

### Access
- Web App: http://localhost:3000
- API: http://localhost:5000
- MinIO Console: http://localhost:9001 (minioadmin/minioadmin)